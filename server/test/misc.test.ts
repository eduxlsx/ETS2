import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../shared/types.js';
import { TRAILER_KEYS, TRAILER_RULES, resolveTrailerModel, resolveVehicleModel } from '../../shared/vehicles.js';
import { toCsv } from '../src/managers/historyService.js';
import { sanitizeSettings } from '../src/managers/settingsService.js';
import { parseTasklist } from '../src/sdk/gameProcess.js';

describe('identificação do modelo 2D', () => {
  const cases: [string, string, string, string][] = [
    ['scania', 'vehicle.scania.r', 'R', 'scania-r'],
    ['scania', 'vehicle.scania.r_2016', 'R', 'scania-r'],
    ['scania', 'vehicle.scania.streamline', 'Streamline', 'scania-r'],
    ['scania', 'vehicle.scania.s_2016', 'S', 'scania-s'],
    ['volvo', 'vehicle.volvo.fh16', 'FH16', 'volvo-fh3'],
    ['volvo', 'vehicle.volvo.fh16_2012', 'FH16 2012', 'volvo-fh4'],
    ['volvo', 'vehicle.volvo.fh_2021', 'FH', 'volvo-fh5'],
    ['mercedes', 'vehicle.mercedes.actros', 'Actros', 'mercedes-actros'],
    ['mercedes', 'vehicle.mercedes.actros2014', 'Actros', 'mercedes-actros-mp4'],
    ['volkswagen', 'vehicle.volkswagen.meteor', 'Meteor', 'vw-meteor'],
    ['daf', 'vehicle.daf.xf', 'XF', 'daf-xf'],
    ['daf', 'vehicle.daf.xf_euro6', 'XF Euro 6', 'daf-xf'],
    ['daf', 'vehicle.daf.xg', 'XG+', 'daf-xg'],
  ];
  it.each(cases)('%s %s → %s', (brand, id, name, expected) => {
    expect(resolveVehicleModel(brand, id, name)).toEqual({ key: expected, exact: true });
  });
  it('marca conhecida sem regra → aproximado; desconhecido → genérico', () => {
    expect(resolveVehicleModel('renault', 'vehicle.renault.t', 'T')).toEqual({ key: 'generic', exact: false });
    expect(resolveVehicleModel('scania_mod', 'vehicle.x', 'Y').exact).toBe(true);
    expect(resolveVehicleModel(null, null, null)).toEqual({ key: 'generic', exact: false });
  });
  it('tipo de reboque', () => {
    expect(resolveTrailerModel('dryvan', null, null)).toBe('box');
    expect(resolveTrailerModel('curtainside', null, null)).toBe('curtain');
    expect(resolveTrailerModel('food_tank', null, null)).toBe('tanker');
    expect(resolveTrailerModel('refrigerated', null, null)).toBe('reefer');
    expect(resolveTrailerModel('flatbed', null, null)).toBe('flatbed');
    expect(resolveTrailerModel(null, null, null)).toBeNull();
  });
  it.each([
    ['dryvan', null, null, 'box'],
    ['insulated', null, null, 'box'],
    ['curtainside', null, null, 'curtain'],
    ['refrigerated', null, null, 'reefer'],
    ['flatbed', null, null, 'flatbed'],
    ['fuel_tank', null, null, 'tanker'],
    ['chemtank', null, null, 'tanker'],
    ['foodtank', null, null, 'tanker'],
    ['gastank', null, null, 'tanker'],
    ['lowloader', null, null, 'lowbed'],
    [null, 'scs.lowloader.double', null, 'lowbed'],
    ['flatbed', null, 'cargo.excavator', 'lowbed'],
    ['log', null, null, 'log'],
    [null, 'scs.log.single', 'cargo.logs', 'log'],
    ['container', null, null, 'container'],
    [null, 'scs.container.40ft', null, 'container'],
    ['silo', null, null, 'bulk'],
    [null, 'scs.silo.cement', null, 'bulk'],
    ['dumper', null, null, 'tipper'],
    [null, 'scs.gravel.dumper', null, 'tipper'],
    ['car_transporter', null, null, 'car_transporter'],
    [null, 'scs.car_transporter.single', null, 'car_transporter'],
    ['livestock', null, null, 'livestock'],
    [null, 'scs.cattle.trailer', null, 'livestock'],
  ] as const)('reboque body_type=%s id=%s acessório=%s → %s', (b, id, acc, expected) => {
    expect(resolveTrailerModel(b, id, acc)).toBe(expected);
  });
  it('silo e cimento não caem mais em tanque; prancha rebaixada/toras/contêiner têm desenho próprio', () => {
    expect(resolveTrailerModel('cement', null, null)).toBe('bulk');
    expect(resolveTrailerModel('overweight', null, null)).toBe('lowbed');
    expect(resolveTrailerModel('xyz_unknown', null, null)).toBeNull();
  });
  it('todo tipo do catálogo tem regra', () => {
    for (const k of TRAILER_KEYS) expect(TRAILER_RULES.some((r) => r.key === k)).toBe(true);
  });
});

describe('configurações', () => {
  it('saneia valores inválidos', () => {
    const s = sanitizeSettings({ speedUnit: 'xyz' as any, updateRateHz: 999, alerts: { fuelPercent: -5 } as any });
    expect(s.speedUnit).toBe('kmh');
    expect(s.updateRateHz).toBe(60);
    expect(s.alerts.fuelPercent).toBe(0);
    expect(s.alerts.wearPercent).toBe(DEFAULT_SETTINGS.alerts.wearPercent);
  });
  it('capacidade manual pode ser removida (null)', () => {
    expect(sanitizeSettings({ fuelCapacityOverrideL: 600 }).fuelCapacityOverrideL).toBe(600);
    expect(sanitizeSettings({ fuelCapacityOverrideL: null }, { ...DEFAULT_SETTINGS, fuelCapacityOverrideL: 600 }).fuelCapacityOverrideL).toBeNull();
  });
});

describe('utilidades', () => {
  it('CSV com escape', () => {
    expect(toCsv([{ a: 1, b: 'x,y' }, { a: null, b: 'q"z' }])).toBe('a,b\r\n1,"x,y"\r\n,"q""z"\r\n');
  });
  it('detecta processo do jogo na saída do tasklist', () => {
    expect(parseTasklist('"explorer.exe","1"\r\n"eurotrucks2.exe","2"')).toBe('eurotrucks2.exe');
    expect(parseTasklist('"amtrucks.exe","3"')).toBe('amtrucks.exe');
    expect(parseTasklist('"chrome.exe","4"')).toBeNull();
  });
});
