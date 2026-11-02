/**
 * Persistência em SQLite usando o módulo nativo `node:sqlite` (Node ≥ 22.13),
 * sem dependência de compilação nativa. Guarda configurações, Trip atual,
 * histórico de viagens/sessões, amostras para gráficos e veículos usados.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';
import { DATA_DIR, ensureDir } from '../util/paths.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('db');
// carregado via require para não ser reescrito por bundlers/test runners que desconhecem "node:sqlite"
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

const SCHEMA_VERSION = 3;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  distance_km REAL NOT NULL DEFAULT 0,
  speed_distance_km REAL NOT NULL DEFAULT 0,
  driving_s REAL NOT NULL DEFAULT 0,
  fuel_used_l REAL NOT NULL DEFAULT 0,
  max_speed_kmh REAL NOT NULL DEFAULT 0,
  truck_key TEXT,
  truck_name TEXT,
  is_current INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  distance_km REAL NOT NULL DEFAULT 0,
  speed_distance_km REAL NOT NULL DEFAULT 0,
  driving_s REAL NOT NULL DEFAULT 0,
  fuel_used_l REAL NOT NULL DEFAULT 0,
  max_speed_kmh REAL NOT NULL DEFAULT 0,
  start_odometer_km REAL,
  end_odometer_km REAL,
  truck_key TEXT,
  truck_name TEXT,
  game_version TEXT
);
CREATE TABLE IF NOT EXISTS samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  trip_id INTEGER,
  session_id INTEGER,
  speed_kmh REAL,
  fuel_l REAL,
  odometer_km REAL,
  consumption_l100 REAL,
  rpm REAL
);
CREATE INDEX IF NOT EXISTS idx_samples_ts ON samples(ts);
CREATE INDEX IF NOT EXISTS idx_samples_trip ON samples(trip_id);
CREATE TABLE IF NOT EXISTS trucks (
  truck_key TEXT PRIMARY KEY,
  brand TEXT,
  name TEXT,
  model_key TEXT,
  license_plate TEXT,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  distance_km REAL NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS trailers (
  trailer_key TEXT PRIMARY KEY,
  name TEXT,
  brand TEXT,
  body_type TEXT,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  distance_km REAL NOT NULL DEFAULT 0
);
-- v3: documentos simulados, carteira, jornada (DOCUMENTOS-SPEC §2.2)
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER REFERENCES trips(id),
  started_game_min INTEGER NOT NULL,
  deadline_game_min INTEGER,
  finished_game_min INTEGER,
  status TEXT NOT NULL,
  cargo_id TEXT, cargo TEXT, mass_kg REAL, units INTEGER,
  src_city TEXT, src_company TEXT, dst_city TEXT, dst_company TEXT,
  income_eur INTEGER, planned_km REAL,
  delivered_revenue_eur INTEGER, delivered_damage REAL, delivered_km REAL,
  delivered_time_min INTEGER, earned_xp INTEGER, autopark INTEGER, autoload INTEGER,
  cancel_penalty_eur INTEGER,
  truck_plate TEXT, truck_plate_country TEXT, trailer_plate TEXT, truck_name TEXT,
  rating REAL,
  checklist_json TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER REFERENCES jobs(id),
  type TEXT NOT NULL,
  number INTEGER, access_key TEXT,
  status TEXT NOT NULL,
  game_min INTEGER NOT NULL,
  title TEXT,
  data_json TEXT NOT NULL,
  signature_json TEXT,
  stamps_json TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS documents_job ON documents(job_id);
CREATE INDEX IF NOT EXISTS documents_type ON documents(type, created_at);
CREATE TABLE IF NOT EXISTS doc_counters (model TEXT PRIMARY KEY, next INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER, document_id INTEGER,
  game_min INTEGER NOT NULL, kind TEXT NOT NULL,
  label TEXT NOT NULL, amount_eur REAL NOT NULL, source TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS duty_segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_day INTEGER NOT NULL, state TEXT NOT NULL,
  start_game_min INTEGER NOT NULL, end_game_min INTEGER,
  km REAL NOT NULL DEFAULT 0, place TEXT
);
CREATE INDEX IF NOT EXISTS duty_day ON duty_segments(game_day);
CREATE TABLE IF NOT EXISTS gameplay_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL, game_min INTEGER NOT NULL, payload_json TEXT NOT NULL, created_at INTEGER NOT NULL
);
`;

export type Row = Record<string, string | number | bigint | null | Uint8Array>;

export class Database {
  readonly db: DatabaseSyncType;

  constructor(file?: string) {
    const target = file ?? path.join(ensureDir(DATA_DIR), 'truckpulse.db');
    this.db = new DatabaseSync(target);
    if (target !== ':memory:') this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec(SCHEMA);
    this.migrate();
    this.db.prepare('INSERT OR REPLACE INTO meta(key, value) VALUES (?, ?)').run('schema_version', String(SCHEMA_VERSION));
    log.info(`Banco de dados aberto: ${target}`);
  }

  /** Migrações incrementais para bancos criados por versões anteriores. */
  private migrate(): void {
    for (const table of ['trips', 'sessions']) {
      const cols = this.db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
      if (!cols.some((c) => c.name === 'speed_distance_km')) {
        this.db.exec(`ALTER TABLE ${table} ADD COLUMN speed_distance_km REAL NOT NULL DEFAULT 0`);
        log.info(`Migração: ${table}.speed_distance_km adicionada`);
      }
    }
  }

  run(sql: string, ...params: (string | number | null)[]): { lastInsertRowid: number; changes: number } {
    const r = this.db.prepare(sql).run(...params);
    return { lastInsertRowid: Number(r.lastInsertRowid), changes: Number(r.changes) };
  }

  get<T = Row>(sql: string, ...params: (string | number | null)[]): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  all<T = Row>(sql: string, ...params: (string | number | null)[]): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  transaction(fn: () => void): void {
    this.db.exec('BEGIN');
    try {
      fn();
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  close(): void {
    try {
      this.db.close();
    } catch {
      /* já fechado */
    }
  }
}
