import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../shared/types.js';
import { Database } from '../src/db/database.js';
import { buildAlerts, TelemetryEngine } from '../src/engine/telemetryEngine.js';
import { DEMO_FREIGHTS, DEMO_JOB_SECONDS, DemoSimulator } from '../src/engine/demoSimulator.js';
import { TRAILER_KEYS, resolveTrailerModel } from '../../shared/vehicles.js';
import { GameProcessWatcher } from '../src/sdk/gameProcess.js';
import type { SharedMemorySource } from '../src/sdk/sharedMemory.js';
import { makeRev12Buffer } from './helpers.js';

class FakeShm implements SharedMemorySource {
  isOpen = false;
  available = true;
  constructor(public buf: Buffer) {}
  open() {
    this.isOpen = this.available;
    return this.isOpen;
  }
  read() {
    return this.isOpen ? Buffer.from(this.buf) : null;
  }
  close() {
    this.isOpen = false;
  }
}

function setup(proc: string | null = 'eurotrucks2.exe') {
  const { buf, w } = makeRev12Buffer();
  const shm = new FakeShm(buf);
  const watcher = new GameProcessWatcher(1000, async () => proc);
  watcher.current = proc;
  watcher.checkedOnce = true;
  const db = new Database(':memory:');
  const engine = new TelemetryEngine({ db, getSettings: () => DEFAULT_SETTINGS, shm, watcher });
  return { engine, shm, w, db };
}

describe('TelemetryEngine — estados de conexão', () => {
  it('jogo fechado', () => {
    const { engine } = setup(null);
    expect(engine.tick(1000).connection.state).toBe('game-not-running');
  });

  it('jogo aberto sem plugin', () => {
    const { engine, shm } = setup();
    shm.available = false;
    const f = engine.tick(5000);
    expect(f.connection.state).toBe('plugin-missing');
    expect(f.motion.speedKmh).toBeNull();
  });

  it('aguardando SDK, conectado, pausado e motor desligado', () => {
    const { engine, w } = setup();
    w.set('sdkActive', false);
    expect(engine.tick(5000).connection.state).toBe('waiting-sdk');
    w.set('sdkActive', true).set('time', 1n).set('paused', true);
    let f = engine.tick(6000);
    expect(f.connection.state).toBe('connected');
    expect(f.connection.activity).toBe('paused');
    w.set('paused', false).set('time', 2n);
    f = engine.tick(6100);
    expect(f.connection.activity).toBe('engine-off');
    w.set('engineEnabled', true).set('speed', 20).set('time', 3n);
    f = engine.tick(6200);
    expect(f.connection.activity).toBe('driving');
    expect(f.source).toBe('live');
  });

  it('revisão incompatível', () => {
    const { engine, w } = setup();
    w.set('telemetry_plugin_revision', 99);
    const f = engine.tick(5000);
    expect(f.connection.state).toBe('incompatible');
    expect(f.connection.message).toMatch(/99/);
  });

  it('detecta dados congelados (stale) e volta a conectar', () => {
    const { engine, w } = setup();
    w.set('time', 10n);
    engine.tick(5000);
    expect(engine.tick(9000).connection.state).toBe('stale');
    w.set('time', 11n);
    expect(engine.tick(9100).connection.state).toBe('connected');
  });

  it('fecha a memória quando o jogo fecha e reconecta quando volta', () => {
    const { engine, shm, w } = setup();
    w.set('time', 1n);
    engine.tick(5000);
    expect(shm.isOpen).toBe(true);
    (engine as any).watcher.current = null;
    expect(engine.tick(6000).connection.state).toBe('game-not-running');
    expect(shm.isOpen).toBe(false);
    (engine as any).watcher.current = 'eurotrucks2.exe';
    w.set('time', 2n);
    expect(engine.tick(8000).connection.state).toBe('connected');
  });
});

describe('Modo DEMO', () => {
  it('frames marcados como demo e nada é gravado no histórico real', () => {
    const { engine, db } = setup();
    const tripsBefore = db.all('SELECT * FROM trips');
    engine.setMode('demo');
    let f = engine.tick(1000);
    for (let i = 1; i < 50; i++) f = engine.tick(1000 + i * 100);
    expect(f.source).toBe('demo');
    expect(f.connection.state).toBe('demo');
    expect(f.trip.persisted).toBe(false);
    expect(db.all('SELECT * FROM samples')).toHaveLength(0);
    expect(db.all('SELECT * FROM trips')).toEqual(tripsBefore);
    expect(db.all('SELECT * FROM trucks')).toHaveLength(0);
    engine.setMode('live');
    expect(engine.tick(10_000).source).toBe('live');
  });

  it('simulador gera valores coerentes', () => {
    const sim = new DemoSimulator(1);
    let raw = sim.next(0.05);
    for (let i = 0; i < 2000; i++) raw = sim.next(0.05);
    expect(raw.speed).toBeGreaterThanOrEqual(0);
    expect(raw.fuel).toBeGreaterThan(0);
    expect(raw.fuel).toBeLessThanOrEqual(raw.fuelCapacity);
    expect(raw.wheels.length).toBeGreaterThan(0);
    expect(raw.trailers[0].attached).toBe(true);
  });

  it('DEMO alterna fretes com cargas, empresas e reboques diferentes a cada entrega', () => {
    const sim = new DemoSimulator(1);
    const seen = new Map<string, string>();
    for (let job = 0; job < DEMO_FREIGHTS.length; job++) {
      const raw = sim.next(0.05);
      const t = raw.trailers[0];
      seen.set(resolveTrailerModel(t.bodyType, t.id, t.cargoAccessoryId) ?? 'null', raw.cargo);
      expect(raw.cargo).toBe(DEMO_FREIGHTS[job].cargo);
      expect(raw.cityDst.length).toBeGreaterThan(0);
      for (let i = 0; i < DEMO_JOB_SECONDS / 0.5; i++) sim.next(0.5);
    }
    expect([...seen.keys()].sort()).toEqual([...TRAILER_KEYS].sort());
  });
});

describe('alertas', () => {
  it('gera alertas de combustível, desgaste e excesso de velocidade', () => {
    const { engine } = setup();
    engine.setMode('demo');
    const f = engine.tick(1000);
    f.fuel.percent = 5;
    f.wear.engine = 0.6;
    f.motion.overLimit = true;
    f.motion.speedLimitKmh = 80;
    const ids = buildAlerts(f, DEFAULT_SETTINGS).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['fuel', 'wear-engine', 'overspeed']));
  });
});
