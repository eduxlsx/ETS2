/**
 * Camada de adaptação de versões do SDK/plugin.
 *
 * O cabeçalho (sdkActive, paused, time, revisão do plugin em offset 40) é
 * estável entre revisões recentes do scs-sdk-plugin; a partir da revisão
 * escolhemos o adaptador de layout. Para suportar uma revisão nova basta
 * criar `layouts/revNN.ts` + um adaptador e registrá-lo em ADAPTERS.
 */
import { LayoutReader } from './layout.js';
import {
  REV12_MMF_NAME,
  REV12_TOTAL_SIZE,
  REV12_TRAILER_BASE,
  REV12_TRAILER_COUNT,
  REV12_TRAILER_SIZE,
  rev12Layout,
  rev12TrailerLayout,
} from './layouts/rev12.js';
import type { RawHeader, RawTelemetry, RawTrailer, RawWheel, SdkLayoutAdapter } from './raw.js';

export const HEADER_SIZE = 44;

export function readHeader(buf: Buffer): RawHeader {
  if (buf.length < HEADER_SIZE) throw new RangeError('Buffer menor que o cabeçalho');
  return {
    sdkActive: buf.readUInt8(0) !== 0,
    paused: buf.readUInt8(4) !== 0,
    time: buf.readBigUInt64LE(8),
    pluginRevision: buf.readUInt32LE(40),
  };
}

const MAX_WHEELS = 16;

function rev12Parse(buf: Buffer): RawTelemetry {
  const r = new LayoutReader(buf, rev12Layout);
  const header = readHeader(buf);
  const wheelCount = Math.min(r.num('truckWheelCount'), MAX_WHEELS);
  const wheels: RawWheel[] = [];
  for (let w = 0; w < wheelCount; w++) {
    wheels.push({
      positionX: r.num('truckWheelPositionX', w),
      positionY: r.num('truckWheelPositionY', w),
      positionZ: r.num('truckWheelPositionZ', w),
      radius: r.num('truckWheelRadius', w),
      suspDeflection: r.num('truck_wheelSuspDeflection', w),
      onGround: r.bool('truck_wheelOnGround', w),
      lift: r.num('truck_wheelLift', w),
      liftable: r.bool('truckWheelLiftable', w),
      powered: r.bool('truckWheelPowered', w),
      steerable: r.bool('truckWheelSteerable', w),
      simulated: r.bool('truckWheelSimulated', w),
      substance: r.num('truck_wheelSubstance', w),
    });
  }

  const substances: string[] = [];
  for (let k = 0; k < 25; k++) substances.push(r.str('substance', k));

  const trailers: RawTrailer[] = [];
  const trailerSlots = Math.min(r.num('maxTrailerCount') || REV12_TRAILER_COUNT, REV12_TRAILER_COUNT);
  for (let t = 0; t < trailerSlots; t++) {
    const tr = r.sub(rev12TrailerLayout, REV12_TRAILER_BASE + t * REV12_TRAILER_SIZE);
    const tWheelCount = Math.min(tr.num('wheelCount'), MAX_WHEELS);
    const tWheels: RawWheel[] = [];
    for (let w = 0; w < tWheelCount; w++) {
      tWheels.push({
        positionX: tr.num('wheelPositionX', w),
        positionY: tr.num('wheelPositionY', w),
        positionZ: tr.num('wheelPositionZ', w),
        radius: tr.num('wheelRadius', w),
        suspDeflection: tr.num('wheelSuspDeflection', w),
        onGround: tr.bool('wheelOnGround', w),
        lift: tr.num('wheelLift', w),
        liftable: tr.bool('wheelLiftable', w),
        powered: tr.bool('wheelPowered', w),
        steerable: tr.bool('wheelSteerable', w),
        simulated: tr.bool('wheelSimulated', w),
        substance: tr.num('wheelSubstance', w),
      });
    }
    trailers.push({
      attached: tr.bool('attached'),
      id: tr.str('id'),
      cargoAccessoryId: tr.str('cargoAcessoryId'),
      bodyType: tr.str('bodyType'),
      brandId: tr.str('brandId'),
      brand: tr.str('brand'),
      name: tr.str('name'),
      chainType: tr.str('chainType'),
      licensePlate: tr.str('licensePlate'),
      licensePlateCountry: tr.str('licensePlateCountry'),
      wheelCount: tWheelCount,
      cargoDamage: tr.num('cargoDamage'),
      wearChassis: tr.num('wearChassis'),
      wearWheels: tr.num('wearWheels'),
      wearBody: tr.num('wearBody'),
      wheels: tWheels,
    });
  }

  return {
    ...header,
    simulatedTime: r.big('simulatedTime'),
    renderTime: r.big('renderTime'),
    multiplayerTimeOffset: r.big('multiplayerTimeOffset'),
    game: r.num('game'),
    versionMajor: r.num('version_major'),
    versionMinor: r.num('version_minor'),
    telemetryVersionMajor: r.num('telemetry_version_game_major'),
    telemetryVersionMinor: r.num('telemetry_version_game_minor'),
    timeAbs: r.num('time_abs'),
    scale: r.num('scale'),
    restStop: r.num('restStop'),

    gears: r.num('gears'),
    gearsReverse: r.num('gears_reverse'),
    retarderStepCount: r.num('retarderStepCount'),
    truckWheelCount: wheelCount,
    fuelCapacity: r.num('fuelCapacity'),
    fuelWarningFactor: r.num('fuelWarningFactor'),
    adblueCapacity: r.num('adblueCapacity'),
    airPressureWarning: r.num('airPressureWarning'),
    airPressureEmergency: r.num('airPressurEmergency'),
    oilPressureWarning: r.num('oilPressureWarning'),
    waterTemperatureWarning: r.num('waterTemperatureWarning'),
    batteryVoltageWarning: r.num('batteryVoltageWarning'),
    engineRpmMax: r.num('engineRpmMax'),
    cargoMass: r.num('cargoMass'),
    isCargoLoaded: r.bool('isCargoLoaded'),
    truckBrandId: r.str('truckBrandId'),
    truckBrand: r.str('truckBrand'),
    truckId: r.str('truckId'),
    truckName: r.str('truckName'),
    truckLicensePlate: r.str('truckLicensePlate'),
    truckLicensePlateCountry: r.str('truckLicensePlateCountry'),
    shifterType: r.str('shifterType'),

    speed: r.num('speed'),
    engineRpm: r.num('engineRpm'),
    gear: r.num('gear'),
    gearDashboard: r.num('gearDashboard'),
    throttle: r.num('gameThrottle'),
    brake: r.num('gameBrake'),
    clutch: r.num('gameClutch'),
    cruiseControlSpeed: r.num('cruiseControlSpeed'),
    cruiseControl: r.bool('cruiseControl'),
    airPressure: r.num('airPressure'),
    brakeTemperature: r.num('brakeTemperature'),
    fuel: r.num('fuel'),
    fuelAvgConsumption: r.num('fuelAvgConsumption'),
    fuelRange: r.num('fuelRange'),
    adblue: r.num('adblue'),
    oilPressure: r.num('oilPressure'),
    oilTemperature: r.num('oilTemperature'),
    waterTemperature: r.num('waterTemperature'),
    batteryVoltage: r.num('batteryVoltage'),
    lightsDashboard: r.num('lightsDashboard'),
    wearEngine: r.num('wearEngine'),
    wearTransmission: r.num('wearTransmission'),
    wearCabin: r.num('wearCabin'),
    wearChassis: r.num('wearChassis'),
    wearWheels: r.num('wearWheels'),
    odometer: r.num('truckOdometer'),
    routeDistance: r.num('routeDistance'),
    routeTime: r.num('routeTime'),
    speedLimit: r.num('speedLimit'),
    retarderBrake: r.num('retarderBrake'),
    lightsAuxFront: r.num('lightsAuxFront'),
    lightsAuxRoof: r.num('lightsAuxRoof'),
    accelerationZ: r.num('accelerationZ'),

    parkBrake: r.bool('parkBrake'),
    motorBrake: r.bool('motorBrake'),
    airPressureWarningOn: r.bool('airPressureWarningOn'),
    airPressureEmergencyOn: r.bool('airPressureEmergencyOn'),
    fuelWarning: r.bool('fuelWarning'),
    adblueWarning: r.bool('adblueWarning'),
    oilPressureWarningOn: r.bool('oilPressureWarningOn'),
    waterTemperatureWarningOn: r.bool('waterTemperatureWarningOn'),
    batteryVoltageWarningOn: r.bool('batteryVoltageWarningOn'),
    electricEnabled: r.bool('electricEnabled'),
    engineEnabled: r.bool('engineEnabled'),
    wipers: r.bool('wipers'),
    blinkerLeftActive: r.bool('blinkerLeftActive'),
    blinkerRightActive: r.bool('blinkerRightActive'),
    blinkerLeftOn: r.bool('blinkerLeftOn'),
    blinkerRightOn: r.bool('blinkerRightOn'),
    lightsParking: r.bool('lightsParking'),
    lightsBeamLow: r.bool('lightsBeamLow'),
    lightsBeamHigh: r.bool('lightsBeamHigh'),
    lightsBeacon: r.bool('lightsBeacon'),
    lightsBrake: r.bool('lightsBrake'),
    lightsReverse: r.bool('lightsReverse'),
    lightsHazard: r.bool('lightsHazard'),
    differentialLock: r.bool('differentialLock'),
    liftAxle: r.bool('liftAxle'),
    liftAxleIndicator: r.bool('liftAxleIndicator'),
    trailerLiftAxle: r.bool('trailerLiftAxle'),
    trailerLiftAxleIndicator: r.bool('trailerLiftAxleIndicator'),

    wheels,

    onJob: r.bool('onJob'),
    cargo: r.str('cargo'),
    citySrc: r.str('citySrc'),
    compSrc: r.str('compSrc'),
    cityDst: r.str('cityDst'),
    compDst: r.str('compDst'),
    jobIncome: r.num('jobIncome'),
    jobMarket: r.str('jobMarket'),
    plannedDistanceKm: r.num('plannedDistanceKm'),
    cargoDamage: r.num('cargoDamage'),
    cargoId: r.str('cargoId'),
    unitCount: r.num('unitCount'),
    citySrcId: r.str('citySrcId'),
    compSrcId: r.str('compSrcId'),
    cityDstId: r.str('cityDstId'),
    compDstId: r.str('compDstId'),
    timeAbsDelivery: r.num('time_abs_delivery'),
    jobStartingTime: r.num('jobStartingTime'),
    jobFinishedTime: r.num('jobFinishedTime'),
    truckLicensePlateCountryId: r.str('truckLicensePlateCountryId'),

    jobDelivered: r.bool('jobDelivered'),
    jobDeliveredRevenue: r.num('jobDeliveredRevenue'),
    jobDeliveredCargoDamage: r.num('jobDeliveredCargoDamage'),
    jobDeliveredDistanceKm: r.num('jobDeliveredDistanceKm'),
    jobDeliveredDeliveryTime: r.num('jobDeliveredDeliveryTime'),
    jobDeliveredEarnedXp: r.num('jobDeliveredEarnedXp'),
    jobDeliveredAutoparkUsed: r.bool('jobDeliveredAutoparkUsed'),
    jobDeliveredAutoloadUsed: r.bool('jobDeliveredAutoloadUsed'),
    jobCancelled: r.bool('jobCancelled'),
    jobCancelledPenalty: r.num('jobCancelledPenalty'),
    jobFinished: r.bool('jobFinished'),
    fined: r.bool('fined'),
    fineOffence: r.str('fineOffence'),
    fineAmount: r.num('fineAmount'),
    tollgate: r.bool('tollgate'),
    tollgatePayAmount: r.num('tollgatePayAmount'),
    ferry: r.bool('ferry'),
    ferrySourceName: r.str('ferrySourceName'),
    ferryTargetName: r.str('ferryTargetName'),
    ferryPayAmount: r.num('ferryPayAmount'),
    train: r.bool('train'),
    trainSourceName: r.str('trainSourceName'),
    trainTargetName: r.str('trainTargetName'),
    trainPayAmount: r.num('trainPayAmount'),
    refuel: r.bool('refuel'),
    refuelPayed: r.bool('refuelPayed'),
    refuelAmount: r.num('refuelAmount'),

    substances,
    trailers,
  };
}

export const rev12Adapter: SdkLayoutAdapter = {
  revision: 12,
  label: 'scs-sdk-plugin V.1.12.x (PLUGIN_REVID 12)',
  mmfName: REV12_MMF_NAME,
  size: REV12_TOTAL_SIZE,
  parse: rev12Parse,
};

export const ADAPTERS: SdkLayoutAdapter[] = [rev12Adapter];

export const SUPPORTED_REVISIONS = ADAPTERS.map((a) => a.revision);

/** Maior tamanho que qualquer adaptador precisa ler. */
export const MAX_READ_SIZE = Math.max(...ADAPTERS.map((a) => a.size));

export function adapterFor(revision: number): SdkLayoutAdapter | null {
  return ADAPTERS.find((a) => a.revision === revision) ?? null;
}
