/**
 * Vehicle Manager — identifica o modelo 2D do caminhão (automático ou manual)
 * e registra no histórico os caminhões utilizados e a distância de cada um.
 */
import type { Settings, TruckIdentity } from '../../../shared/types.js';
import { resolveVehicleModel, VEHICLE_MODELS } from '../../../shared/vehicles.js';
import type { Database } from '../db/database.js';
import { text } from '../parser/validate.js';
import type { RawTelemetry } from '../sdk/raw.js';

export class VehicleManager {
  private pendingKm = 0;
  private currentKey: string | null = null;
  private lastFlush = 0;

  constructor(private readonly db: Database | null) {}

  identify(raw: Pick<RawTelemetry, 'truckBrandId' | 'truckBrand' | 'truckId' | 'truckName' | 'truckLicensePlate' | 'truckLicensePlateCountry'>, settings: Settings): TruckIdentity {
    const brandId = text(raw.truckBrandId);
    const id = text(raw.truckId);
    const name = text(raw.truckName);
    const auto = resolveVehicleModel(brandId, id, name);
    const manualValid = VEHICLE_MODELS.some((m) => m.key === settings.manualVehicleModel);
    const useManual = settings.vehicleMode === 'manual' && manualValid;
    return {
      brandId,
      brand: text(raw.truckBrand),
      id,
      name,
      licensePlate: text(raw.truckLicensePlate),
      licensePlateCountry: text(raw.truckLicensePlateCountry),
      modelKey: useManual ? settings.manualVehicleModel : auto.key,
      modelSource: useManual ? 'manual' : auto.exact ? 'auto' : 'fallback',
    };
  }

  /** Registra o caminhão em uso e acumula a distância percorrida com ele. */
  track(truck: TruckIdentity, deltaKm: number, now = Date.now()): void {
    if (!this.db || !truck.id) return;
    const key = `${truck.brandId ?? ''}/${truck.id}`;
    if (key !== this.currentKey) {
      this.flush(now);
      this.currentKey = key;
      this.db.run(
        `INSERT INTO trucks(truck_key, brand, name, model_key, license_plate, first_seen, last_seen)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(truck_key) DO UPDATE SET last_seen = excluded.last_seen, model_key = excluded.model_key,
           license_plate = COALESCE(excluded.license_plate, trucks.license_plate)`,
        key, truck.brand, truck.name, truck.modelKey, truck.licensePlate, now, now,
      );
    }
    this.pendingKm += deltaKm;
    if (now - this.lastFlush > 10000) this.flush(now);
  }

  flush(now = Date.now()): void {
    this.lastFlush = now;
    if (!this.db || !this.currentKey) return;
    this.db.run(
      'UPDATE trucks SET distance_km = distance_km + ?, last_seen = ? WHERE truck_key = ?',
      this.pendingKm, now, this.currentKey,
    );
    this.pendingKm = 0;
  }
}
