
export type DataSource = 'live' | 'demo';

/** Estado da conexão com o jogo / plugin. */
export type ConnectionState =
  | 'game-not-running' // processo do ETS2/ATS não encontrado
  | 'plugin-missing' // jogo aberto, mas a memória compartilhada não existe (plugin não instalado/carregado)
  | 'waiting-sdk' // memória existe, mas o SDK ainda não está ativo (menu inicial / carregando)
  | 'incompatible' // revisão do plugin sem layout conhecido
  | 'stale' // memória existe, mas o timestamp parou de avançar sem pausa
  | 'connected'
  | 'demo';

/** O que o jogador está fazendo agora. */
export type ActivityState = 'offline' | 'paused' | 'engine-off' | 'stopped' | 'driving';

export interface ConnectionInfo {
  state: ConnectionState;
  activity: ActivityState;
  message: string;
  gameProcess: string | null;
  pluginRevision: number | null;
  /** Revisões de layout suportadas pela camada de adaptação. */
  supportedRevisions: number[];
  lastDataAt: number | null;
  reconnectAttempts: number;
}

export interface GameInfo {
  game: 'ets2' | 'ats' | 'unknown' | null;
  gameVersion: string | null;
  telemetryVersion: string | null;
  paused: boolean | null;
  /** Minutos absolutos do jogo (0 = segunda-feira 00:00). */
  gameTimeMin: number | null;
  /** Escala de tempo do jogo (ex.: 19 no ETS2). */
  timeScale: number | null;
  /** Minutos até o próximo descanso obrigatório. */
  restStopMin: number | null;
  multiplayer: boolean | null;
}

export interface TruckIdentity {
  brandId: string | null;
  brand: string | null;
  id: string | null;
  name: string | null;
  licensePlate: string | null;
  licensePlateCountry: string | null;
  /** Chave do modelo 2D resolvida pelo Vehicle Manager. */
  modelKey: string;
  modelSource: 'auto' | 'manual' | 'fallback';
}

export interface MotionData {
  speedKmh: number | null;
  /** Limite da via informado pelo jogo (0 = sem limite conhecido → null). */
  speedLimitKmh: number | null;
  overLimit: boolean;
  cruiseControlOn: boolean | null;
  cruiseControlKmh: number | null;
  odometerKm: number | null;
  /** Aceleração longitudinal (m/s²) no espaço do veículo. */
  accelerationZ: number | null;
}

export interface EngineData {
  engineOn: boolean | null;
  electricOn: boolean | null;
  rpm: number | null;
  rpmMax: number | null;
  gear: number | null;
  gearDashboard: number | null;
  gearLabel: string;
  forwardGears: number | null;
  reverseGears: number | null;
  shifterType: string | null;
  engineBrake: boolean | null;
  retarderStep: number | null;
  retarderStepCount: number | null;
  waterTempC: number | null;
  oilTempC: number | null;
  oilPressurePsi: number | null;
  batteryVoltage: number | null;
  airPressurePsi: number | null;
  brakeTempC: number | null;
  throttle: number | null;
  brake: number | null;
  clutch: number | null;
  parkingBrake: boolean | null;
  differentialLock: boolean | null;
  warnings: {
    oilPressure: boolean | null;
    waterTemp: boolean | null;
    batteryVoltage: boolean | null;
    airPressure: boolean | null;
    airPressureEmergency: boolean | null;
    fuel: boolean | null;
    adblue: boolean | null;
  };
  thresholds: {
    oilPressurePsi: number | null;
    waterTempC: number | null;
    batteryVoltage: number | null;
    airPressurePsi: number | null;
  };
}

export interface FuelData {
  liters: number | null;
  capacityLiters: number | null;
  capacitySource: 'sdk' | 'manual' | null;
  percent: number | null;
  /** Consumo médio calculado pelo próprio jogo (L/100 km). */
  avgConsumptionL100: number | null;
  /** Autonomia estimada calculada pelo jogo (km). */
  rangeKm: number | null;
  reserve: boolean | null;
  warningFactor: number | null;
  adblueLiters: number | null;
  adblueCapacityLiters: number | null;
}

export type AuxLightLevel = 0 | 1 | 2; // 0 = desligado, 1 = reduzido, 2 = máximo

export interface LightsData {
  parking: boolean | null;
  lowBeam: boolean | null;
  highBeam: boolean | null;
  auxFront: AuxLightLevel | null;
  auxRoof: AuxLightLevel | null;
  /** Seta selecionada (alavanca). */
  blinkerLeftActive: boolean | null;
  blinkerRightActive: boolean | null;
  /** Lâmpada da seta acesa neste instante (ciclo real do jogo). */
  blinkerLeftOn: boolean | null;
  blinkerRightOn: boolean | null;
  hazard: boolean | null;
  brake: boolean | null;
  reverse: boolean | null;
  beacon: boolean | null;
  /** Intensidade da iluminação do painel 0..1. */
  dashboardBacklight: number | null;
}

export interface WiperData {
  on: boolean | null;
  /** O SDK da SCS só fornece ligado/desligado. Sempre null até existir canal. */
  stage: number | null;
}

export interface EnvironmentData {
  /** O SDK da SCS não expõe clima. Mantido null e documentado. */
  rain: boolean | null;
  rainIntensityPct: number | null;
  visibility: string | null;
  /** Fase do dia derivada do horário do jogo (não é um canal de clima). */
  dayPhase: 'madrugada' | 'manhã' | 'tarde' | 'noite' | null;
  gameTimeLabel: string | null;
  weekday: string | null;
  /** Superfícies sob as rodas no chão (canal truck.wheel.substance). */
  roadSurfaces: string[];
}

export interface WheelData {
  index: number;
  /** Posição da roda no espaço do veículo (m). x = lateral, y = vertical, z = longitudinal (+ para trás). */
  position: { x: number; y: number; z: number } | null;
  radius: number | null;
  /** Deflexão da suspensão (m) — canal wheel.susp.deflection. */
  suspDeflection: number | null;
  onGround: boolean | null;
  lift: number | null;
  liftable: boolean | null;
  powered: boolean | null;
  steerable: boolean | null;
  substance: string | null;
}

export interface SuspensionData {
  truckWheels: WheelData[];
  trailerWheels: WheelData[];
  liftAxle: boolean | null;
  liftAxleIndicator: boolean | null;
  trailerLiftAxle: boolean | null;
  /** Média de deflexão do(s) eixo(s) traseiro(s) do cavalo (m). */
  truckRearAvgDeflection: number | null;
  trailerAvgDeflection: number | null;
  /** Desvio padrão recente da deflexão traseira (oscilação), em mm. */
  truckRearOscillationMm: number | null;
  trailerOscillationMm: number | null;
}

export interface WearData {
  engine: number | null;
  transmission: number | null;
  cabin: number | null;
  chassis: number | null;
  wheels: number | null;
  trailerChassis: number | null;
  trailerWheels: number | null;
  trailerBody: number | null;
  cargo: number | null;
}

export interface TrailerData {
  attached: boolean | null;
  count: number;
  id: string | null;
  name: string | null;
  brand: string | null;
  bodyType: string | null;
  chainType: string | null;
  cargoAccessoryId: string | null;
  licensePlate: string | null;
  cargoName: string | null;
  cargoMassKg: number | null;
  cargoLoaded: boolean | null;
  wheelCount: number | null;
  /** Distância percorrida com este reboque, calculada localmente (km). */
  localDistanceKm: number | null;
  modelKey: string;
  /** Origem do tipo de desenho: identificado pelo SDK, escolhido manualmente ou aproximado (baú). */
  modelSource?: 'auto' | 'manual' | 'fallback';
}

export interface JobData {
  onJob: boolean | null;
  cargo: string | null;
  sourceCity: string | null;
  sourceCompany: string | null;
  destinationCity: string | null;
  destinationCompany: string | null;
  income: number | null;
  plannedDistanceKm: number | null;
  routeDistanceKm: number | null;
  routeTimeS: number | null;
  market: string | null;
  /** Identificador interno da carga (cargo_id do SDK), usado na tabela de NCM simulada. */
  cargoId?: string | null;
  unitCount?: number | null;
  /** Prazo da entrega (minutos absolutos do jogo, time_abs_delivery). */
  deadlineGameMin?: number | null;
  /** Início do frete (jobStartingTime, minutos do jogo). */
  startedGameMin?: number | null;
}

export interface TripSnapshot {
  tripId: number | null;
  startedAt: number;
  distanceKm: number;
  drivingTimeS: number;
  elapsedS: number;
  avgSpeedKmh: number | null;
  maxSpeedKmh: number;
  fuelUsedL: number;
  avgConsumptionL100: number | null;
  sessionDistanceKm: number;
  sessionDrivingTimeS: number;
  sessionStartedAt: number | null;
  persisted: boolean;
}

export interface TelemetryFrame {
  source: DataSource;
  seq: number;
  timestamp: number;
  connection: ConnectionInfo;
  game: GameInfo;
  truck: TruckIdentity;
  motion: MotionData;
  engine: EngineData;
  fuel: FuelData;
  lights: LightsData;
  wipers: WiperData;
  environment: EnvironmentData;
  suspension: SuspensionData;
  wear: WearData;
  trailer: TrailerData;
  job: JobData;
  trip: TripSnapshot;
  alerts: Alert[];
  /** Resumo da papelada do frete atual (documentManager). */
  paperwork?: PaperworkSummary | null;
  /** Resumo da jornada do motorista (dutyManager). */
  duty?: DutySummary | null;
}

export type AlertLevel = 'info' | 'warning' | 'critical';
export interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
}

export interface Settings {
  speedUnit: 'kmh' | 'mph';
  distanceUnit: 'km' | 'mi';
  fuelUnit: 'l' | 'gal';
  temperatureUnit: 'c' | 'f';
  pressureUnit: 'bar' | 'psi';
  theme: 'graphite' | 'midnight' | 'contrast';
  vehicleMode: 'auto' | 'manual';
  manualVehicleModel: string;
  trailerModel:
    | 'auto'
    | 'box' | 'curtain' | 'reefer' | 'tanker' | 'flatbed'
    | 'container' | 'lowbed' | 'log' | 'bulk' | 'tipper' | 'car_transporter' | 'livestock';
  updateRateHz: number;
  configuredMaxSpeedKmh: number;
  speedLimitToleranceKmh: number;
  fuelCapacityOverrideL: number | null;
  tripAutoResetOnJob: boolean;
  alerts: {
    fuelPercent: number;
    waterTempC: number;
    oilTempC: number;
    wearPercent: number;
    overSpeed: boolean;
  };
  suspensionExaggeration: number;
  setupCompleted: boolean;
  autoStart: boolean;
  docs?: DocsSettings;
}

export const DEFAULT_SETTINGS: Settings = {
  speedUnit: 'kmh',
  distanceUnit: 'km',
  fuelUnit: 'l',
  temperatureUnit: 'c',
  pressureUnit: 'bar',
  theme: 'graphite',
  vehicleMode: 'auto',
  manualVehicleModel: 'scania-r',
  trailerModel: 'auto',
  updateRateHz: 20,
  configuredMaxSpeedKmh: 90,
  speedLimitToleranceKmh: 3,
  fuelCapacityOverrideL: null,
  tripAutoResetOnJob: false,
  alerts: {
    fuelPercent: 15,
    waterTempC: 105,
    oilTempC: 120,
    wearPercent: 25,
    overSpeed: true,
  },
  suspensionExaggeration: 8,
  setupCompleted: false,
  autoStart: false,
};

/** Mensagens servidor → cliente. */
export type ServerMessage =
  | { type: 'frame'; data: TelemetryFrame }
  | { type: 'settings'; data: Settings }
  | { type: 'hello'; data: { version: string; mode: DataSource; settings: Settings } }
  | { type: 'doc'; doc: TripDocSummary }
  | { type: 'dispatch'; message: DispatchMessage }
  | { type: 'duty'; summary: DutySummary };

/** Mensagens cliente → servidor. */
export type ClientMessage = { type: 'setMode'; mode: DataSource } | { type: 'ping' };

export interface VehicleModelInfo {
  key: string;
  label: string;
  brand: string;
}

export interface DiagnosticsReport {
  platform: string;
  nodeVersion: string;
  ffiAvailable: boolean;
  ffiError: string | null;
  gameProcess: string | null;
  gameInstallPath: string | null;
  pluginInstalled: boolean | null;
  pluginPath: string | null;
  sharedMemoryOpen: boolean;
  pluginRevision: number | null;
  revisionSupported: boolean | null;
  sdkActive: boolean | null;
  gameVersion: string | null;
  telemetryVersion: string | null;
  connection: ConnectionInfo;
  checks: { id: string; ok: boolean | null; label: string; detail: string }[];
}

export type DocType = 'nfe' | 'cte' | 'mdfe' | 'toll' | 'ferry' | 'train' | 'fuel' | 'fine' | 'delivery';
export type DocStatus = 'issued' | 'transit' | 'awaiting_signature' | 'delivered' | 'cancelled' | 'archived';
export type JobStatus = 'issued' | 'transit' | 'awaiting_signature' | 'delivered' | 'cancelled' | 'archived';

export type StampKind = 'received' | 'damage' | 'cancelled';
export interface DocStamp {
  kind: StampKind;
  color: 'blue' | 'red';
  /** Rotação final (graus). */
  rot: number;
  /** Momento real (ms) em que foi aplicado. */
  at: number;
  /** Textos do carimbo. */
  lines: string[];
}

/** Traço de assinatura: pontos [x, y, largura] com x,y normalizados (0..1). */
export type SignatureStroke = [number, number, number][];

export interface TripDoc {
  id: number;
  jobId: number | null;
  type: DocType;
  number: number | null;
  /** Chave de acesso de 44 dígitos (modelos 55/57/58/65). */
  key: string | null;
  status: DocStatus;
  /** Minutos absolutos do jogo (time_abs) na emissão. */
  gameMin: number;
  createdAt: number;
  source: DataSource;
  /** Título curto para a pasta. */
  title: string;
  /** Snapshot dos campos do SDK + valores SIM usados no render. */
  data: Record<string, any>;
  signature?: { strokes: SignatureStroke[]; signedAt: number; auto: boolean } | null;
  stamps?: DocStamp[] | null;
}

/** Item da lista da pasta (sem `data`). */
export type TripDocSummary = Omit<TripDoc, 'data' | 'signature'> & { amountEur?: number | null; hasSignature: boolean };

export interface JobRecord {
  id: number;
  status: JobStatus;
  startedGameMin: number;
  deadlineGameMin: number | null;
  finishedGameMin: number | null;
  cargoId: string | null;
  cargo: string | null;
  massKg: number | null;
  units: number | null;
  srcCity: string | null;
  srcCompany: string | null;
  dstCity: string | null;
  dstCompany: string | null;
  incomeEur: number | null;
  plannedKm: number | null;
  deliveredRevenueEur: number | null;
  deliveredDamage: number | null;
  deliveredKm: number | null;
  deliveredTimeMin: number | null;
  earnedXp: number | null;
  autopark: boolean | null;
  autoload: boolean | null;
  cancelPenaltyEur: number | null;
  truckPlate: string | null;
  truckPlateCountry: string | null;
  trailerPlate: string | null;
  truckName: string | null;
  rating: number | null;
  checklist?: Record<string, boolean> | null;
  createdAt: number;
  source: DataSource;
}

export interface LedgerEntry {
  id: number;
  jobId: number | null;
  documentId: number | null;
  gameMin: number;
  kind: 'advance' | 'revenue' | 'toll' | 'ferry' | 'train' | 'fuel' | 'fine' | 'cancel_penalty';
  label: string;
  amountEur: number;
  origin: 'sdk' | 'sim';
  createdAt: number;
}

export interface PaperworkSummary {
  jobId: number;
  status: JobStatus;
  route: string;
  nfe: number | null;
  cte: number | null;
  mdfe: number | null;
  nfeDocId: number | null;
  awaitingSignature: boolean;
  source: DataSource;
}

export type DutyState = 'driving' | 'work' | 'idle' | 'rest';
export interface DutySegment {
  id?: number;
  gameDay: number;
  state: DutyState;
  startGameMin: number;
  endGameMin: number | null;
  km: number;
  place: string | null;
}

export interface DutySummary {
  state: DutyState;
  gameMin: number;
  /** Direção contínua desde a última pausa válida (min do jogo). */
  continuousDrivingMin: number;
  /** Direção acumulada no dia do jogo (min). */
  dailyDrivingMin: number;
  /** Descanso contínuo atual (min). */
  currentRestMin: number;
  /** Maior descanso do último período (interjornada, min). */
  lastLongRestMin: number;
  /** Minutos até o descanso exigido pelo próprio jogo (restStop do SDK). */
  gameRestStopMin: number | null;
  limits: { continuousMin: number; breakMin: number; dailyMin: number; dailyExtraMin: number; interjornadaMin: number };
  source: DataSource;
}

/** Mensagem do despachante (rádio). */
export interface DispatchMessage {
  id: string;
  event: 'job' | 'half' | 'arriving' | 'late' | 'damage' | 'fine' | 'duty' | 'fuel' | 'delivered' | 'cancelled' | 'toll' | 'refuel' | 'ferry';
  level: 'info' | 'ok' | 'warn' | 'crit';
  text: string;
  gameMin: number;
  at: number;
}

export interface DocsSettings {
  driverName: string;
  carrierName: string;
  fxBrlPerEur: number;
  dieselPriceBrl: number;
  /** Avaria (%) acima da qual o canhoto recebe o carimbo vermelho. */
  damageStampPct: number;
  stampSound: boolean;
  dispatcherVoice: boolean;
  dispatcherToasts: boolean;
  autoSign: boolean;
  autoSignMinutes: number;
  checklistOnJob: boolean;
}

export const DEFAULT_DOCS_SETTINGS: DocsSettings = {
  driverName: 'Motorista',
  carrierName: 'TRUCKPULSE TRANSPORTES',
  fxBrlPerEur: 6,
  dieselPriceBrl: 6.19,
  damageStampPct: 5,
  stampSound: false,
  dispatcherVoice: false,
  dispatcherToasts: true,
  autoSign: true,
  autoSignMinutes: 10,
  checklistOnJob: true,
};

/** Configurações de documentos com padrões aplicados. */
export function docsSettings(s: Pick<Settings, 'docs'> | null | undefined): DocsSettings {
  return { ...DEFAULT_DOCS_SETTINGS, ...(s?.docs ?? {}) };
}
