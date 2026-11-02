/** Frame "vazio" (tudo N/D) enviado quando não há dados reais disponíveis. */
import type { ConnectionInfo, TelemetryFrame, TripSnapshot } from '../../../shared/types.js';

export function buildEmptyFrame(args: {
  seq: number;
  timestamp: number;
  connection: ConnectionInfo;
  trip: TripSnapshot;
  truckModelKey: string;
}): TelemetryFrame {
  return {
    source: 'live',
    seq: args.seq,
    timestamp: args.timestamp,
    connection: args.connection,
    game: { game: null, gameVersion: null, telemetryVersion: null, paused: null, gameTimeMin: null, timeScale: null, restStopMin: null, multiplayer: null },
    truck: {
      brandId: null, brand: null, id: null, name: null, licensePlate: null, licensePlateCountry: null,
      modelKey: args.truckModelKey, modelSource: args.truckModelKey === 'generic' ? 'fallback' : 'manual',
    },
    motion: { speedKmh: null, speedLimitKmh: null, overLimit: false, cruiseControlOn: null, cruiseControlKmh: null, odometerKm: null, accelerationZ: null },
    engine: {
      engineOn: null, electricOn: null, rpm: null, rpmMax: null, gear: null, gearDashboard: null, gearLabel: '—',
      forwardGears: null, reverseGears: null, shifterType: null, engineBrake: null, retarderStep: null,
      retarderStepCount: null, waterTempC: null, oilTempC: null, oilPressurePsi: null, batteryVoltage: null,
      airPressurePsi: null, brakeTempC: null, throttle: null, brake: null, clutch: null, parkingBrake: null,
      differentialLock: null,
      warnings: { oilPressure: null, waterTemp: null, batteryVoltage: null, airPressure: null, airPressureEmergency: null, fuel: null, adblue: null },
      thresholds: { oilPressurePsi: null, waterTempC: null, batteryVoltage: null, airPressurePsi: null },
    },
    fuel: {
      liters: null, capacityLiters: null, capacitySource: null, percent: null, avgConsumptionL100: null, rangeKm: null,
      reserve: null, warningFactor: null, adblueLiters: null, adblueCapacityLiters: null,
    },
    lights: {
      parking: null, lowBeam: null, highBeam: null, auxFront: null, auxRoof: null, blinkerLeftActive: null,
      blinkerRightActive: null, blinkerLeftOn: null, blinkerRightOn: null, hazard: null, brake: null, reverse: null,
      beacon: null, dashboardBacklight: null,
    },
    wipers: { on: null, stage: null },
    environment: { rain: null, rainIntensityPct: null, visibility: null, dayPhase: null, gameTimeLabel: null, weekday: null, roadSurfaces: [] },
    suspension: {
      truckWheels: [], trailerWheels: [], liftAxle: null, liftAxleIndicator: null, trailerLiftAxle: null,
      truckRearAvgDeflection: null, trailerAvgDeflection: null, truckRearOscillationMm: null, trailerOscillationMm: null,
    },
    wear: { engine: null, transmission: null, cabin: null, chassis: null, wheels: null, trailerChassis: null, trailerWheels: null, trailerBody: null, cargo: null },
    trailer: {
      attached: null, count: 0, id: null, name: null, brand: null, bodyType: null, chainType: null, cargoAccessoryId: null,
      licensePlate: null, cargoName: null, cargoMassKg: null, cargoLoaded: null, wheelCount: null, localDistanceKm: null, modelKey: 'box',
    },
    job: {
      onJob: null, cargo: null, sourceCity: null, sourceCompany: null, destinationCity: null, destinationCompany: null,
      income: null, plannedDistanceKm: null, routeDistanceKm: null, routeTimeS: null, market: null,
    },
    trip: args.trip,
    alerts: [],
  };
}
