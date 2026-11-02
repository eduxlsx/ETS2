import { describe, expect, it } from 'vitest';
import { Database } from '../src/db/database.js';
import { TripManager, type TripInput } from '../src/managers/tripManager.js';

const base: TripInput = { timestamp: 0, paused: false, speedKmh: 90, odometerKm: 1000, fuelL: 500 };

function drive(trip: TripManager, steps: number, opts: { t0?: number; odo0?: number; fuel0?: number; kmh?: number; paused?: boolean } = {}) {
  const kmh = opts.kmh ?? 90;
  let t = opts.t0 ?? 0;
  let odo = opts.odo0 ?? 1000;
  let fuel = opts.fuel0 ?? 500;
  for (let i = 0; i <= steps; i++) {
    trip.update({ ...base, timestamp: t, odometerKm: odo, fuelL: fuel, speedKmh: kmh, paused: !!opts.paused });
    t += 100;
    if (!opts.paused) {
      odo += (kmh * 0.1) / 3600;
      fuel -= 0.001;
    }
  }
  return { t, odo, fuel };
}

describe('TripManager', () => {
  it('soma a distância pelo delta do odômetro real', () => {
    const trip = new TripManager(null);
    drive(trip, 400); // 40 s a 90 km/h = 1 km
    const s = trip.snapshot(40_000);
    expect(s.distanceKm).toBeCloseTo(1, 2);
    expect(s.drivingTimeS).toBeCloseTo(40, 0);
    expect(s.avgSpeedKmh).toBeCloseTo(90, 0);
    expect(s.fuelUsedL).toBeCloseTo(0.4, 2);
    expect(s.maxSpeedKmh).toBe(90);
  });

  it('zerar o trip não depende nem altera o odômetro', () => {
    const trip = new TripManager(null);
    const end = drive(trip, 400);
    trip.reset();
    expect(trip.snapshot().distanceKm).toBe(0);
    drive(trip, 400, { t0: end.t, odo0: end.odo, fuel0: end.fuel });
    expect(trip.snapshot().distanceKm).toBeCloseTo(1, 2);
    expect(trip.snapshot().sessionDistanceKm).toBe(0); // sem sessão aberta, sessão não acumula baseline
  });

  it('ignora reabastecimento e saltos de odômetro (troca de caminhão/teleporte)', () => {
    const trip = new TripManager(null);
    trip.update({ ...base, timestamp: 0 });
    trip.update({ ...base, timestamp: 100, fuelL: 800 }); // reabasteceu
    trip.update({ ...base, timestamp: 200, odometerKm: 5000, fuelL: 800 }); // salto
    trip.update({ ...base, timestamp: 300, odometerKm: 5000.0025, fuelL: 799.99 });
    const s = trip.snapshot();
    expect(s.fuelUsedL).toBeCloseTo(0.01, 3);
    expect(s.distanceKm).toBeCloseTo(0.0025, 4);
  });

  it('escala do mapa: odômetro ~15× mais rápido é aceito e a média usa a velocidade real', () => {
    const trip = new TripManager(null);
    let odo = 1000;
    for (let i = 0; i <= 400; i++) {
      trip.update({ ...base, timestamp: i * 50, odometerKm: odo, speedKmh: 90, scale: 15.56 });
      odo += ((90 * 0.05) / 3600) * 15.56; // 20 Hz, km do jogo
    }
    const s = trip.snapshot();
    expect(s.distanceKm).toBeCloseTo(0.5 * 15.56, 1); // 20 s a 90 km/h reais = 0,5 km real
    expect(s.avgSpeedKmh).toBeCloseTo(90, 0);
  });

  it('pausado não conta tempo nem distância', () => {
    const trip = new TripManager(null);
    drive(trip, 100, { paused: true });
    expect(trip.snapshot().drivingTimeS).toBe(0);
    expect(trip.snapshot().distanceKm).toBe(0);
  });

  it('persiste no SQLite e restaura após reiniciar', () => {
    const db = new Database(':memory:');
    const a = new TripManager(db, { persistEveryMs: 1000, sampleEveryMs: 1000 });
    a.startSession({ truckKey: 'x', truckName: 'X' });
    drive(a, 400);
    a.persist(true);
    const b = new TripManager(db);
    expect(b.snapshot().distanceKm).toBeCloseTo(1, 2);
    expect(Number(db.get<any>('SELECT COUNT(*) AS n FROM samples')!.n)).toBeGreaterThan(0);
    b.reset();
    const rows = db.all<any>('SELECT * FROM trips ORDER BY id');
    expect(rows.filter((r) => r.is_current === 1)).toHaveLength(1);
    expect(rows.some((r) => r.ended_at !== null && r.distance_km > 0.9)).toBe(true);
    db.close();
  });
});
