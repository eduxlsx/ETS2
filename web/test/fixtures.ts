import { buildEmptyFrame } from '../../server/src/engine/emptyFrame';
import type { LightsData, TelemetryFrame } from '../../shared/types';

export function emptyFrame(): TelemetryFrame {
  return buildEmptyFrame({
    seq: 1,
    timestamp: Date.now(),
    connection: {
      state: 'connected',
      activity: 'driving',
      message: '',
      gameProcess: 'eurotrucks2.exe',
      pluginRevision: 12,
      supportedRevisions: [12],
      lastDataAt: Date.now(),
      reconnectAttempts: 0,
    },
    trip: {
      tripId: 1, startedAt: 0, distanceKm: 0, drivingTimeS: 0, elapsedS: 0, avgSpeedKmh: null, maxSpeedKmh: 0,
      fuelUsedL: 0, avgConsumptionL100: null, sessionDistanceKm: 0, sessionDrivingTimeS: 0, sessionStartedAt: null, persisted: true,
    },
    truckModelKey: 'scania-r',
  });
}

export function lightsAll(value: boolean): LightsData {
  return {
    parking: value, lowBeam: value, highBeam: value, auxFront: value ? 2 : 0, auxRoof: value ? 2 : 0,
    blinkerLeftActive: value, blinkerRightActive: value, blinkerLeftOn: value, blinkerRightOn: value,
    hazard: value, brake: value, reverse: value, beacon: value, dashboardBacklight: value ? 1 : 0,
  };
}
