/**
 * Data Parser: RawTelemetry (unidades do SDK) → partes do TelemetryFrame
 * (unidades do painel), com validação de cada canal. Nada aqui inventa valor:
 * se um canal está fora da faixa plausível ele vira null ("N/D").
 */
import type {
  EngineData,
  EnvironmentData,
  FuelData,
  GameInfo,
  JobData,
  LightsData,
  MotionData,
  AuxLightLevel,
  SuspensionData,
  WearData,
  WheelData,
  WiperData,
} from '../../../shared/types.js';
import type { RawTelemetry, RawWheel } from '../sdk/raw.js';
import { num, positive, ratio, round, text } from './validate.js';

const MS_TO_KMH = 3.6;
const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const SUBSTANCE_LABELS: Record<string, string> = {
  static: 'estático',
  road: 'asfalto',
  road_snow: 'asfalto com neve',
  dirt: 'terra',
  snow: 'neve',
  grass: 'grama',
  rough: 'irregular',
  gravel: 'cascalho',
  ice: 'gelo',
  invis: 'invisível',
  metal: 'metal',
  rubber: 'borracha',
  wood: 'madeira',
};

export function gearLabel(gearDashboard: number | null, reverseGears: number | null): string {
  if (gearDashboard === null) return '—';
  if (gearDashboard === 0) return 'N';
  if (gearDashboard < 0) return (reverseGears ?? 1) > 1 ? `R${Math.abs(gearDashboard)}` : 'R';
  return String(gearDashboard);
}

export function formatGameTime(minutes: number | null): { label: string | null; weekday: string | null; hour: number | null } {
  if (minutes === null) return { label: null, weekday: null, hour: null };
  const day = Math.floor(minutes / 1440);
  const minOfDay = minutes % 1440;
  const hour = Math.floor(minOfDay / 60);
  const min = minOfDay % 60;
  return {
    label: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
    weekday: WEEKDAYS[day % 7],
    hour,
  };
}

export function dayPhase(hour: number | null): EnvironmentData['dayPhase'] {
  if (hour === null) return null;
  if (hour < 6) return 'madrugada';
  if (hour < 12) return 'manhã';
  if (hour < 18) return 'tarde';
  return 'noite';
}

function aux(v: number): AuxLightLevel | null {
  return v === 0 || v === 1 || v === 2 ? (v as AuxLightLevel) : null;
}

function substanceName(index: number, table: string[]): string | null {
  const raw = text(table[index] ?? null, 64);
  if (!raw) return null;
  return SUBSTANCE_LABELS[raw] ?? raw;
}

export function mapWheels(wheels: RawWheel[], substances: string[]): WheelData[] {
  return wheels.map((w, index) => {
    const x = num(w.positionX, -20, 20);
    const y = num(w.positionY, -10, 10);
    const z = num(w.positionZ, -30, 30);
    return {
      index,
      position: x !== null && y !== null && z !== null ? { x, y, z } : null,
      radius: num(w.radius, 0.05, 3),
      suspDeflection: num(w.suspDeflection, -2, 2),
      onGround: w.onGround,
      lift: ratio(w.lift),
      liftable: w.liftable,
      powered: w.powered,
      steerable: w.steerable,
      substance: w.onGround ? substanceName(w.substance, substances) : null,
    };
  });
}

/** Rodas traseiras = as que estão atrás do ponto médio entre o primeiro e o último eixo (SCS: +Z = para trás). */
export function rearWheels(wheels: WheelData[]): WheelData[] {
  const zs = wheels.map((w) => w.position?.z).filter((z): z is number => z !== undefined);
  if (zs.length < 2) return [];
  const mid = (Math.min(...zs) + Math.max(...zs)) / 2;
  return wheels.filter((w) => w.position && w.position.z > mid);
}

export function avgDeflection(wheels: WheelData[]): number | null {
  const vals = wheels
    .filter((w) => w.onGround !== false && (w.lift ?? 0) < 0.5)
    .map((w) => w.suspDeflection)
    .filter((v): v is number => v !== null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Desvio padrão móvel (janela fixa) para medir oscilação da suspensão. */
export class OscillationTracker {
  private samples: number[] = [];
  constructor(private readonly window = 40) {}

  push(v: number | null): number | null {
    if (v === null) {
      this.samples = [];
      return null;
    }
    this.samples.push(v);
    if (this.samples.length > this.window) this.samples.shift();
    if (this.samples.length < 5) return null;
    const mean = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    const variance = this.samples.reduce((a, b) => a + (b - mean) ** 2, 0) / this.samples.length;
    return Math.sqrt(variance) * 1000;
  }

  reset() {
    this.samples = [];
  }
}

export interface ParsedParts {
  game: GameInfo;
  motion: MotionData;
  engine: EngineData;
  fuel: FuelData;
  lights: LightsData;
  wipers: WiperData;
  environment: EnvironmentData;
  suspension: SuspensionData;
  wear: WearData;
  job: JobData;
}

export interface ParserContext {
  fuelCapacityOverrideL: number | null;
  speedToleranceKmh: number;
  truckOsc: OscillationTracker;
  trailerOsc: OscillationTracker;
}

export function createParserContext(): ParserContext {
  return {
    fuelCapacityOverrideL: null,
    speedToleranceKmh: 3,
    truckOsc: new OscillationTracker(),
    trailerOsc: new OscillationTracker(),
  };
}

export function parseRaw(raw: RawTelemetry, ctx: ParserContext): ParsedParts {
  const gameId = raw.game === 1 ? 'ets2' : raw.game === 2 ? 'ats' : 'unknown';
  const gameMinutes = num(raw.timeAbs, 0, 1e9);
  const gt = formatGameTime(gameMinutes);

  // ── Movimento ──────────────────────────────────────────────
  const speedKmhRaw = num(raw.speed, -100, 150);
  const speedKmh = speedKmhRaw === null ? null : Math.abs(speedKmhRaw * MS_TO_KMH);
  const limit = positive(raw.speedLimit, 100);
  const speedLimitKmh = limit === null ? null : Math.round(limit * MS_TO_KMH);
  const overLimit = speedKmh !== null && speedLimitKmh !== null && speedKmh > speedLimitKmh + ctx.speedToleranceKmh;

  // ── Combustível ───────────────────────────────────────────
  const sdkCapacity = positive(raw.fuelCapacity, 5000);
  const capacity = ctx.fuelCapacityOverrideL ?? sdkCapacity;
  const fuelL = num(raw.fuel, 0, 5000);
  const avgLkm = positive(raw.fuelAvgConsumption, 5);

  // ── Motor ─────────────────────────────────────────────────
  const rpmMax = positive(raw.engineRpmMax, 10000);
  const gearsFwd = num(raw.gears, 0, 64);
  const gearsRev = num(raw.gearsReverse, 0, 32);
  const gearDash = num(raw.gearDashboard, -32, 64);
  const retarderSteps = num(raw.retarderStepCount, 0, 32);

  // ── Suspensão ─────────────────────────────────────────────
  const truckWheels = mapWheels(raw.wheels, raw.substances);
  const trailer0 = raw.trailers[0];
  const trailerWheels = trailer0 && trailer0.attached ? mapWheels(trailer0.wheels, raw.substances) : [];
  const rearAvg = avgDeflection(rearWheels(truckWheels));
  const trailerAvg = avgDeflection(trailerWheels);

  const roadSurfaces = Array.from(
    new Set(truckWheels.map((w) => w.substance).filter((s): s is string => !!s)),
  );

  return {
    game: {
      game: gameId,
      gameVersion: raw.versionMajor || raw.versionMinor ? `${raw.versionMajor}.${raw.versionMinor}` : null,
      telemetryVersion:
        raw.telemetryVersionMajor || raw.telemetryVersionMinor
          ? `${raw.telemetryVersionMajor}.${raw.telemetryVersionMinor}`
          : null,
      paused: raw.paused,
      gameTimeMin: gameMinutes,
      timeScale: positive(raw.scale, 1000),
      restStopMin: num(raw.restStop, -100000, 100000),
      multiplayer: raw.multiplayerTimeOffset !== 0n,
    },
    motion: {
      speedKmh: round(speedKmh, 2),
      speedLimitKmh,
      overLimit,
      cruiseControlOn: raw.cruiseControl,
      cruiseControlKmh: raw.cruiseControl ? round((num(raw.cruiseControlSpeed, 0, 100) ?? 0) * MS_TO_KMH, 0) : null,
      odometerKm: num(raw.odometer, 0, 1e8),
      accelerationZ: num(raw.accelerationZ, -100, 100),
    },
    engine: {
      engineOn: raw.engineEnabled,
      electricOn: raw.electricEnabled,
      rpm: num(raw.engineRpm, 0, (rpmMax ?? 4000) * 2),
      rpmMax,
      gear: num(raw.gear, -32, 64),
      gearDashboard: gearDash,
      gearLabel: gearLabel(gearDash, gearsRev),
      forwardGears: gearsFwd,
      reverseGears: gearsRev,
      shifterType: text(raw.shifterType, 16),
      engineBrake: raw.motorBrake,
      retarderStep: num(raw.retarderBrake, 0, 32),
      retarderStepCount: retarderSteps,
      waterTempC: num(raw.waterTemperature, -60, 250),
      oilTempC: num(raw.oilTemperature, -60, 250),
      oilPressurePsi: num(raw.oilPressure, 0, 300),
      batteryVoltage: num(raw.batteryVoltage, 0, 60),
      airPressurePsi: num(raw.airPressure, 0, 300),
      brakeTempC: num(raw.brakeTemperature, -60, 1500),
      throttle: ratio(raw.throttle),
      brake: ratio(raw.brake),
      clutch: ratio(raw.clutch),
      parkingBrake: raw.parkBrake,
      differentialLock: raw.differentialLock,
      warnings: {
        oilPressure: raw.oilPressureWarningOn,
        waterTemp: raw.waterTemperatureWarningOn,
        batteryVoltage: raw.batteryVoltageWarningOn,
        airPressure: raw.airPressureWarningOn,
        airPressureEmergency: raw.airPressureEmergencyOn,
        fuel: raw.fuelWarning,
        adblue: raw.adblueWarning,
      },
      thresholds: {
        oilPressurePsi: positive(raw.oilPressureWarning, 300),
        waterTempC: positive(raw.waterTemperatureWarning, 250),
        batteryVoltage: positive(raw.batteryVoltageWarning, 60),
        airPressurePsi: positive(raw.airPressureWarning, 300),
      },
    },
    fuel: {
      liters: round(fuelL, 2),
      capacityLiters: capacity,
      capacitySource: ctx.fuelCapacityOverrideL !== null ? 'manual' : sdkCapacity !== null ? 'sdk' : null,
      percent: fuelL !== null && capacity ? round(Math.min(100, (fuelL / capacity) * 100), 1) : null,
      avgConsumptionL100: avgLkm === null ? null : round(avgLkm * 100, 1),
      rangeKm: num(raw.fuelRange, 0, 100000),
      reserve: raw.fuelWarning,
      warningFactor: ratio(raw.fuelWarningFactor),
      adblueLiters: num(raw.adblue, 0, 1000),
      adblueCapacityLiters: positive(raw.adblueCapacity, 1000),
    },
    lights: {
      parking: raw.lightsParking,
      lowBeam: raw.lightsBeamLow,
      highBeam: raw.lightsBeamHigh,
      auxFront: aux(raw.lightsAuxFront),
      auxRoof: aux(raw.lightsAuxRoof),
      blinkerLeftActive: raw.blinkerLeftActive,
      blinkerRightActive: raw.blinkerRightActive,
      blinkerLeftOn: raw.blinkerLeftOn,
      blinkerRightOn: raw.blinkerRightOn,
      hazard: raw.lightsHazard,
      brake: raw.lightsBrake,
      reverse: raw.lightsReverse,
      beacon: raw.lightsBeacon,
      dashboardBacklight: ratio(raw.lightsDashboard),
    },
    wipers: { on: raw.wipers, stage: null },
    environment: {
      rain: null,
      rainIntensityPct: null,
      visibility: null,
      dayPhase: dayPhase(gt.hour),
      gameTimeLabel: gt.label,
      weekday: gt.weekday,
      roadSurfaces,
    },
    suspension: {
      truckWheels,
      trailerWheels,
      liftAxle: raw.liftAxle,
      liftAxleIndicator: raw.liftAxleIndicator,
      trailerLiftAxle: raw.trailerLiftAxle,
      truckRearAvgDeflection: rearAvg,
      trailerAvgDeflection: trailerAvg,
      truckRearOscillationMm: round(ctx.truckOsc.push(raw.paused ? null : rearAvg), 1),
      trailerOscillationMm: round(ctx.trailerOsc.push(raw.paused ? null : trailerAvg), 1),
    },
    wear: {
      engine: ratio(raw.wearEngine),
      transmission: ratio(raw.wearTransmission),
      cabin: ratio(raw.wearCabin),
      chassis: ratio(raw.wearChassis),
      wheels: ratio(raw.wearWheels),
      trailerChassis: trailer0?.id ? ratio(trailer0.wearChassis) : null,
      trailerWheels: trailer0?.id ? ratio(trailer0.wearWheels) : null,
      trailerBody: trailer0?.id ? ratio(trailer0.wearBody) : null,
      cargo: raw.onJob ? ratio(raw.cargoDamage) : null,
    },
    job: {
      onJob: raw.onJob,
      cargo: text(raw.cargo),
      sourceCity: text(raw.citySrc),
      sourceCompany: text(raw.compSrc),
      destinationCity: text(raw.cityDst),
      destinationCompany: text(raw.compDst),
      income: raw.onJob ? num(raw.jobIncome, 0, 1e9) : null,
      plannedDistanceKm: raw.onJob ? positive(raw.plannedDistanceKm, 1e6) : null,
      routeDistanceKm: positive(raw.routeDistance, 1e8) === null ? null : round(raw.routeDistance / 1000, 1),
      routeTimeS: positive(raw.routeTime, 1e8),
      market: text(raw.jobMarket, 32),
      cargoId: raw.onJob ? text(raw.cargoId, 64) : null,
      unitCount: raw.onJob ? num(raw.unitCount, 0, 100000) : null,
      deadlineGameMin: raw.onJob && raw.timeAbsDelivery > 0 ? num(raw.timeAbsDelivery, 0, 1e9) : null,
      startedGameMin: raw.onJob && raw.jobStartingTime > 0 ? num(raw.jobStartingTime, 0, 1e9) : null,
    },
  };
}
