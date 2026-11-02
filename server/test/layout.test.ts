import { describe, expect, it } from 'vitest';
import { compileLayout } from '../src/sdk/layout.js';
import { REV12_TOTAL_SIZE, rev12Layout, rev12TrailerLayout } from '../src/sdk/layouts/rev12.js';

describe('layout rev12 (scs-telemetry-common.hpp)', () => {
  it('cada zona ocupa exatamente os bytes do header (zona menos o buffer de padding)', () => {
    const used = Object.fromEntries(rev12Layout.zones.map((z) => [z.name, z.used]));
    expect(used).toEqual({
      'z1.control': 40,
      'z2.uint': 460 - 48,
      'z3.int': 200 - 56,
      'z4.float': 800 - 28,
      'z5.bool': 140 - 25,
      'z6.fvector': 360 - 60,
      'z7.fplacement': 200 - 152,
      'z8.dplacement': 100 - 52,
      'z9.string': 1700 - 20,
      'z10.ull': 8,
      'z11.ll': 48,
      'z12.special': 10,
      'z13.substances': 1600,
    });
  });

  it('reboque tem 1560 bytes com as zonas corretas', () => {
    const used = Object.fromEntries(rev12TrailerLayout.zones.map((z) => [z.name, z.used]));
    expect(used).toEqual({
      'trailer.bool': 81,
      'trailer.uint': 68,
      'trailer.float': 464,
      'trailer.fvector': 252,
      'trailer.dplacement': 48,
      'trailer.string': 640,
    });
    expect(rev12TrailerLayout.size).toBe(1560);
    expect(REV12_TOTAL_SIZE).toBe(21600);
  });

  it('offsets conhecidos', () => {
    const off = (n: string) => rev12Layout.fields.get(n)!.offset;
    expect(off('paused')).toBe(4);
    expect(off('time')).toBe(8);
    expect(off('telemetry_plugin_revision')).toBe(40);
    expect(off('time_abs')).toBe(64);
    expect(off('restStop')).toBe(500);
    expect(off('scale')).toBe(700);
    expect(off('fuelCapacity')).toBe(704);
    expect(off('parkBrake')).toBe(1566);
    expect(off('truckBrandId')).toBe(2300);
    expect(off('jobIncome')).toBe(4000);
    expect(off('onJob')).toBe(4300);
    expect(off('substance')).toBe(4400);
  });

  it('rejeita zona que extrapola o limite', () => {
    expect(() => compileLayout([{ name: 'x', start: 0, end: 4, fields: [{ name: 'a', type: 'f64' }] }])).toThrow(/extrapola/);
  });

  it('rejeita campo desalinhado', () => {
    expect(() =>
      compileLayout([{ name: 'x', start: 0, end: 16, fields: [{ name: 'a', type: 'bool' }, { name: 'b', type: 'u32' }] }]),
    ).toThrow(/desalinhado/);
  });
});
