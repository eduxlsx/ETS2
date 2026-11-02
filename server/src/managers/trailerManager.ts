/**
 * Trailer Manager — dados do implemento e distância percorrida com cada
 * reboque (calculada localmente: o SDK não tem odômetro de reboque).
 */
import type { Settings, TrailerData } from '../../../shared/types.js';
import { resolveTrailerModel } from '../../../shared/vehicles.js';
import type { Database } from '../db/database.js';
import { num, positive, text } from '../parser/validate.js';
import type { RawTelemetry } from '../sdk/raw.js';

export class TrailerManager {
  private distances = new Map<string, number>();
  private pending = new Map<string, number>();
  private lastFlush = 0;

  constructor(private readonly db: Database | null) {}

  private keyOf(raw: RawTelemetry): string | null {
    const t = raw.trailers[0];
    if (!t) return null;
    const id = text(t.id);
    if (!id) return null;
    return `${id}|${text(t.licensePlate) ?? ''}`;
  }

  private loadDistance(key: string): number {
    if (this.distances.has(key)) return this.distances.get(key)!;
    let d = 0;
    if (this.db) {
      const row = this.db.get<{ distance_km: number }>('SELECT distance_km FROM trailers WHERE trailer_key = ?', key);
      d = row ? Number(row.distance_km) : 0;
    }
    this.distances.set(key, d);
    return d;
  }

  build(raw: RawTelemetry, settings: Settings, deltaKm: number, now = Date.now()): TrailerData {
    const t = raw.trailers[0];
    const attachedCount = raw.trailers.filter((x) => x.attached).length;
    const key = this.keyOf(raw);
    const attached = t ? t.attached : null;

    let localDistanceKm: number | null = null;
    if (key) {
      let d = this.loadDistance(key);
      if (attached && deltaKm > 0) {
        d += deltaKm;
        this.distances.set(key, d);
        this.pending.set(key, (this.pending.get(key) ?? 0) + deltaKm);
        if (this.db && !this.pending.has(key + ':seen')) {
          this.pending.set(key + ':seen', 0);
          this.db.run(
            `INSERT INTO trailers(trailer_key, name, brand, body_type, first_seen, last_seen) VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(trailer_key) DO UPDATE SET last_seen = excluded.last_seen`,
            key, text(t.name), text(t.brand), text(t.bodyType), now, now,
          );
        }
      }
      localDistanceKm = d;
    }
    if (now - this.lastFlush > 10000) this.flush(now);

    const detected = t ? resolveTrailerModel(text(t.bodyType), text(t.id), text(t.cargoAccessoryId)) : null;
    return {
      attached,
      count: attachedCount,
      id: t ? text(t.id) : null,
      name: t ? text(t.name) : null,
      brand: t ? text(t.brand) : null,
      bodyType: t ? text(t.bodyType) : null,
      chainType: t ? text(t.chainType) : null,
      cargoAccessoryId: t ? text(t.cargoAccessoryId) : null,
      licensePlate: t ? text(t.licensePlate) : null,
      cargoName: raw.onJob ? text(raw.cargo) : null,
      cargoMassKg: raw.isCargoLoaded ? positive(raw.cargoMass, 200000) : raw.onJob ? null : 0,
      cargoLoaded: raw.isCargoLoaded,
      wheelCount: t ? num(t.wheelCount, 0, 16) : null,
      localDistanceKm,
      modelKey: settings.trailerModel !== 'auto' ? settings.trailerModel : detected ?? 'box',
      modelSource: settings.trailerModel !== 'auto' ? 'manual' : detected ? 'auto' : 'fallback',
    };
  }

  flush(now = Date.now()): void {
    this.lastFlush = now;
    if (!this.db) return;
    for (const [key, km] of this.pending) {
      if (key.endsWith(':seen') || km <= 0) continue;
      this.db.run('UPDATE trailers SET distance_km = distance_km + ?, last_seen = ? WHERE trailer_key = ?', km, now, key);
      this.pending.set(key, 0);
    }
  }
}
