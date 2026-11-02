import type { DataSource, DocStatus, DocType, DutySegment, JobRecord, LedgerEntry, TripDoc, TripDocSummary } from '../../../shared/types.js';
import type { Database, Row } from '../db/database.js';

export interface DocFilter {
  jobId?: number;
  type?: string;
  from?: number;
  to?: number;
  limit?: number;
}

export interface DocStore {
  readonly source: DataSource;
  nextCounter(model: string, start: number): number;
  insertJob(j: Omit<JobRecord, 'id'>): JobRecord;
  updateJob(id: number, patch: Partial<JobRecord>): JobRecord | null;
  getJob(id: number): JobRecord | null;
  listJobs(limit: number, offset: number): JobRecord[];
  insertDoc(d: Omit<TripDoc, 'id'>): TripDoc;
  updateDoc(id: number, patch: Partial<TripDoc>): TripDoc | null;
  getDoc(id: number): TripDoc | null;
  listDocs(f: DocFilter): TripDocSummary[];
  insertLedger(e: Omit<LedgerEntry, 'id'>): LedgerEntry;
  listLedger(jobId?: number): LedgerEntry[];
  insertEvent(kind: string, gameMin: number, payload: unknown): void;
  insertSegment(s: DutySegment): DutySegment;
  updateSegment(id: number, patch: Partial<DutySegment>): void;
  listSegments(fromDay: number, toDay: number): DutySegment[];
}

export function summarize(d: TripDoc): TripDocSummary {
  const { data, signature, ...rest } = d;
  const amountEur = typeof data?.amountEur === 'number' ? data.amountEur : null;
  return { ...rest, amountEur, hasSignature: !!signature };
}

/* ───────────────────────── memória (DEMO) ───────────────────────── */

export class MemoryDocStore implements DocStore {
  constructor(readonly source: DataSource = 'demo') {}
  private counters = new Map<string, number>();
  private jobs: JobRecord[] = [];
  private docs: TripDoc[] = [];
  private ledger: LedgerEntry[] = [];
  private segments: DutySegment[] = [];
  private seq = 0;
  readonly events: { kind: string; gameMin: number; payload: unknown }[] = [];

  nextCounter(model: string, start: number): number {
    const n = this.counters.get(model) ?? start;
    this.counters.set(model, n + 1);
    return n;
  }
  insertJob(j: Omit<JobRecord, 'id'>): JobRecord {
    const r = { ...j, id: ++this.seq };
    this.jobs.push(r);
    return r;
  }
  updateJob(id: number, patch: Partial<JobRecord>): JobRecord | null {
    const j = this.jobs.find((x) => x.id === id);
    if (!j) return null;
    Object.assign(j, patch);
    return j;
  }
  getJob(id: number): JobRecord | null {
    return this.jobs.find((x) => x.id === id) ?? null;
  }
  listJobs(limit: number, offset: number): JobRecord[] {
    return [...this.jobs].reverse().slice(offset, offset + limit);
  }
  insertDoc(d: Omit<TripDoc, 'id'>): TripDoc {
    const r = { ...d, id: ++this.seq };
    this.docs.push(r);
    return r;
  }
  updateDoc(id: number, patch: Partial<TripDoc>): TripDoc | null {
    const d = this.docs.find((x) => x.id === id);
    if (!d) return null;
    Object.assign(d, patch);
    return d;
  }
  getDoc(id: number): TripDoc | null {
    return this.docs.find((x) => x.id === id) ?? null;
  }
  listDocs(f: DocFilter): TripDocSummary[] {
    return this.docs
      .filter((d) => (f.jobId === undefined || d.jobId === f.jobId) && (!f.type || d.type === f.type) && (f.from === undefined || d.createdAt >= f.from) && (f.to === undefined || d.createdAt <= f.to))
      .slice()
      .reverse()
      .slice(0, f.limit ?? 500)
      .map(summarize);
  }
  insertLedger(e: Omit<LedgerEntry, 'id'>): LedgerEntry {
    const r = { ...e, id: ++this.seq };
    this.ledger.push(r);
    return r;
  }
  listLedger(jobId?: number): LedgerEntry[] {
    return this.ledger.filter((e) => jobId === undefined || e.jobId === jobId);
  }
  insertEvent(kind: string, gameMin: number, payload: unknown): void {
    this.events.push({ kind, gameMin, payload });
    if (this.events.length > 500) this.events.shift();
  }
  insertSegment(s: DutySegment): DutySegment {
    const r = { ...s, id: ++this.seq };
    this.segments.push(r);
    if (this.segments.length > 5000) this.segments.shift();
    return r;
  }
  updateSegment(id: number, patch: Partial<DutySegment>): void {
    const s = this.segments.find((x) => x.id === id);
    if (s) Object.assign(s, patch);
  }
  listSegments(fromDay: number, toDay: number): DutySegment[] {
    return this.segments.filter((s) => s.gameDay >= fromDay && s.gameDay <= toDay);
  }
}

/* ───────────────────────── SQLite (ao vivo) ───────────────────────── */

const n = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
const s = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const b = (v: unknown): boolean | null => (v === null || v === undefined ? null : Number(v) !== 0);
const json = <T,>(v: unknown, fallback: T): T => {
  if (typeof v !== 'string' || !v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
};

const JOB_COLS: [keyof JobRecord, string][] = [
  ['status', 'status'], ['startedGameMin', 'started_game_min'], ['deadlineGameMin', 'deadline_game_min'], ['finishedGameMin', 'finished_game_min'],
  ['cargoId', 'cargo_id'], ['cargo', 'cargo'], ['massKg', 'mass_kg'], ['units', 'units'], ['srcCity', 'src_city'], ['srcCompany', 'src_company'],
  ['dstCity', 'dst_city'], ['dstCompany', 'dst_company'], ['incomeEur', 'income_eur'], ['plannedKm', 'planned_km'],
  ['deliveredRevenueEur', 'delivered_revenue_eur'], ['deliveredDamage', 'delivered_damage'], ['deliveredKm', 'delivered_km'],
  ['deliveredTimeMin', 'delivered_time_min'], ['earnedXp', 'earned_xp'], ['autopark', 'autopark'], ['autoload', 'autoload'],
  ['cancelPenaltyEur', 'cancel_penalty_eur'], ['truckPlate', 'truck_plate'], ['truckPlateCountry', 'truck_plate_country'],
  ['trailerPlate', 'trailer_plate'], ['truckName', 'truck_name'], ['rating', 'rating'], ['checklist', 'checklist_json'], ['createdAt', 'created_at'],
];

function jobToRow(j: Partial<JobRecord>): [string[], (string | number | null)[]] {
  const cols: string[] = [];
  const vals: (string | number | null)[] = [];
  for (const [k, c] of JOB_COLS) {
    if (!(k in j)) continue;
    const v = j[k] as unknown;
    cols.push(c);
    vals.push(k === 'checklist' ? (v ? JSON.stringify(v) : null) : typeof v === 'boolean' ? (v ? 1 : 0) : (v as string | number | null) ?? null);
  }
  return [cols, vals];
}

function rowToJob(r: Row): JobRecord {
  return {
    id: Number(r.id), status: String(r.status) as JobRecord['status'], startedGameMin: Number(r.started_game_min), deadlineGameMin: n(r.deadline_game_min),
    finishedGameMin: n(r.finished_game_min), cargoId: s(r.cargo_id), cargo: s(r.cargo), massKg: n(r.mass_kg), units: n(r.units),
    srcCity: s(r.src_city), srcCompany: s(r.src_company), dstCity: s(r.dst_city), dstCompany: s(r.dst_company), incomeEur: n(r.income_eur),
    plannedKm: n(r.planned_km), deliveredRevenueEur: n(r.delivered_revenue_eur), deliveredDamage: n(r.delivered_damage), deliveredKm: n(r.delivered_km),
    deliveredTimeMin: n(r.delivered_time_min), earnedXp: n(r.earned_xp), autopark: b(r.autopark), autoload: b(r.autoload),
    cancelPenaltyEur: n(r.cancel_penalty_eur), truckPlate: s(r.truck_plate), truckPlateCountry: s(r.truck_plate_country), trailerPlate: s(r.trailer_plate),
    truckName: s(r.truck_name), rating: n(r.rating), checklist: json(r.checklist_json, null), createdAt: Number(r.created_at), source: 'live',
  };
}

function rowToDoc(r: Row): TripDoc {
  return {
    id: Number(r.id), jobId: n(r.job_id), type: String(r.type) as DocType, number: n(r.number), key: s(r.access_key), status: String(r.status) as DocStatus,
    gameMin: Number(r.game_min), createdAt: Number(r.created_at), source: 'live', title: s(r.title) ?? '', data: json(r.data_json, {}),
    signature: json(r.signature_json, null), stamps: json(r.stamps_json, null),
  };
}

export class SqlDocStore implements DocStore {
  readonly source: DataSource = 'live';
  constructor(private db: Database) {}

  nextCounter(model: string, start: number): number {
    const row = this.db.get<{ next: number }>('SELECT next FROM doc_counters WHERE model = ?', model);
    const cur = row ? Number(row.next) : start;
    this.db.run('INSERT INTO doc_counters(model, next) VALUES (?, ?) ON CONFLICT(model) DO UPDATE SET next = excluded.next', model, cur + 1);
    return cur;
  }
  insertJob(j: Omit<JobRecord, 'id'>): JobRecord {
    const [cols, vals] = jobToRow(j);
    const r = this.db.run(`INSERT INTO jobs(${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`, ...vals);
    return { ...j, id: r.lastInsertRowid };
  }
  updateJob(id: number, patch: Partial<JobRecord>): JobRecord | null {
    const [cols, vals] = jobToRow(patch);
    if (cols.length) this.db.run(`UPDATE jobs SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, ...vals, id);
    return this.getJob(id);
  }
  getJob(id: number): JobRecord | null {
    const r = this.db.get('SELECT * FROM jobs WHERE id = ?', id);
    return r ? rowToJob(r) : null;
  }
  listJobs(limit: number, offset: number): JobRecord[] {
    return this.db.all('SELECT * FROM jobs ORDER BY id DESC LIMIT ? OFFSET ?', limit, offset).map(rowToJob);
  }
  insertDoc(d: Omit<TripDoc, 'id'>): TripDoc {
    const r = this.db.run(
      'INSERT INTO documents(job_id, type, number, access_key, status, game_min, title, data_json, signature_json, stamps_json, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      d.jobId, d.type, d.number, d.key, d.status, d.gameMin, d.title, JSON.stringify(d.data), d.signature ? JSON.stringify(d.signature) : null, d.stamps ? JSON.stringify(d.stamps) : null, d.createdAt,
    );
    return { ...d, id: r.lastInsertRowid };
  }
  updateDoc(id: number, patch: Partial<TripDoc>): TripDoc | null {
    const sets: string[] = [];
    const vals: (string | number | null)[] = [];
    if (patch.status) (sets.push('status = ?'), vals.push(patch.status));
    if (patch.data) (sets.push('data_json = ?'), vals.push(JSON.stringify(patch.data)));
    if ('signature' in patch) (sets.push('signature_json = ?'), vals.push(patch.signature ? JSON.stringify(patch.signature) : null));
    if ('stamps' in patch) (sets.push('stamps_json = ?'), vals.push(patch.stamps ? JSON.stringify(patch.stamps) : null));
    if (sets.length) this.db.run(`UPDATE documents SET ${sets.join(', ')} WHERE id = ?`, ...vals, id);
    return this.getDoc(id);
  }
  getDoc(id: number): TripDoc | null {
    const r = this.db.get('SELECT * FROM documents WHERE id = ?', id);
    return r ? rowToDoc(r) : null;
  }
  listDocs(f: DocFilter): TripDocSummary[] {
    const where: string[] = [];
    const vals: (string | number | null)[] = [];
    if (f.jobId !== undefined) (where.push('job_id = ?'), vals.push(f.jobId));
    if (f.type) (where.push('type = ?'), vals.push(f.type));
    if (f.from !== undefined) (where.push('created_at >= ?'), vals.push(f.from));
    if (f.to !== undefined) (where.push('created_at <= ?'), vals.push(f.to));
    const sql = `SELECT * FROM documents ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT ?`;
    return this.db.all(sql, ...vals, f.limit ?? 500).map((r) => summarize(rowToDoc(r)));
  }
  insertLedger(e: Omit<LedgerEntry, 'id'>): LedgerEntry {
    const r = this.db.run(
      'INSERT INTO ledger(job_id, document_id, game_min, kind, label, amount_eur, source, created_at) VALUES (?,?,?,?,?,?,?,?)',
      e.jobId, e.documentId, e.gameMin, e.kind, e.label, e.amountEur, e.origin, e.createdAt,
    );
    return { ...e, id: r.lastInsertRowid };
  }
  listLedger(jobId?: number): LedgerEntry[] {
    const rows = jobId === undefined ? this.db.all('SELECT * FROM ledger ORDER BY id') : this.db.all('SELECT * FROM ledger WHERE job_id = ? ORDER BY id', jobId);
    return rows.map((r) => ({
      id: Number(r.id), jobId: n(r.job_id), documentId: n(r.document_id), gameMin: Number(r.game_min), kind: String(r.kind) as LedgerEntry['kind'],
      label: String(r.label), amountEur: Number(r.amount_eur), origin: String(r.source) === 'sdk' ? 'sdk' : 'sim', createdAt: Number(r.created_at),
    }));
  }
  insertEvent(kind: string, gameMin: number, payload: unknown): void {
    this.db.run('INSERT INTO gameplay_events(kind, game_min, payload_json, created_at) VALUES (?,?,?,?)', kind, gameMin, JSON.stringify(payload), Date.now());
  }
  insertSegment(seg: DutySegment): DutySegment {
    const r = this.db.run('INSERT INTO duty_segments(game_day, state, start_game_min, end_game_min, km, place) VALUES (?,?,?,?,?,?)', seg.gameDay, seg.state, seg.startGameMin, seg.endGameMin, seg.km, seg.place);
    return { ...seg, id: r.lastInsertRowid };
  }
  updateSegment(id: number, patch: Partial<DutySegment>): void {
    const sets: string[] = [];
    const vals: (string | number | null)[] = [];
    if ('endGameMin' in patch) (sets.push('end_game_min = ?'), vals.push(patch.endGameMin ?? null));
    if ('km' in patch) (sets.push('km = ?'), vals.push(patch.km ?? 0));
    if ('place' in patch) (sets.push('place = ?'), vals.push(patch.place ?? null));
    if (sets.length) this.db.run(`UPDATE duty_segments SET ${sets.join(', ')} WHERE id = ?`, ...vals, id);
  }
  listSegments(fromDay: number, toDay: number): DutySegment[] {
    return this.db
      .all('SELECT * FROM duty_segments WHERE game_day BETWEEN ? AND ? ORDER BY start_game_min', fromDay, toDay)
      .map((r) => ({ id: Number(r.id), gameDay: Number(r.game_day), state: String(r.state) as DutySegment['state'], startGameMin: Number(r.start_game_min), endGameMin: n(r.end_game_min), km: Number(r.km), place: s(r.place) }));
  }
}
