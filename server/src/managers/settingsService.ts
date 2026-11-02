/** Configurações persistidas no SQLite, com validação/saneamento de entrada. */
import { EventEmitter } from 'node:events';
import { DEFAULT_SETTINGS, docsSettings, type DocsSettings, type Settings } from '../../../shared/types.js';
import type { Database } from '../db/database.js';
import { TRAILER_KEYS } from '../../../shared/vehicles.js';

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;
const clamp = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

export function sanitizeSettings(input: Partial<Settings> | null | undefined, base: Settings = DEFAULT_SETTINGS): Settings {
  const s = { ...base, ...(input ?? {}) } as Settings;
  const a = { ...base.alerts, ...(input?.alerts ?? {}) };
  return {
    speedUnit: pick(s.speedUnit, ['kmh', 'mph'], base.speedUnit),
    distanceUnit: pick(s.distanceUnit, ['km', 'mi'], base.distanceUnit),
    fuelUnit: pick(s.fuelUnit, ['l', 'gal'], base.fuelUnit),
    temperatureUnit: pick(s.temperatureUnit, ['c', 'f'], base.temperatureUnit),
    pressureUnit: pick(s.pressureUnit, ['bar', 'psi'], base.pressureUnit),
    theme: pick(s.theme, ['graphite', 'midnight', 'contrast'], base.theme),
    vehicleMode: pick(s.vehicleMode, ['auto', 'manual'], base.vehicleMode),
    manualVehicleModel: typeof s.manualVehicleModel === 'string' && s.manualVehicleModel.length < 64 ? s.manualVehicleModel : base.manualVehicleModel,
    trailerModel: pick<Settings['trailerModel']>(s.trailerModel, ['auto', ...TRAILER_KEYS], base.trailerModel),
    updateRateHz: Math.round(clamp(s.updateRateHz, 1, 60, base.updateRateHz)),
    configuredMaxSpeedKmh: clamp(s.configuredMaxSpeedKmh, 10, 300, base.configuredMaxSpeedKmh),
    speedLimitToleranceKmh: clamp(s.speedLimitToleranceKmh, 0, 30, base.speedLimitToleranceKmh),
    fuelCapacityOverrideL:
      s.fuelCapacityOverrideL === null ? null : typeof s.fuelCapacityOverrideL === 'number' && s.fuelCapacityOverrideL > 0
        ? clamp(s.fuelCapacityOverrideL, 10, 5000, 400)
        : base.fuelCapacityOverrideL,
    tripAutoResetOnJob: bool(s.tripAutoResetOnJob, base.tripAutoResetOnJob),
    alerts: {
      fuelPercent: clamp(a.fuelPercent, 0, 100, base.alerts.fuelPercent),
      waterTempC: clamp(a.waterTempC, 50, 200, base.alerts.waterTempC),
      oilTempC: clamp(a.oilTempC, 50, 200, base.alerts.oilTempC),
      wearPercent: clamp(a.wearPercent, 1, 100, base.alerts.wearPercent),
      overSpeed: bool(a.overSpeed, base.alerts.overSpeed),
    },
    suspensionExaggeration: clamp(s.suspensionExaggeration, 1, 30, base.suspensionExaggeration),
    setupCompleted: bool(s.setupCompleted, base.setupCompleted),
    autoStart: bool(s.autoStart, base.autoStart),
    docs: sanitizeDocs(input?.docs, docsSettings(base)),
  };
}

const str = (v: unknown, fallback: string, max = 60): string => {
  if (typeof v !== 'string') return fallback;
  const t = v.replace(/[\u0000-\u001f]/g, '').trim().slice(0, max);
  return t || fallback;
};

function sanitizeDocs(input: Partial<DocsSettings> | null | undefined, base: DocsSettings): DocsSettings {
  const d = { ...base, ...(input ?? {}) };
  return {
    driverName: str(d.driverName, base.driverName),
    carrierName: str(d.carrierName, base.carrierName),
    fxBrlPerEur: clamp(d.fxBrlPerEur, 0.01, 1000, base.fxBrlPerEur),
    dieselPriceBrl: clamp(d.dieselPriceBrl, 0.01, 100, base.dieselPriceBrl),
    damageStampPct: clamp(d.damageStampPct, 0, 100, base.damageStampPct),
    stampSound: bool(d.stampSound, base.stampSound),
    dispatcherVoice: bool(d.dispatcherVoice, base.dispatcherVoice),
    dispatcherToasts: bool(d.dispatcherToasts, base.dispatcherToasts),
    autoSign: bool(d.autoSign, base.autoSign),
    autoSignMinutes: clamp(d.autoSignMinutes, 1, 120, base.autoSignMinutes),
    checklistOnJob: bool(d.checklistOnJob, base.checklistOnJob),
  };
}

export class SettingsService extends EventEmitter {
  private current: Settings;

  constructor(private readonly db: Database) {
    super();
    const row = db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', 'app');
    let stored: Partial<Settings> | null = null;
    try {
      stored = row ? JSON.parse(row.value) : null;
    } catch {
      stored = null;
    }
    this.current = sanitizeSettings(stored);
  }

  get(): Settings {
    return this.current;
  }

  update(patch: Partial<Settings>): Settings {
    this.current = sanitizeSettings(patch, this.current);
    this.db.run('INSERT OR REPLACE INTO settings(key, value) VALUES (?, ?)', 'app', JSON.stringify(this.current));
    this.emit('change', this.current);
    return this.current;
  }
}
