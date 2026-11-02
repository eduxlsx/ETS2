import { describe, expect, it } from 'vitest';
import { createParserContext, dayPhase, formatGameTime, gearLabel, parseRaw, rearWheels } from '../src/parser/dataParser.js';
import { num, text } from '../src/parser/validate.js';
import { emptyRaw, emptyWheel } from '../src/engine/demoSimulator.js';

describe('validação', () => {
  it('descarta NaN, infinito e fora da faixa', () => {
    expect(num(NaN)).toBeNull();
    expect(num(Infinity)).toBeNull();
    expect(num(500, 0, 100)).toBeNull();
    expect(num(50, 0, 100)).toBe(50);
  });
  it('limpa strings e rejeita bytes inválidos', () => {
    expect(text('  abc\u0001 ')).toBe('abc');
    expect(text('')).toBeNull();
    expect(text('a�b')).toBeNull();
  });
});

describe('Data Parser', () => {
  it('converte velocidade e limite (m/s → km/h) e marca excesso', () => {
    const raw = { ...emptyRaw(), speed: 25, speedLimit: 22.2222 };
    const p = parseRaw(raw, createParserContext());
    expect(p.motion.speedKmh).toBeCloseTo(90, 1);
    expect(p.motion.speedLimitKmh).toBe(80);
    expect(p.motion.overLimit).toBe(true);
  });

  it('limite 0 (sem informação) vira N/D e ré conta como velocidade positiva', () => {
    const p = parseRaw({ ...emptyRaw(), speed: -3, speedLimit: 0 }, createParserContext());
    expect(p.motion.speedLimitKmh).toBeNull();
    expect(p.motion.speedKmh).toBeCloseTo(10.8, 1);
  });

  it('valores inválidos viram null em vez de serem inventados', () => {
    const p = parseRaw({ ...emptyRaw(), engineRpm: NaN, waterTemperature: 9999, fuelCapacity: 0, fuel: 100 }, createParserContext());
    expect(p.engine.rpm).toBeNull();
    expect(p.engine.waterTempC).toBeNull();
    expect(p.fuel.capacityLiters).toBeNull();
    expect(p.fuel.percent).toBeNull();
  });

  it('combustível: percentual, capacidade do SDK ou manual, consumo L/100km', () => {
    const ctx = createParserContext();
    const raw = { ...emptyRaw(), fuel: 200, fuelCapacity: 800, fuelAvgConsumption: 0.32 };
    let p = parseRaw(raw, ctx);
    expect(p.fuel.percent).toBe(25);
    expect(p.fuel.capacitySource).toBe('sdk');
    expect(p.fuel.avgConsumptionL100).toBeCloseTo(32);
    ctx.fuelCapacityOverrideL = 400;
    p = parseRaw(raw, ctx);
    expect(p.fuel.percent).toBe(50);
    expect(p.fuel.capacitySource).toBe('manual');
  });

  it('chuva, intensidade e estágio do limpador nunca são inventados', () => {
    const p = parseRaw({ ...emptyRaw(), wipers: true }, createParserContext());
    expect(p.wipers).toEqual({ on: true, stage: null });
    expect(p.environment.rain).toBeNull();
    expect(p.environment.rainIntensityPct).toBeNull();
    expect(p.environment.visibility).toBeNull();
  });

  it('marcha exibida', () => {
    expect(gearLabel(0, 2)).toBe('N');
    expect(gearLabel(7, 2)).toBe('7');
    expect(gearLabel(-1, 1)).toBe('R');
    expect(gearLabel(-2, 4)).toBe('R2');
    expect(gearLabel(null, 2)).toBe('—');
  });

  it('horário do jogo e fase do dia', () => {
    expect(formatGameTime(1440 * 2 + 13 * 60 + 5)).toEqual({ label: '13:05', weekday: 'Quarta', hour: 13 });
    expect(dayPhase(3)).toBe('madrugada');
    expect(dayPhase(20)).toBe('noite');
  });

  it('luzes auxiliares: níveis 0/1/2 e valores inválidos → null', () => {
    expect(parseRaw({ ...emptyRaw(), lightsAuxFront: 1, lightsAuxRoof: 2 }, createParserContext()).lights).toMatchObject({ auxFront: 1, auxRoof: 2 });
    expect(parseRaw({ ...emptyRaw(), lightsAuxFront: 7 }, createParserContext()).lights.auxFront).toBeNull();
  });

  it('suspensão: média da traseira usa só os eixos traseiros e superfícies vêm das substâncias', () => {
    const wheels = [
      { ...emptyWheel(), positionZ: -1.5, suspDeflection: 0.5, substance: 1 },
      { ...emptyWheel(), positionZ: 2.0, suspDeflection: 0.02, substance: 1 },
      { ...emptyWheel(), positionZ: 3.4, suspDeflection: 0.04, substance: 2 },
    ];
    const p = parseRaw({ ...emptyRaw(), wheels, substances: ['static', 'road', 'dirt'] }, createParserContext());
    expect(rearWheels(p.suspension.truckWheels)).toHaveLength(2);
    expect(p.suspension.truckRearAvgDeflection).toBeCloseTo(0.03);
    expect(p.environment.roadSurfaces).toEqual(['asfalto', 'terra']);
  });
});
