import { EventEmitter } from 'node:events';
import type {
  ActivityState,
  Alert,
  ConnectionInfo,
  ConnectionState,
  DataSource,
  Settings,
  TelemetryFrame,
} from '../../../shared/types.js';
import { createParserContext, parseRaw, type ParserContext } from '../parser/dataParser.js';
import { adapterFor, MAX_READ_SIZE, readHeader, SUPPORTED_REVISIONS, HEADER_SIZE } from '../sdk/adapters.js';
import { GameProcessWatcher } from '../sdk/gameProcess.js';
import type { RawTelemetry } from '../sdk/raw.js';
import { loadFfi, WindowsSharedMemory, type SharedMemorySource } from '../sdk/sharedMemory.js';
import { REV12_MMF_NAME } from '../sdk/layouts/rev12.js';
import { TrailerManager } from '../managers/trailerManager.js';
import { DocumentManager } from '../managers/documentManager.js';
import { MemoryDocStore, SqlDocStore } from '../managers/docStore.js';
import { DutyManager } from '../managers/dutyManager.js';
import { TripManager } from '../managers/tripManager.js';
import { VehicleManager } from '../managers/vehicleManager.js';
import type { Database } from '../db/database.js';
import { createLogger } from '../util/logger.js';
import { DemoSimulator } from './demoSimulator.js';
import { buildEmptyFrame } from './emptyFrame.js';

const log = createLogger('engine');
const STALE_AFTER_MS = 3000;
const REOPEN_EVERY_MS = 1000;

interface Pipeline {
  trip: TripManager;
  vehicles: VehicleManager;
  trailers: TrailerManager;
  parser: ParserContext;
  docs: DocumentManager;
  duty: DutyManager;
}

export interface EngineOptions {
  db: Database | null;
  getSettings: () => Settings;
  shm?: SharedMemorySource;
  watcher?: GameProcessWatcher;
  autoStart?: boolean;
}

export const MESSAGES: Record<ConnectionState, string> = {
  'game-not-running': 'Euro Truck Simulator 2 não está aberto.',
  'plugin-missing': 'Jogo aberto, mas a memória do plugin de telemetria não foi encontrada. Verifique se scs-telemetry.dll está em bin/win_x64/plugins e reinicie o jogo.',
  'waiting-sdk': 'Plugin carregado — aguardando o SDK ficar ativo (entre no jogo/perfil).',
  incompatible: 'Revisão do plugin não suportada por esta versão do TRUCKPULSE.',
  stale: 'Os dados pararam de atualizar (jogo travado, minimizado em carregamento ou plugin descarregado).',
  connected: 'Conectado ao jogo.',
  demo: 'MODO DEMO — dados simulados, não são do jogo.',
};

export class TelemetryEngine extends EventEmitter {
  private mode: DataSource = 'live';
  private timer: NodeJS.Timeout | null = null;
  private seq = 0;
  private readonly shm: SharedMemorySource;
  private readonly watcher: GameProcessWatcher;
  private readonly live: Pipeline;
  private demo: Pipeline | null = null;
  private simulator: DemoSimulator | null = null;
  private lastTick = Date.now();

  private connection: ConnectionInfo = {
    state: 'game-not-running',
    activity: 'offline',
    message: MESSAGES['game-not-running'],
    gameProcess: null,
    pluginRevision: null,
    supportedRevisions: SUPPORTED_REVISIONS,
    lastDataAt: null,
    reconnectAttempts: 0,
  };
  private lastOpenAttempt = 0;
  private lastPluginTime: bigint | null = null;
  private lastPluginTimeChangeAt = 0;
  private lastOnJob: boolean | null = null;
  private latest: TelemetryFrame | null = null;
  private latestRaw: RawTelemetry | null = null;

  constructor(private readonly opts: EngineOptions) {
    super();
    this.shm = opts.shm ?? new WindowsSharedMemory();
    this.watcher = opts.watcher ?? new GameProcessWatcher();
    this.live = this.makePipeline(opts.db);
  }

  private makePipeline(db: Database | null, source: DataSource = 'live'): Pipeline {
    const store = db && source === 'live' ? new SqlDocStore(db) : new MemoryDocStore(source);
    const duty = new DutyManager(store, source);
    const docs = new DocumentManager(store, this.opts.getSettings, duty);
    // repassa eventos apenas do pipeline ativo
    docs.on('doc', (d) => this.mode === source && this.emit('doc', d));
    docs.on('dispatch', (m) => this.mode === source && this.emit('dispatch', m));
    duty.on('summary', (s) => this.mode === source && this.emit('duty', s));
    return {
      trip: new TripManager(db),
      vehicles: new VehicleManager(db),
      trailers: new TrailerManager(db),
      parser: createParserContext(),
      docs,
      duty,
    };
  }

  /** Documentos / jornada do modo atual (ao vivo ou DEMO). */
  get documents(): DocumentManager {
    return this.mode === 'demo' && this.demo ? this.demo.docs : this.live.docs;
  }
  get dutyManager(): DutyManager {
    return this.mode === 'demo' && this.demo ? this.demo.duty : this.live.duty;
  }

  get currentMode(): DataSource {
    return this.mode;
  }

  get liveTrip(): TripManager {
    return this.live.trip;
  }

  get lastFrame(): TelemetryFrame | null {
    return this.latest;
  }

  get lastRaw(): RawTelemetry | null {
    return this.latestRaw;
  }

  get connectionInfo(): ConnectionInfo {
    return this.connection;
  }

  get sharedMemoryOpen(): boolean {
    return this.shm.isOpen;
  }

  get gameProcess(): string | null {
    return this.watcher.current;
  }

  start(): void {
    const ffi = loadFfi();
    if (!ffi.ok) log.warn(ffi.error ?? 'FFI indisponível');
    this.watcher.start((proc) => log.info(proc ? `Processo do jogo detectado: ${proc}` : 'Processo do jogo não encontrado'));
    this.restartTimer();
    log.info('Telemetry Engine iniciado');
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.watcher.stop();
    this.live.trip.endSession();
    this.live.trip.persist(true);
    this.live.vehicles.flush();
    this.live.trailers.flush();
    this.live.duty.flush();
    this.shm.close();
    log.info('Telemetry Engine parado');
  }

  restartTimer(): void {
    if (this.timer) clearInterval(this.timer);
    const hz = this.opts.getSettings().updateRateHz;
    this.timer = setInterval(() => this.tick(), Math.round(1000 / hz));
  }

  setMode(mode: DataSource): void {
    if (mode === this.mode) return;
    this.mode = mode;
    if (mode === 'demo') {
      this.live.trip.endSession();
      this.demo = this.makePipeline(null, 'demo');
      this.simulator = new DemoSimulator(Date.now() & 0xffff);
      log.info('Modo DEMO ativado');
    } else {
      this.demo = null;
      this.simulator = null;
      this.lastPluginTime = null;
      log.info('Modo LIVE ativado');
    }
    this.latest = null;
    this.emit('mode', mode);
  }

  resetTrip() {
    return this.mode === 'demo' && this.demo ? this.demo.trip.reset() : this.live.trip.reset();
  }

  tick(now = Date.now()): TelemetryFrame {
    const dt = Math.min(1, Math.max(0, (now - this.lastTick) / 1000));
    this.lastTick = now;
    const frame = this.mode === 'demo' ? this.tickDemo(now, dt) : this.tickLive(now);
    this.latest = frame;
    this.emit('frame', frame);
    return frame;
  }

  private tickDemo(now: number, dt: number): TelemetryFrame {
    const raw = this.simulator!.next(dt || 0.05);
    const conn: ConnectionInfo = {
      ...this.connection,
      state: 'demo',
      message: MESSAGES.demo,
      pluginRevision: null,
      lastDataAt: now,
      gameProcess: this.watcher.current,
      activity: 'offline',
    };
    return this.buildFrame(raw, this.demo!, conn, now, 'demo');
  }

  private setState(state: ConnectionState, extra: Partial<ConnectionInfo> = {}) {
    if (state !== this.connection.state) log.info(`Conexão: ${this.connection.state} → ${state}`);
    this.connection = { ...this.connection, state, message: MESSAGES[state], ...extra };
  }

  private tickLive(now: number): TelemetryFrame {
    const proc = this.watcher.current;
    this.connection.gameProcess = proc;

    if (this.watcher.checkedOnce && !proc) {
      if (this.shm.isOpen) this.shm.close();
      return this.offline('game-not-running', now);
    }

    if (!this.shm.isOpen) {
      if (now - this.lastOpenAttempt < REOPEN_EVERY_MS) {
        return this.offline(this.connection.state === 'connected' ? 'plugin-missing' : this.connection.state, now);
      }
      this.lastOpenAttempt = now;
      const ok = this.shm.open(REV12_MMF_NAME, MAX_READ_SIZE);
      if (!ok) {
        this.connection.reconnectAttempts++;
        const ffi = loadFfi();
        const st: ConnectionState = !ffi.ok ? 'incompatible' : proc ? 'plugin-missing' : 'game-not-running';
        return this.offline(st, now, !ffi.ok ? ffi.error ?? undefined : undefined);
      }
      this.connection.reconnectAttempts = 0;
    }

    const buf = this.shm.read(MAX_READ_SIZE);
    if (!buf || buf.length < HEADER_SIZE) return this.offline('plugin-missing', now);

    const header = readHeader(buf);
    this.connection.pluginRevision = header.pluginRevision;
    const adapter = adapterFor(header.pluginRevision);
    if (!adapter) {
      return this.offline(
        'incompatible',
        now,
        `Plugin com revisão ${header.pluginRevision} não suportada (suportadas: ${SUPPORTED_REVISIONS.join(', ')}). Instale o scs-sdk-plugin V.1.12.x.`,
      );
    }
    if (!header.sdkActive) return this.offline('waiting-sdk', now);

    if (this.lastPluginTime !== header.time) {
      this.lastPluginTime = header.time;
      this.lastPluginTimeChangeAt = now;
    }
    const stale = !header.paused && now - this.lastPluginTimeChangeAt > STALE_AFTER_MS;

    let raw: RawTelemetry;
    try {
      raw = adapter.parse(buf);
    } catch (err) {
      log.error('Falha ao interpretar a memória compartilhada', err);
      return this.offline('incompatible', now);
    }
    this.latestRaw = raw;

    if (stale) {
      this.setState('stale', { lastDataAt: this.connection.lastDataAt });
    } else {
      this.setState('connected', { lastDataAt: now });
    }
    const frame = this.buildFrame(raw, this.live, this.connection, now, 'live');
    if (!stale && frame.truck.id) {
      this.live.trip.startSession({ truckKey: frame.truck.id, truckName: frame.truck.name, gameVersion: frame.game.gameVersion });
    }
    return frame;
  }

  private offline(state: ConnectionState, now: number, message?: string): TelemetryFrame {
    if (this.connection.state === 'connected' || this.connection.state === 'stale') {
      this.live.trip.endSession();
      this.live.vehicles.flush();
      this.live.trailers.flush();
    }
    this.lastPluginTime = null;
    this.setState(state, { activity: 'offline' });
    if (message) this.connection.message = message;
    const settings = this.opts.getSettings();
    return buildEmptyFrame({
      seq: ++this.seq,
      timestamp: now,
      connection: { ...this.connection },
      trip: this.live.trip.snapshot(now),
      truckModelKey: settings.vehicleMode === 'manual' ? settings.manualVehicleModel : 'generic',
    });
  }

  private buildFrame(raw: RawTelemetry, p: Pipeline, conn: ConnectionInfo, now: number, source: DataSource): TelemetryFrame {
    const settings = this.opts.getSettings();
    p.parser.fuelCapacityOverrideL = settings.fuelCapacityOverrideL;
    p.parser.speedToleranceKmh = settings.speedLimitToleranceKmh;
    const parts = parseRaw(raw, p.parser);
    const truck = p.vehicles.identify(raw, settings);

    if (settings.tripAutoResetOnJob && this.lastOnJob === false && raw.onJob) p.trip.reset();
    this.lastOnJob = raw.onJob;

    const deltaKm = p.trip.update({
      timestamp: now,
      paused: raw.paused,
      speedKmh: parts.motion.speedKmh,
      odometerKm: parts.motion.odometerKm,
      fuelL: parts.fuel.liters,
      rpm: parts.engine.rpm,
      consumptionL100: parts.fuel.avgConsumptionL100,
      scale: parts.game.timeScale,
      truckKey: truck.id,
      truckName: truck.name,
      gameVersion: parts.game.gameVersion,
    });
    p.vehicles.track(truck, deltaKm, now);
    const trailer = p.trailers.build(raw, settings, deltaKm, now);

    const activity: ActivityState = raw.paused
      ? 'paused'
      : !raw.engineEnabled
        ? 'engine-off'
        : (parts.motion.speedKmh ?? 0) > 1
          ? 'driving'
          : 'stopped';

    const frame: TelemetryFrame = {
      source,
      seq: ++this.seq,
      timestamp: now,
      connection: { ...conn, activity },
      ...parts,
      truck,
      trailer,
      trip: p.trip.snapshot(now),
      alerts: [],
    };
    const place = raw.onJob ? ((parts.motion.speedKmh ?? 0) > 2 ? 'rodovia' : raw.citySrc || null) : null;
    frame.duty = p.duty.update(raw, place);
    p.docs.update(raw, frame);
    frame.paperwork = p.docs.paperwork();
    frame.alerts = buildAlerts(frame, settings);
    return frame;
  }
}

export function buildAlerts(f: TelemetryFrame, s: Settings): Alert[] {
  const out: Alert[] = [];
  const add = (id: string, level: Alert['level'], message: string) => out.push({ id, level, message });
  if (s.alerts.overSpeed && f.motion.overLimit) add('overspeed', 'warning', `Acima do limite da via (${f.motion.speedLimitKmh} km/h)`);
  if (f.motion.speedKmh !== null && f.motion.speedKmh > s.configuredMaxSpeedKmh + 0.5)
    add('maxspeed', 'warning', `Acima da velocidade máxima configurada (${s.configuredMaxSpeedKmh} km/h)`);
  if (f.fuel.percent !== null && f.fuel.percent <= s.alerts.fuelPercent)
    add('fuel', f.fuel.percent <= s.alerts.fuelPercent / 2 ? 'critical' : 'warning', `Combustível baixo (${f.fuel.percent.toFixed(0)}%)`);
  if (f.engine.waterTempC !== null && f.engine.waterTempC >= s.alerts.waterTempC)
    add('water', 'critical', `Temperatura do motor alta (${f.engine.waterTempC.toFixed(0)} °C)`);
  if (f.engine.oilTempC !== null && f.engine.oilTempC >= s.alerts.oilTempC)
    add('oil', 'critical', `Temperatura do óleo alta (${f.engine.oilTempC.toFixed(0)} °C)`);
  const w = f.engine.warnings;
  if (w.oilPressure && f.engine.engineOn) add('oilp', 'critical', 'Pressão do óleo baixa (alerta do jogo)');
  if (w.waterTemp) add('waterw', 'critical', 'Superaquecimento (alerta do jogo)');
  if (w.batteryVoltage && f.engine.engineOn) add('battery', 'warning', 'Tensão da bateria baixa (alerta do jogo)');
  if (w.airPressureEmergency) add('airE', 'critical', 'Pressão de ar em nível de emergência');
  else if (w.airPressure) add('air', 'warning', 'Pressão de ar baixa');
  if (w.adblue) add('adblue', 'warning', 'AdBlue baixo');
  const wearLimit = s.alerts.wearPercent / 100;
  const wearNames: [keyof TelemetryFrame['wear'], string][] = [
    ['engine', 'motor'], ['transmission', 'transmissão'], ['chassis', 'chassi'], ['cabin', 'cabine'],
    ['wheels', 'rodas'], ['trailerChassis', 'chassi do reboque'], ['trailerWheels', 'rodas do reboque'],
    ['trailerBody', 'carroceria do reboque'],
  ];
  for (const [k, label] of wearNames) {
    const v = f.wear[k];
    if (v !== null && v >= wearLimit) add(`wear-${k}`, v >= Math.min(1, wearLimit * 2) ? 'critical' : 'warning', `Desgaste de ${label}: ${(v * 100).toFixed(0)}%`);
  }
  if (f.engine.parkingBrake && (f.motion.speedKmh ?? 0) > 3) add('park', 'critical', 'Freio de estacionamento acionado em movimento');
  // jornada (regra SIMULADA, Lei 13.103) e descanso exigido pelo próprio jogo (restStop do SDK)
  const d = f.duty;
  if (d) {
    if (d.continuousDrivingMin > d.limits.continuousMin) add('duty', 'critical', 'Jornada: direção contínua acima de 5 h 30 — faça a pausa de 30 min (regra simulada)');
    else if (d.continuousDrivingMin >= 300) add('duty', 'warning', `Jornada: ${d.limits.continuousMin - d.continuousDrivingMin} min até a pausa obrigatória (regra simulada)`);
    if (d.gameRestStopMin !== null && d.gameRestStopMin < 0) add('reststop', 'critical', 'O jogo exige descanso agora (restStop)');
    else if (d.gameRestStopMin !== null && d.gameRestStopMin <= 30) add('reststop', 'warning', `Descanso exigido pelo jogo em ${d.gameRestStopMin} min (restStop)`);
  }
  if (f.paperwork?.awaitingSignature) add('sign', 'info', 'Entrega concluída — assine o canhoto da NF-e (Documentos)');
  return out;
}
