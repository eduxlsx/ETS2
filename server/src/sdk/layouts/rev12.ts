/**
 * Layout da memória compartilhada "Local\SCSTelemetry" do scs-sdk-plugin,
 * PLUGIN_REVID 12 (release V.1.12.x — RenCloud/scs-sdk-plugin).
 *
 * Transcrito de scs-telemetry/inc/scs-telemetry-common.hpp. Os offsets de
 * início de zona são os comentários "START OF ... ZONE AT OFFSET N" do header.
 * Unidades seguem o SCS Telemetry SDK (ver docs/SDK-CHANNELS.md).
 */
import { compileLayout, type FieldDef, type ZoneDef } from '../layout.js';

const S = 64; // stringsize
const b = (name: string, count?: number): FieldDef => ({ name, type: 'bool', count });
const u = (name: string, count?: number): FieldDef => ({ name, type: 'u32', count });
const i = (name: string, count?: number): FieldDef => ({ name, type: 'i32', count });
const f = (name: string, count?: number): FieldDef => ({ name, type: 'f32', count });
const d = (name: string): FieldDef => ({ name, type: 'f64' });
const s = (name: string, size = S, count?: number): FieldDef => ({ name, type: 'str', size, count });
const pad = (name: string, bytes: number): FieldDef => ({ name, type: 'str', size: bytes });

export const REV12_MMF_NAME = 'Local\\SCSTelemetry';
export const REV12_TRAILER_BASE = 6000;
export const REV12_TRAILER_SIZE = 1560;
export const REV12_TRAILER_COUNT = 10;

export const rev12TrailerZones: ZoneDef[] = [
  {
    name: 'trailer.bool',
    start: 0,
    end: 84,
    fields: [
      b('wheelSteerable', 16),
      b('wheelSimulated', 16),
      b('wheelPowered', 16),
      b('wheelLiftable', 16),
      b('wheelOnGround', 16),
      b('attached'),
    ],
  },
  { name: 'trailer.uint', start: 84, end: 152, fields: [u('wheelSubstance', 16), u('wheelCount')] },
  {
    name: 'trailer.float',
    start: 152,
    end: 616,
    fields: [
      f('cargoDamage'),
      f('wearChassis'),
      f('wearWheels'),
      f('wearBody'),
      f('wheelSuspDeflection', 16),
      f('wheelVelocity', 16),
      f('wheelSteering', 16),
      f('wheelRotation', 16),
      f('wheelLift', 16),
      f('wheelLiftOffset', 16),
      f('wheelRadius', 16),
    ],
  },
  {
    name: 'trailer.fvector',
    start: 616,
    end: 872,
    fields: [
      f('linearVelocityX'), f('linearVelocityY'), f('linearVelocityZ'),
      f('angularVelocityX'), f('angularVelocityY'), f('angularVelocityZ'),
      f('linearAccelerationX'), f('linearAccelerationY'), f('linearAccelerationZ'),
      f('angularAccelerationX'), f('angularAccelerationY'), f('angularAccelerationZ'),
      f('hookPositionX'), f('hookPositionY'), f('hookPositionZ'),
      f('wheelPositionX', 16), f('wheelPositionY', 16), f('wheelPositionZ', 16),
    ],
  },
  {
    name: 'trailer.dplacement',
    start: 872,
    end: 920,
    fields: [d('worldX'), d('worldY'), d('worldZ'), d('rotationX'), d('rotationY'), d('rotationZ')],
  },
  {
    name: 'trailer.string',
    start: 920,
    end: 1560,
    fields: [
      s('id'), s('cargoAcessoryId'), s('bodyType'), s('brandId'), s('brand'), s('name'),
      s('chainType'), s('licensePlate'), s('licensePlateCountry'), s('licensePlateCountryId'),
    ],
  },
];

export const rev12Zones: ZoneDef[] = [
  {
    name: 'z1.control',
    start: 0,
    end: 40,
    fields: [
      b('sdkActive'), pad('_p1', 3), b('paused'), pad('_p2', 3),
      { name: 'time', type: 'u64' },
      { name: 'simulatedTime', type: 'u64' },
      { name: 'renderTime', type: 'u64' },
      { name: 'multiplayerTimeOffset', type: 'i64' },
    ],
  },
  {
    name: 'z2.uint',
    start: 40,
    end: 500,
    fields: [
      u('telemetry_plugin_revision'), u('version_major'), u('version_minor'), u('game'),
      u('telemetry_version_game_major'), u('telemetry_version_game_minor'),
      u('time_abs'),
      u('gears'), u('gears_reverse'), u('retarderStepCount'), u('truckWheelCount'), u('selectorCount'),
      u('time_abs_delivery'), u('maxTrailerCount'), u('unitCount'), u('plannedDistanceKm'),
      u('shifterSlot'), u('retarderBrake'), u('lightsAuxFront'), u('lightsAuxRoof'),
      u('truck_wheelSubstance', 16), u('hshifterPosition', 32), u('hshifterBitmask', 32),
      u('jobDeliveredDeliveryTime'), u('jobStartingTime'), u('jobFinishedTime'),
    ],
  },
  {
    name: 'z3.int',
    start: 500,
    end: 700,
    fields: [i('restStop'), i('gear'), i('gearDashboard'), i('hshifterResulting', 32), i('jobDeliveredEarnedXp')],
  },
  {
    name: 'z4.float',
    start: 700,
    end: 1500,
    fields: [
      f('scale'),
      // config_f
      f('fuelCapacity'), f('fuelWarningFactor'), f('adblueCapacity'), f('adblueWarningFactor'),
      f('airPressureWarning'), f('airPressurEmergency'), f('oilPressureWarning'),
      f('waterTemperatureWarning'), f('batteryVoltageWarning'), f('engineRpmMax'),
      f('gearDifferential'), f('cargoMass'), f('truckWheelRadius', 16),
      f('gearRatiosForward', 24), f('gearRatiosReverse', 8), f('unitMass'),
      // truck_f
      f('speed'), f('engineRpm'), f('userSteer'), f('userThrottle'), f('userBrake'), f('userClutch'),
      f('gameSteer'), f('gameThrottle'), f('gameBrake'), f('gameClutch'), f('cruiseControlSpeed'),
      f('airPressure'), f('brakeTemperature'), f('fuel'), f('fuelAvgConsumption'), f('fuelRange'),
      f('adblue'), f('oilPressure'), f('oilTemperature'), f('waterTemperature'), f('batteryVoltage'),
      f('lightsDashboard'), f('wearEngine'), f('wearTransmission'), f('wearCabin'), f('wearChassis'),
      f('wearWheels'), f('truckOdometer'), f('routeDistance'), f('routeTime'), f('speedLimit'),
      f('truck_wheelSuspDeflection', 16), f('truck_wheelVelocity', 16), f('truck_wheelSteering', 16),
      f('truck_wheelRotation', 16), f('truck_wheelLift', 16), f('truck_wheelLiftOffset', 16),
      // gameplay_f / job_f
      f('jobDeliveredCargoDamage'), f('jobDeliveredDistanceKm'), f('refuelAmount'), f('cargoDamage'),
    ],
  },
  {
    name: 'z5.bool',
    start: 1500,
    end: 1640,
    fields: [
      b('truckWheelSteerable', 16), b('truckWheelSimulated', 16), b('truckWheelPowered', 16),
      b('truckWheelLiftable', 16), b('isCargoLoaded'), b('specialJob'),
      b('parkBrake'), b('motorBrake'), b('airPressureWarningOn'), b('airPressureEmergencyOn'),
      b('fuelWarning'), b('adblueWarning'), b('oilPressureWarningOn'), b('waterTemperatureWarningOn'),
      b('batteryVoltageWarningOn'), b('electricEnabled'), b('engineEnabled'), b('wipers'),
      b('blinkerLeftActive'), b('blinkerRightActive'), b('blinkerLeftOn'), b('blinkerRightOn'),
      b('lightsParking'), b('lightsBeamLow'), b('lightsBeamHigh'), b('lightsBeacon'),
      b('lightsBrake'), b('lightsReverse'), b('lightsHazard'), b('cruiseControl'),
      b('truck_wheelOnGround', 16), b('shifterToggle', 2), b('differentialLock'),
      b('liftAxle'), b('liftAxleIndicator'), b('trailerLiftAxle'), b('trailerLiftAxleIndicator'),
      b('jobDeliveredAutoparkUsed'), b('jobDeliveredAutoloadUsed'),
    ],
  },
  {
    name: 'z6.fvector',
    start: 1640,
    end: 2000,
    fields: [
      f('cabinPositionX'), f('cabinPositionY'), f('cabinPositionZ'),
      f('headPositionX'), f('headPositionY'), f('headPositionZ'),
      f('truckHookPositionX'), f('truckHookPositionY'), f('truckHookPositionZ'),
      f('truckWheelPositionX', 16), f('truckWheelPositionY', 16), f('truckWheelPositionZ', 16),
      f('lv_accelerationX'), f('lv_accelerationY'), f('lv_accelerationZ'),
      f('av_accelerationX'), f('av_accelerationY'), f('av_accelerationZ'),
      f('accelerationX'), f('accelerationY'), f('accelerationZ'),
      f('aa_accelerationX'), f('aa_accelerationY'), f('aa_accelerationZ'),
      f('cabinAVX'), f('cabinAVY'), f('cabinAVZ'), f('cabinAAX'), f('cabinAAY'), f('cabinAAZ'),
    ],
  },
  {
    name: 'z7.fplacement',
    start: 2000,
    end: 2200,
    fields: [
      f('cabinOffsetX'), f('cabinOffsetY'), f('cabinOffsetZ'),
      f('cabinOffsetrotationX'), f('cabinOffsetrotationY'), f('cabinOffsetrotationZ'),
      f('headOffsetX'), f('headOffsetY'), f('headOffsetZ'),
      f('headOffsetrotationX'), f('headOffsetrotationY'), f('headOffsetrotationZ'),
    ],
  },
  {
    name: 'z8.dplacement',
    start: 2200,
    end: 2300,
    fields: [d('coordinateX'), d('coordinateY'), d('coordinateZ'), d('rotationX'), d('rotationY'), d('rotationZ')],
  },
  {
    name: 'z9.string',
    start: 2300,
    end: 4000,
    fields: [
      s('truckBrandId'), s('truckBrand'), s('truckId'), s('truckName'),
      s('cargoId'), s('cargo'), s('cityDstId'), s('cityDst'), s('compDstId'), s('compDst'),
      s('citySrcId'), s('citySrc'), s('compSrcId'), s('compSrc'), s('shifterType', 16),
      s('truckLicensePlate'), s('truckLicensePlateCountryId'), s('truckLicensePlateCountry'),
      s('jobMarket', 32),
      s('fineOffence', 32), s('ferrySourceName'), s('ferryTargetName'), s('ferrySourceId'),
      s('ferryTargetId'), s('trainSourceName'), s('trainTargetName'), s('trainSourceId'), s('trainTargetId'),
    ],
  },
  { name: 'z10.ull', start: 4000, end: 4200, fields: [{ name: 'jobIncome', type: 'u64' }] },
  {
    name: 'z11.ll',
    start: 4200,
    end: 4300,
    fields: [
      { name: 'jobCancelledPenalty', type: 'i64' }, { name: 'jobDeliveredRevenue', type: 'i64' },
      { name: 'fineAmount', type: 'i64' }, { name: 'tollgatePayAmount', type: 'i64' },
      { name: 'ferryPayAmount', type: 'i64' }, { name: 'trainPayAmount', type: 'i64' },
    ],
  },
  {
    name: 'z12.special',
    start: 4300,
    end: 4400,
    fields: [
      b('onJob'), b('jobFinished'), b('jobCancelled'), b('jobDelivered'), b('fined'),
      b('tollgate'), b('ferry'), b('train'), b('refuel'), b('refuelPayed'),
    ],
  },
  { name: 'z13.substances', start: 4400, end: 6000, fields: [s('substance', S, 25)] },
];

export const rev12Layout = compileLayout(rev12Zones);
export const rev12TrailerLayout = compileLayout(rev12TrailerZones);
/** Tamanho total do mapa (até o fim do 10º reboque). */
export const REV12_TOTAL_SIZE = REV12_TRAILER_BASE + REV12_TRAILER_SIZE * REV12_TRAILER_COUNT;
