import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../shared/types';
import { consumption, distance, duration, fuel, pressure, speed, temp } from '../src/lib/format';
import { getState, ingestFrame } from '../src/lib/telemetryStore';
import { emptyFrame } from './fixtures';

describe('formatação e unidades', () => {
  it('converte unidades', () => {
    expect(speed(100, { speedUnit: 'mph' }).text).toBe('62');
    expect(distance(10, { distanceUnit: 'mi' }).value).toBeCloseTo(6.21, 2);
    expect(fuel(100, { fuelUnit: 'gal' }).value).toBeCloseTo(26.4, 1);
    expect(temp(100, { temperatureUnit: 'f' }).text).toBe('212');
    expect(pressure(100, { pressureUnit: 'bar' }).text).toBe('6,9');
    expect(consumption(30, DEFAULT_SETTINGS).unit).toBe('L/100km');
    expect(consumption(30, { ...DEFAULT_SETTINGS, fuelUnit: 'gal' }).value).toBeCloseTo(7.84, 1);
  });
  it('N/D para valores ausentes', () => {
    expect(speed(null, DEFAULT_SETTINGS).text).toBe('N/D');
    expect(duration(null)).toBe('N/D');
    expect(duration(3725)).toBe('1h 02min');
  });
});

describe('store — nunca mistura DEMO com dados reais', () => {
  it('descarta a série ao trocar a origem', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) {
      const f = emptyFrame();
      f.timestamp = t0 + i * 1000;
      f.motion.speedKmh = 50;
      f.game.paused = false;
      ingestFrame(f);
    }
    expect(getState().series).toHaveLength(5);
    expect(getState().seriesSource).toBe('live');

    const d = emptyFrame();
    d.source = 'demo';
    d.connection.state = 'demo';
    d.timestamp = t0 + 10_000;
    d.motion.speedKmh = 99;
    ingestFrame(d);
    expect(getState().seriesSource).toBe('demo');
    expect(getState().series.map((p) => p.speed)).toEqual([99]);
  });

  it('não registra pontos sem conexão nem com o jogo pausado', () => {
    const f = emptyFrame();
    f.source = 'live';
    f.connection.state = 'game-not-running';
    f.timestamp = 5_000_000;
    ingestFrame(f);
    const before = getState().series.length;
    const p = emptyFrame();
    p.game.paused = true;
    p.timestamp = 5_010_000;
    ingestFrame(p);
    expect(getState().series.length).toBe(before);
  });
});
