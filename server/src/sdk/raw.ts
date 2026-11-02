/**
 * Telemetria "crua": valores como o SCS SDK entrega (unidades nativas do SDK),
 * independentes da revisão do plugin. Cada adaptador de layout produz este
 * formato; o Data Parser converte/valida para o TelemetryFrame do painel.
 */

export interface RawWheel {
  positionX: number;
  positionY: number;
  positionZ: number;
  radius: number;
  suspDeflection: number; // m
  onGround: boolean;
  lift: number; // 0..1
  liftable: boolean;
  powered: boolean;
  steerable: boolean;
  simulated: boolean;
  substance: number; // índice na tabela de substâncias
}

export interface RawTrailer {
  attached: boolean;
  id: string;
  cargoAccessoryId: string;
  bodyType: string;
  brandId: string;
  brand: string;
  name: string;
  chainType: string;
  licensePlate: string;
  licensePlateCountry: string;
  wheelCount: number;
  cargoDamage: number;
  wearChassis: number;
  wearWheels: number;
  wearBody: number;
  wheels: RawWheel[];
}

export interface RawHeader {
  sdkActive: boolean;
  paused: boolean;
  /** Timestamp interno do plugin (µs), avança a cada frame de telemetria. */
  time: bigint;
  pluginRevision: number;
}

export interface RawTelemetry extends RawHeader {
  simulatedTime: bigint;
  renderTime: bigint;
  multiplayerTimeOffset: bigint;
  game: number; // 0 desconhecido, 1 ETS2, 2 ATS
  versionMajor: number;
  versionMinor: number;
  telemetryVersionMajor: number;
  telemetryVersionMinor: number;
  timeAbs: number; // minutos do jogo
  scale: number;
  restStop: number; // minutos

  // config
  gears: number;
  gearsReverse: number;
  retarderStepCount: number;
  truckWheelCount: number;
  fuelCapacity: number; // L
  fuelWarningFactor: number;
  adblueCapacity: number;
  airPressureWarning: number; // psi
  airPressureEmergency: number;
  oilPressureWarning: number; // psi
  waterTemperatureWarning: number; // °C
  batteryVoltageWarning: number; // V
  engineRpmMax: number;
  cargoMass: number; // kg
  isCargoLoaded: boolean;
  truckBrandId: string;
  truckBrand: string;
  truckId: string;
  truckName: string;
  truckLicensePlate: string;
  truckLicensePlateCountry: string;
  shifterType: string;

  // truck channels
  speed: number; // m/s
  engineRpm: number;
  gear: number;
  gearDashboard: number;
  throttle: number; // game*, 0..1
  brake: number;
  clutch: number;
  cruiseControlSpeed: number; // m/s
  cruiseControl: boolean;
  airPressure: number; // psi
  brakeTemperature: number; // °C
  fuel: number; // L
  fuelAvgConsumption: number; // L/km
  fuelRange: number; // km
  adblue: number;
  oilPressure: number; // psi
  oilTemperature: number;
  waterTemperature: number;
  batteryVoltage: number;
  lightsDashboard: number;
  wearEngine: number;
  wearTransmission: number;
  wearCabin: number;
  wearChassis: number;
  wearWheels: number;
  odometer: number; // km
  routeDistance: number; // m
  routeTime: number; // s
  speedLimit: number; // m/s
  retarderBrake: number;
  lightsAuxFront: number;
  lightsAuxRoof: number;
  accelerationZ: number;

  parkBrake: boolean;
  motorBrake: boolean;
  airPressureWarningOn: boolean;
  airPressureEmergencyOn: boolean;
  fuelWarning: boolean;
  adblueWarning: boolean;
  oilPressureWarningOn: boolean;
  waterTemperatureWarningOn: boolean;
  batteryVoltageWarningOn: boolean;
  electricEnabled: boolean;
  engineEnabled: boolean;
  wipers: boolean;
  blinkerLeftActive: boolean;
  blinkerRightActive: boolean;
  blinkerLeftOn: boolean;
  blinkerRightOn: boolean;
  lightsParking: boolean;
  lightsBeamLow: boolean;
  lightsBeamHigh: boolean;
  lightsBeacon: boolean;
  lightsBrake: boolean;
  lightsReverse: boolean;
  lightsHazard: boolean;
  differentialLock: boolean;
  liftAxle: boolean;
  liftAxleIndicator: boolean;
  trailerLiftAxle: boolean;
  trailerLiftAxleIndicator: boolean;

  wheels: RawWheel[];

  // job
  onJob: boolean;
  cargo: string;
  citySrc: string;
  compSrc: string;
  cityDst: string;
  compDst: string;
  jobIncome: number;
  jobMarket: string;
  plannedDistanceKm: number;
  cargoDamage: number;
  cargoId: string;
  unitCount: number;
  citySrcId: string;
  compSrcId: string;
  cityDstId: string;
  compDstId: string;
  /** Prazo da entrega (minutos absolutos do jogo, time_abs_delivery). */
  timeAbsDelivery: number;
  jobStartingTime: number;
  jobFinishedTime: number;
  truckLicensePlateCountryId: string;

  // eventos de gameplay (ficam true por um instante; detecção de borda no servidor)
  jobDelivered: boolean;
  jobDeliveredRevenue: number; // €
  jobDeliveredCargoDamage: number; // 0..1
  jobDeliveredDistanceKm: number;
  jobDeliveredDeliveryTime: number; // min do jogo
  jobDeliveredEarnedXp: number;
  jobDeliveredAutoparkUsed: boolean;
  jobDeliveredAutoloadUsed: boolean;
  jobCancelled: boolean;
  jobCancelledPenalty: number; // €
  jobFinished: boolean;
  fined: boolean;
  fineOffence: string;
  fineAmount: number; // €
  tollgate: boolean;
  tollgatePayAmount: number; // €
  ferry: boolean;
  ferrySourceName: string;
  ferryTargetName: string;
  ferryPayAmount: number;
  train: boolean;
  trainSourceName: string;
  trainTargetName: string;
  trainPayAmount: number;
  refuel: boolean;
  refuelPayed: boolean;
  refuelAmount: number; // L

  substances: string[];
  trailers: RawTrailer[];
}

export interface SdkLayoutAdapter {
  revision: number;
  label: string;
  mmfName: string;
  /** Bytes que precisam ser lidos da memória. */
  size: number;
  parse(buf: Buffer): RawTelemetry;
}
