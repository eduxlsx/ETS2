/**
 * Trip Manager — Trip (zerável pelo usuário) e Sessão (cada conexão com o jogo).
 *
 * A distância vem preferencialmente do DELTA do odômetro real do jogo (soma
 * telescópica: não acumula erro). O Trip é independente: zerá-lo nunca mexe no
 * odômetro do jogo. Saltos implausíveis (troca de caminhão, teleporte, lixo de
 * leitura) são descartados e a linha de base é reiniciada.
 *
 * Com db = null (modo DEMO) nada é persistido — dados simulados nunca se
 * misturam ao histórico real.
 */
import type { TripSnapshot } from '../../../shared/types.js';
import type { Database } from '../db/database.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('trip');

export interface TripInput {
  timestamp: number;
  paused: boolean;
  speedKmh: number | null;
  odometerKm: number | null;
  fuelL: number | null;
  rpm?: number | null;
  consumptionL100?: number | null;
  /** Escala do mapa do jogo (game.scale): o odômetro avança ~scale× mais rápido que a velocidade real. */
  scale?: number | null;
  truckKey?: string | null;
  truckName?: string | null;
  gameVersion?: string | null;
}

interface Counters {
  /** Distância em km do jogo (delta do odômetro — mesma escala do painel do caminhão e das entregas). */
  distanceKm: number;
  /** Integral da velocidade real (km). Usada para a velocidade média. */
  speedDistanceKm: number;
  drivingS: number;
  fuelUsedL: number;
  maxSpeedKmh: number;
}

const zero = (): Counters => ({ distanceKm: 0, speedDistanceKm: 0, drivingS: 0, fuelUsedL: 0, maxSpeedKmh: 0 });

/** Velocidade real máxima plausível para aceitar um delta de odômetro (multiplicada pela escala do mapa). */
const MAX_PLAUSIBLE_KMH = 300;
const MAX_SCALE = 40;
const MAX_TICK_S = 1;
const MAX_FUEL_DROP_L = 5;

export class TripManager {
  private trip: Counters = zero();
  private tripId: number | null = null;
  private tripStartedAt = Date.now();

  private session: Counters = zero();
  private sessionId: number | null = null;
  private sessionStartedAt: number | null = null;
  private sessionStartOdo: number | null = null;

  private lastTs: number | null = null;
  private lastOdo: number | null = null;
  private lastFuel: number | null = null;
  private lastPersist = 0;
  private lastSample = 0;
  private lastInput: TripInput | null = null;

  constructor(
    private readonly db: Database | null,
    private readonly opts = { persistEveryMs: 5000, sampleEveryMs: 10000 },
  ) {
    if (db) this.loadCurrentTrip();
  }

  private loadCurrentTrip() {
    const row = this.db!.get<any>('SELECT * FROM trips WHERE is_current = 1 ORDER BY id DESC LIMIT 1');
    if (row) {
      this.tripId = Number(row.id);
      this.tripStartedAt = Number(row.started_at);
      this.trip = {
        distanceKm: Number(row.distance_km),
        speedDistanceKm: Number(row.speed_distance_km ?? 0),
        drivingS: Number(row.driving_s),
        fuelUsedL: Number(row.fuel_used_l),
        maxSpeedKmh: Number(row.max_speed_kmh),
      };
      log.info(`Trip #${this.tripId} restaurado (${this.trip.distanceKm.toFixed(1)} km)`);
    } else {
      this.tripStartedAt = Date.now();
      this.tripId = this.db!.run('INSERT INTO trips(started_at, is_current) VALUES (?, 1)', this.tripStartedAt).lastInsertRowid;
    }
  }

  get isPersistent(): boolean {
    return this.db !== null;
  }

  startSession(meta: { truckKey?: string | null; truckName?: string | null; gameVersion?: string | null } = {}): void {
    if (this.sessionStartedAt !== null) return;
    this.session = zero();
    this.sessionStartedAt = Date.now();
    this.sessionStartOdo = null;
    this.resetBaselines();
    if (this.db) {
      this.sessionId = this.db.run(
        'INSERT INTO sessions(started_at, truck_key, truck_name, game_version) VALUES (?, ?, ?, ?)',
        this.sessionStartedAt,
        meta.truckKey ?? null,
        meta.truckName ?? null,
        meta.gameVersion ?? null,
      ).lastInsertRowid;
    }
    log.info('Sessão iniciada');
  }

  endSession(): void {
    if (this.sessionStartedAt === null) return;
    this.persist(true);
    if (this.db && this.sessionId !== null) {
      this.db.run('UPDATE sessions SET ended_at = ? WHERE id = ?', Date.now(), this.sessionId);
      // sessões sem movimento não interessam ao histórico
      this.db.run('DELETE FROM sessions WHERE id = ? AND distance_km < 0.01 AND driving_s < 1', this.sessionId);
    }
    this.sessionStartedAt = null;
    this.sessionId = null;
    this.resetBaselines();
    log.info('Sessão encerrada');
  }

  private resetBaselines() {
    this.lastTs = null;
    this.lastOdo = null;
    this.lastFuel = null;
  }

  /** Processa um frame. Retorna a distância (km) acrescentada neste tick. */
  update(input: TripInput): number {
    this.lastInput = input;
    const prevTs = this.lastTs;
    this.lastTs = input.timestamp;
    if (prevTs === null) {
      this.lastOdo = input.odometerKm;
      this.lastFuel = input.fuelL;
      if (this.sessionStartOdo === null) this.sessionStartOdo = input.odometerKm;
      return 0;
    }
    const realDt = Math.max(0, (input.timestamp - prevTs) / 1000);
    const dt = Math.min(realDt, MAX_TICK_S);

    let deltaKm = 0;
    if (!input.paused) {
      if (input.odometerKm !== null && this.lastOdo !== null) {
        const d = input.odometerKm - this.lastOdo;
        const scale = Math.min(MAX_SCALE, Math.max(1, input.scale ?? 19));
        const maxD = (realDt * MAX_PLAUSIBLE_KMH * scale) / 3600 + 0.02;
        if (d >= 0 && d <= maxD) {
          deltaKm = d;
          this.lastOdo = input.odometerKm;
        } else if (d !== 0) {
          log.warn(`Salto de odômetro descartado (${d.toFixed(3)} km em ${realDt.toFixed(2)} s)`);
          this.lastOdo = input.odometerKm;
        }
      } else if (input.odometerKm === null && input.speedKmh !== null) {
        deltaKm = (input.speedKmh * dt) / 3600;
      } else {
        this.lastOdo = input.odometerKm;
      }

      // contadores da sessão só andam com uma sessão aberta
      const targets = this.sessionStartedAt !== null ? [this.trip, this.session] : [this.trip];
      for (const c of targets) {
        if (input.speedKmh !== null && input.speedKmh > 1) {
          c.drivingS += dt;
          c.speedDistanceKm += (input.speedKmh * dt) / 3600;
        }
        if (input.speedKmh !== null) c.maxSpeedKmh = Math.max(c.maxSpeedKmh, input.speedKmh);
        c.distanceKm += deltaKm;
      }
      if (input.fuelL !== null && this.lastFuel !== null) {
        const drop = this.lastFuel - input.fuelL;
        if (drop > 0 && drop < MAX_FUEL_DROP_L) for (const c of targets) c.fuelUsedL += drop;
      }
    }
    // reabastecimento (aumento) ou pausa: só move a linha de base
    this.lastFuel = input.fuelL;

    const now = input.timestamp;
    if (now - this.lastPersist >= this.opts.persistEveryMs) this.persist();
    if (this.db && now - this.lastSample >= this.opts.sampleEveryMs && !input.paused) {
      this.lastSample = now;
      this.db.run(
        'INSERT INTO samples(ts, trip_id, session_id, speed_kmh, fuel_l, odometer_km, consumption_l100, rpm) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        now,
        this.tripId,
        this.sessionId,
        input.speedKmh,
        input.fuelL,
        input.odometerKm,
        input.consumptionL100 ?? null,
        input.rpm ?? null,
      );
    }
    return deltaKm;
  }

  persist(force = false): void {
    this.lastPersist = this.lastTs ?? Date.now();
    if (!this.db) return;
    try {
      const t = this.trip;
      const truckKey = this.lastInput?.truckKey ?? null;
      const truckName = this.lastInput?.truckName ?? null;
      this.db.run(
        'UPDATE trips SET distance_km = ?, speed_distance_km = ?, driving_s = ?, fuel_used_l = ?, max_speed_kmh = ?, truck_key = COALESCE(?, truck_key), truck_name = COALESCE(?, truck_name) WHERE id = ?',
        t.distanceKm, t.speedDistanceKm, t.drivingS, t.fuelUsedL, t.maxSpeedKmh, truckKey, truckName, this.tripId,
      );
      if (this.sessionId !== null) {
        const s = this.session;
        this.db.run(
          'UPDATE sessions SET distance_km = ?, speed_distance_km = ?, driving_s = ?, fuel_used_l = ?, max_speed_kmh = ?, start_odometer_km = ?, end_odometer_km = ?, truck_key = COALESCE(?, truck_key), truck_name = COALESCE(?, truck_name) WHERE id = ?',
          s.distanceKm, s.speedDistanceKm, s.drivingS, s.fuelUsedL, s.maxSpeedKmh, this.sessionStartOdo, this.lastOdo, truckKey, truckName, this.sessionId,
        );
      }
      if (force) log.debug('Trip/sessão persistidos');
    } catch (err) {
      log.error('Falha ao persistir trip', err);
    }
  }

  /** Zera o Trip (o odômetro real do jogo não é afetado). */
  reset(): TripSnapshot {
    const now = Date.now();
    if (this.db) {
      this.persist(true);
      this.db.run('UPDATE trips SET is_current = 0, ended_at = ? WHERE id = ?', now, this.tripId);
      this.db.run('DELETE FROM trips WHERE id = ? AND distance_km < 0.01 AND driving_s < 1', this.tripId);
      this.tripId = this.db.run('INSERT INTO trips(started_at, is_current) VALUES (?, 1)', now).lastInsertRowid;
    }
    this.trip = zero();
    this.tripStartedAt = now;
    log.info('Trip zerado pelo usuário');
    return this.snapshot();
  }

  snapshot(now = Date.now()): TripSnapshot {
    const t = this.trip;
    const s = this.session;
    return {
      tripId: this.tripId,
      startedAt: this.tripStartedAt,
      distanceKm: t.distanceKm,
      drivingTimeS: t.drivingS,
      elapsedS: Math.max(0, (now - this.tripStartedAt) / 1000),
      // média da velocidade real (não km do jogo ÷ tempo: o odômetro está na escala do mapa)
      avgSpeedKmh: t.drivingS > 5 ? t.speedDistanceKm / (t.drivingS / 3600) : null,
      maxSpeedKmh: t.maxSpeedKmh,
      fuelUsedL: t.fuelUsedL,
      avgConsumptionL100: t.distanceKm > 0.5 ? (t.fuelUsedL / t.distanceKm) * 100 : null,
      sessionDistanceKm: s.distanceKm,
      sessionDrivingTimeS: s.drivingS,
      sessionStartedAt: this.sessionStartedAt,
      persisted: this.db !== null,
    };
  }
}
