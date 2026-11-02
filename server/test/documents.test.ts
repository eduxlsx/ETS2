import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type Settings } from '../../shared/types.js';
import { isValidChave } from '../../shared/docs/ids.js';
import { Database } from '../src/db/database.js';
import { DEMO_JOB_SECONDS, DemoSimulator, emptyRaw, emptyWheel } from '../src/engine/demoSimulator.js';
import { buildEmptyFrame } from '../src/engine/emptyFrame.js';
import { TelemetryEngine } from '../src/engine/telemetryEngine.js';
import { DocumentManager, sanitizeStrokes } from '../src/managers/documentManager.js';
import { MemoryDocStore, SqlDocStore } from '../src/managers/docStore.js';
import { DutyManager } from '../src/managers/dutyManager.js';
import { GameplayEventDetector } from '../src/managers/gameplayEvents.js';
import type { RawTelemetry } from '../src/sdk/raw.js';
import { GameProcessWatcher } from '../src/sdk/gameProcess.js';
import type { SharedMemorySource } from '../src/sdk/sharedMemory.js';

function jobRaw(over: Partial<RawTelemetry> = {}): RawTelemetry {
  return {
    ...emptyRaw(),
    timeAbs: 2000,
    onJob: true,
    cargoId: 'dryfruit',
    cargo: 'Frutas secas',
    cargoMass: 18240,
    citySrc: 'Calais',
    compSrc: 'Tradeaux',
    cityDst: 'Lyon',
    compDst: 'Agrominta',
    jobIncome: 3210,
    plannedDistanceKm: 752,
    timeAbsDelivery: 3200,
    jobStartingTime: 1990,
    truckLicensePlate: 'TP-517-RJ',
    truckBrand: 'Scania',
    truckName: 'R',
    wheels: [{ ...emptyWheel(), positionZ: -1.5 }, { ...emptyWheel(), positionZ: 2.1 }],
    ...over,
  };
}

const frame = () => buildEmptyFrame({ seq: 1, timestamp: 0, connection: {} as any, trip: { avgSpeedKmh: null } as any, truckModelKey: 'generic' });

function makeManager(settings: Partial<Settings['docs']> = {}, store = new MemoryDocStore('live')) {
  let now = 1_000_000;
  const s: Settings = { ...DEFAULT_SETTINGS, docs: { ...settings } as any };
  const duty = new DutyManager(store, store.source);
  const m = new DocumentManager(store, () => s, duty, { now: () => now });
  const docs: any[] = [];
  const dispatch: any[] = [];
  m.on('doc', (d) => docs.push(d));
  m.on('dispatch', (d) => dispatch.push(d));
  return { m, store, docs, dispatch, advance: (ms: number) => (now += ms) };
}

describe('detecção de eventos de gameplay', () => {
  it('flag alto por 5 ticks gera 1 evento (borda de subida + dedupe)', () => {
    const det = new GameplayEventDetector();
    det.feed(jobRaw());
    const evs = [];
    for (let i = 0; i < 5; i++) evs.push(...det.feed(jobRaw({ tollgate: true, tollgatePayAmount: 42 })));
    expect(evs.filter((e) => e.kind === 'toll')).toHaveLength(1);
    det.feed(jobRaw());
    // mesmo evento repetido no mesmo minuto do jogo (pausa/despausa) é ignorado
    expect(det.feed(jobRaw({ tollgate: true, tollgatePayAmount: 42 })).filter((e) => e.kind === 'toll')).toHaveLength(0);
    det.feed(jobRaw());
    expect(det.feed(jobRaw({ timeAbs: 2001, tollgate: true, tollgatePayAmount: 42 })).filter((e) => e.kind === 'toll')).toHaveLength(1);
  });

  it('o DEMO emite frete, pedágio, abastecimento, multa e entrega', () => {
    const sim = new DemoSimulator(3);
    const det = new GameplayEventDetector();
    const kinds = new Map<string, number>();
    for (let i = 0; i < (DEMO_JOB_SECONDS * 4) / 0.05; i++) for (const e of det.feed(sim.next(0.05))) kinds.set(e.kind, (kinds.get(e.kind) ?? 0) + 1);
    for (const k of ['job-start', 'toll', 'refuel', 'fined', 'delivered', 'ferry']) expect(kinds.get(k) ?? 0).toBeGreaterThan(0);
    expect(kinds.get('job-start')).toBe(4);
    expect(kinds.get('delivered')).toBe(4);
  });
});

describe('máquina de estados dos documentos', () => {
  it('emite NF-e, CT-e e MDF-e no início do frete e passa para em trânsito', () => {
    const { m, store, dispatch } = makeManager();
    m.update(jobRaw({ onJob: false }), frame());
    m.update(jobRaw(), frame());
    const docs = store.listDocs({});
    expect(docs.map((d) => d.type).sort()).toEqual(['cte', 'mdfe', 'nfe']);
    expect(docs.every((d) => d.status === 'transit')).toBe(true);
    for (const d of docs) expect(isValidChave(d.key!)).toBe(true);
    expect(store.listLedger()[0]).toMatchObject({ kind: 'advance', amountEur: 1605, origin: 'sim' });
    expect(dispatch[0].text).toMatch(/Frete confirmado/);
    expect(m.paperwork()).toMatchObject({ status: 'transit', route: 'Calais → Lyon' });
  });

  it('entrega → aguardando assinatura → assinada com carimbo azul e de avaria acima do limite', () => {
    const { m, store } = makeManager({ damageStampPct: 5 });
    m.update(jobRaw({ onJob: false }), frame());
    m.update(jobRaw(), frame());
    m.update(jobRaw({ timeAbs: 3100, jobDelivered: true, jobDeliveredRevenue: 3210, jobDeliveredCargoDamage: 0.087 }), frame());
    const nfe = store.listDocs({ type: 'nfe' })[0];
    expect(nfe.status).toBe('awaiting_signature');
    expect(m.paperwork()?.awaitingSignature).toBe(true);
    expect(store.listDocs({ type: 'delivery' })).toHaveLength(1);
    const strokes = sanitizeStrokes([[[0.1, 0.5, 2], [0.2, 0.6, 2.5], [2, -1, 99]]])!;
    expect(strokes[0][2]).toEqual([1, 0, 6]);
    const signed = m.sign(nfe.id, strokes) as any;
    expect(signed.status).toBe('delivered');
    expect(signed.stamps.map((s: any) => s.kind)).toEqual(['received', 'damage']);
    expect(signed.stamps[1].lines[1]).toMatch(/8,7 %/);
    expect(signed.signature.strokes).toEqual(strokes);
    expect('error' in (m.sign(nfe.id, strokes) as any)).toBe(true); // não assina duas vezes
    const ledger = store.listLedger();
    expect(ledger.reduce((a, e) => a + e.amountEur, 0)).toBeCloseTo(3210, 2);
  });

  it('sem avaria relevante só aplica o carimbo RECEBIDO; assinatura automática após o tempo configurado', () => {
    const { m, store, advance } = makeManager({ autoSign: true, autoSignMinutes: 10 });
    m.update(jobRaw({ onJob: false }), frame());
    m.update(jobRaw(), frame());
    m.update(jobRaw({ jobDelivered: true, jobDeliveredCargoDamage: 0.01, jobDeliveredRevenue: 3000 }), frame());
    advance(9 * 60_000);
    m.update(jobRaw(), frame());
    expect(store.listDocs({ type: 'nfe' })[0].status).toBe('awaiting_signature');
    advance(2 * 60_000);
    m.update(jobRaw(), frame());
    const nfe = store.getDoc(store.listDocs({ type: 'nfe' })[0].id)!;
    expect(nfe.status).toBe('delivered');
    expect(nfe.signature?.auto).toBe(true);
    expect(nfe.stamps?.map((s) => s.kind)).toEqual(['received']);
  });

  it('cancelamento carimba CANCELADO e lança a multa contratual', () => {
    const { m, store } = makeManager();
    m.update(jobRaw({ onJob: false }), frame());
    m.update(jobRaw(), frame());
    m.update(jobRaw({ jobCancelled: true, jobCancelledPenalty: 1250 }), frame());
    const fiscais = store.listDocs({}).filter((d) => ['nfe', 'cte', 'mdfe'].includes(d.type));
    expect(fiscais.every((d) => d.status === 'cancelled')).toBe(true);
    expect(fiscais[0].stamps?.[0].kind).toBe('cancelled');
    expect(store.listLedger().some((e) => e.kind === 'cancel_penalty' && e.amountEur === -1250)).toBe(true);
  });

  it('recibos: pedágio, abastecimento, balsa e multa vão para a pasta e para a carteira', () => {
    const { m, store } = makeManager();
    m.update(jobRaw({ onJob: false }), frame());
    m.update(jobRaw(), frame());
    m.update(jobRaw({ tollgate: true, tollgatePayAmount: 40 }), frame());
    m.update(jobRaw({ refuelPayed: true, refuelAmount: 400 }), frame());
    m.update(jobRaw({ ferry: true, ferrySourceName: 'Dover', ferryTargetName: 'Calais', ferryPayAmount: 186 }), frame());
    m.update(jobRaw({ fined: true, fineOffence: 'red_signal', fineAmount: 1200 }), frame());
    const types = store.listDocs({}).map((d) => d.type);
    for (const t of ['toll', 'fuel', 'ferry', 'fine']) expect(types).toContain(t);
    const fine = store.getDoc(store.listDocs({ type: 'fine' })[0].id)!;
    expect(fine.data.offence.art).toBe('208');
    const kinds = store.listLedger().map((e) => e.kind);
    expect(kinds).toEqual(expect.arrayContaining(['toll', 'fuel', 'ferry', 'fine']));
  });

  it('novo frete arquiva os documentos do anterior', () => {
    const { m, store } = makeManager();
    m.update(jobRaw({ onJob: false }), frame());
    m.update(jobRaw(), frame());
    m.update(jobRaw({ onJob: false }), frame());
    m.update(jobRaw({ jobStartingTime: 5000, timeAbs: 5000, cargo: 'Outra carga' }), frame());
    const all = store.listDocs({});
    expect(all.filter((d) => d.status === 'archived')).toHaveLength(3);
    expect(all.filter((d) => d.status === 'transit')).toHaveLength(3);
  });

  it('numeração sequencial persistida no SQLite', () => {
    const db = new Database(':memory:');
    const a = makeManager({}, new SqlDocStore(db) as any);
    a.m.update(jobRaw({ onJob: false }), frame());
    a.m.update(jobRaw(), frame());
    const n1 = a.store.listDocs({ type: 'nfe' })[0].number!;
    const b = makeManager({}, new SqlDocStore(db) as any);
    b.m.update(jobRaw({ onJob: false }), frame());
    b.m.update(jobRaw({ jobStartingTime: 7000 }), frame());
    const nums = b.store.listDocs({ type: 'nfe' }).map((d) => d.number!);
    expect(nums).toContain(n1 + 1);
    expect(db.all('SELECT * FROM jobs')).toHaveLength(2);
  });
});

describe('modo DEMO não persiste documentos', () => {
  class Shm implements SharedMemorySource {
    isOpen = false;
    open() {
      return false;
    }
    read() {
      return null;
    }
    close() {}
  }
  it('jobs/documents/ledger continuam vazios no SQLite', () => {
    const db = new Database(':memory:');
    const watcher = new GameProcessWatcher(1000, async () => null);
    const engine = new TelemetryEngine({ db, getSettings: () => DEFAULT_SETTINGS, shm: new Shm(), watcher });
    engine.setMode('demo');
    const seen: string[] = [];
    engine.on('doc', (d) => seen.push(d.type));
    let t = 1_000_000;
    for (let i = 0; i < 300; i++) engine.tick((t += 50));
    expect(seen).toEqual(expect.arrayContaining(['nfe', 'cte', 'mdfe']));
    expect(engine.documents.store.source).toBe('demo');
    for (const table of ['jobs', 'documents', 'ledger', 'gameplay_events', 'duty_segments']) expect(db.all(`SELECT * FROM ${table}`)).toHaveLength(0);
    expect(engine.lastFrame?.paperwork?.source).toBe('demo');
  });
});

describe('jornada (dutyManager)', () => {
  it('soma direção contínua e zera após pausa de 30 min com descanso', () => {
    const store = new MemoryDocStore('live');
    const d = new DutyManager(store, 'live');
    let min = 600;
    const drive = (mins: number) => {
      for (let i = 0; i < mins; i++) d.update({ ...jobRaw(), timeAbs: min++, speed: 22, engineEnabled: true }, 'rodovia');
    };
    const rest = (mins: number) => {
      for (let i = 0; i < mins; i++) d.update({ ...jobRaw(), timeAbs: min++, speed: 0, engineEnabled: false }, 'Lyon');
    };
    drive(200);
    expect(d.summary!.continuousDrivingMin).toBeGreaterThanOrEqual(195);
    expect(d.summary!.state).toBe('driving');
    rest(40);
    expect(d.summary!.continuousDrivingMin).toBe(0);
    expect(d.summary!.state).toBe('rest');
    drive(10);
    expect(d.summary!.dailyDrivingMin).toBeGreaterThan(200);
    expect(d.segments(Math.floor(min / 1440)).length).toBeGreaterThanOrEqual(1);
  });
});

describe('migração do banco para o schema v3', () => {
  it('mantém os dados existentes e cria as tabelas novas', async () => {
    const { createRequire } = await import('node:module');
    const os = await import('node:os');
    const path = await import('node:path');
    const fs = await import('node:fs');
    const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tp-mig-')), 'old.db');
    const old = new DatabaseSync(file);
    old.exec(`CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, started_at INTEGER NOT NULL, ended_at INTEGER, distance_km REAL NOT NULL DEFAULT 0,
        driving_s REAL NOT NULL DEFAULT 0, fuel_used_l REAL NOT NULL DEFAULT 0, max_speed_kmh REAL NOT NULL DEFAULT 0, truck_key TEXT, truck_name TEXT, is_current INTEGER NOT NULL DEFAULT 0);
      INSERT INTO meta VALUES ('schema_version', '2');
      INSERT INTO trips(started_at, distance_km) VALUES (123, 456.5);`);
    old.close();
    const db = new Database(file);
    expect(db.get<{ distance_km: number }>('SELECT distance_km FROM trips')!.distance_km).toBe(456.5);
    expect(db.get<{ value: string }>("SELECT value FROM meta WHERE key = 'schema_version'")!.value).toBe('3');
    for (const t of ['jobs', 'documents', 'doc_counters', 'ledger', 'duty_segments', 'gameplay_events']) expect(db.all(`SELECT * FROM ${t}`)).toEqual([]);
    db.close();
  });
});
