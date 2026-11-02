/** Consultas de histórico/relatórios e exportação CSV/JSON. */
import type { Database } from '../db/database.js';

export type ReportKind = 'trips' | 'sessions' | 'trucks' | 'trailers' | 'samples' | 'jobs' | 'documents' | 'ledger';

const QUERIES: Record<ReportKind, string> = {
  jobs: `SELECT * FROM jobs ORDER BY id DESC LIMIT ?`,
  documents: `SELECT id, job_id, type, number, access_key, status, game_min, title, data_json, signature_json IS NOT NULL AS signed, stamps_json, created_at
            FROM documents ORDER BY id DESC LIMIT ?`,
  ledger: `SELECT id, job_id, document_id, game_min, kind, label, amount_eur, source, created_at FROM ledger ORDER BY id DESC LIMIT ?`,
  trips: `SELECT id, started_at, ended_at, distance_km, driving_s, fuel_used_l, max_speed_kmh,
            CASE WHEN distance_km > 0.5 THEN fuel_used_l / distance_km * 100 END AS avg_consumption_l100,
            CASE WHEN driving_s > 5 THEN speed_distance_km / (driving_s / 3600.0) END AS avg_speed_kmh,
            truck_key, truck_name, is_current
          FROM trips ORDER BY id DESC LIMIT ?`,
  sessions: `SELECT id, started_at, ended_at, distance_km, driving_s, fuel_used_l, max_speed_kmh,
            CASE WHEN distance_km > 0.5 THEN fuel_used_l / distance_km * 100 END AS avg_consumption_l100,
            start_odometer_km, end_odometer_km, truck_key, truck_name, game_version
          FROM sessions ORDER BY id DESC LIMIT ?`,
  trucks: 'SELECT * FROM trucks ORDER BY last_seen DESC LIMIT ?',
  trailers: 'SELECT * FROM trailers ORDER BY last_seen DESC LIMIT ?',
  samples: 'SELECT ts, trip_id, session_id, speed_kmh, fuel_l, odometer_km, consumption_l100, rpm FROM samples ORDER BY ts DESC LIMIT ?',
};

export class HistoryService {
  constructor(private readonly db: Database) {}

  list(kind: ReportKind, limit = 500): Record<string, unknown>[] {
    return this.db.all(QUERIES[kind], Math.min(Math.max(1, limit), 100000)) as Record<string, unknown>[];
  }

  samples(sinceMs: number, tripId?: number): Record<string, unknown>[] {
    if (tripId !== undefined) {
      return this.db.all('SELECT ts, speed_kmh, fuel_l, consumption_l100, rpm FROM samples WHERE trip_id = ? ORDER BY ts', tripId);
    }
    return this.db.all('SELECT ts, speed_kmh, fuel_l, consumption_l100, rpm FROM samples WHERE ts >= ? ORDER BY ts', sinceMs);
  }

  summary() {
    const s = this.db.get<any>(
      `SELECT COALESCE(SUM(distance_km),0) AS distance_km, COALESCE(SUM(driving_s),0) AS driving_s,
              COALESCE(SUM(fuel_used_l),0) AS fuel_used_l, COALESCE(MAX(max_speed_kmh),0) AS max_speed_kmh,
              COUNT(*) AS sessions FROM sessions`,
    );
    const trips = this.db.get<any>('SELECT COUNT(*) AS n FROM trips WHERE is_current = 0');
    const trucks = this.db.get<any>('SELECT COUNT(*) AS n FROM trucks');
    return {
      totalDistanceKm: Number(s.distance_km),
      totalDrivingS: Number(s.driving_s),
      totalFuelUsedL: Number(s.fuel_used_l),
      maxSpeedKmh: Number(s.max_speed_kmh),
      avgConsumptionL100: s.distance_km > 0.5 ? (s.fuel_used_l / s.distance_km) * 100 : null,
      sessions: Number(s.sessions),
      closedTrips: Number(trips.n),
      trucks: Number(trucks.n),
    };
  }

  /** Remove amostras antigas para o banco não crescer indefinidamente. */
  prune(keepDays = 90): void {
    this.db.run('DELETE FROM samples WHERE ts < ?', Date.now() - keepDays * 86400000);
  }
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'bigint' ? v.toString() : String(v);
    return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\r\n') + '\r\n';
}
