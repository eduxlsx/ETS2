/**
 * Eventos de gameplay do SDK (DOCUMENTOS-SPEC §2.1).
 *
 * Os canais `jobDelivered`, `fined`, `tollgate`… ficam `true` só por um
 * instante (às vezes por vários ticks seguidos, e o plugin pode repetir o
 * evento ao pausar/despausar). Aqui detectamos a BORDA DE SUBIDA, tiramos um
 * snapshot dos valores do mesmo tick e deduplicamos por (tipo, time_abs, payload).
 */
import type { RawTelemetry } from '../sdk/raw.js';

export type GameplayEventKind = 'job-start' | 'delivered' | 'cancelled' | 'finished' | 'fined' | 'toll' | 'ferry' | 'train' | 'refuel';

export interface JobSnapshot {
  cargoId: string;
  cargo: string;
  massKg: number;
  units: number;
  citySrc: string;
  compSrc: string;
  cityDst: string;
  compDst: string;
  citySrcId: string;
  compSrcId: string;
  cityDstId: string;
  compDstId: string;
  incomeEur: number;
  plannedKm: number;
  deadlineGameMin: number | null;
  startedGameMin: number;
  market: string;
  truckPlate: string;
  truckPlateCountry: string;
  trailerPlate: string;
  trailerPlateCountry: string;
  truckBrand: string;
  truckName: string;
  trailerName: string;
  trailerBodyType: string;
  axles: number;
  odometerKm: number;
}

export interface GameplayEvent {
  kind: GameplayEventKind;
  /** time_abs (minutos do jogo) do tick em que o evento subiu. */
  gameTime: number;
  payload: Record<string, any>;
  job: JobSnapshot | null;
}

/** Conta eixos do conjunto (cavalo + reboques) pelas posições z das rodas. */
export function countAxles(raw: RawTelemetry): number {
  const axles = (zs: number[]) => new Set(zs.map((z) => Math.round(z * 10) / 10)).size;
  let n = axles(raw.wheels.map((w) => w.positionZ));
  for (const t of raw.trailers) if (t.attached) n += axles(t.wheels.map((w) => w.positionZ));
  return n;
}

export function snapshotJob(raw: RawTelemetry): JobSnapshot {
  const tr = raw.trailers.find((t) => t.attached);
  return {
    cargoId: raw.cargoId,
    cargo: raw.cargo,
    massKg: raw.cargoMass,
    units: raw.unitCount,
    citySrc: raw.citySrc,
    compSrc: raw.compSrc,
    cityDst: raw.cityDst,
    compDst: raw.compDst,
    citySrcId: raw.citySrcId,
    compSrcId: raw.compSrcId,
    cityDstId: raw.cityDstId,
    compDstId: raw.compDstId,
    incomeEur: raw.jobIncome,
    plannedKm: raw.plannedDistanceKm,
    deadlineGameMin: raw.timeAbsDelivery > 0 ? raw.timeAbsDelivery : null,
    startedGameMin: raw.jobStartingTime > 0 ? raw.jobStartingTime : raw.timeAbs,
    market: raw.jobMarket,
    truckPlate: raw.truckLicensePlate,
    truckPlateCountry: raw.truckLicensePlateCountry,
    trailerPlate: tr?.licensePlate ?? '',
    trailerPlateCountry: tr?.licensePlateCountry ?? '',
    truckBrand: raw.truckBrand,
    truckName: raw.truckName,
    trailerName: tr?.name ?? '',
    trailerBodyType: tr?.bodyType ?? '',
    axles: countAxles(raw),
    odometerKm: raw.odometer,
  };
}

type Flags = Record<'onJob' | 'jobDelivered' | 'jobCancelled' | 'jobFinished' | 'fined' | 'tollgate' | 'ferry' | 'train' | 'refuelPayed' | 'refuel', boolean>;

export class GameplayEventDetector {
  private prev: Flags | null = null;
  private prevJobStart = 0;
  private recent: string[] = [];

  reset(): void {
    this.prev = null;
    this.prevJobStart = 0;
    this.recent = [];
  }

  /** Processa um frame bruto e devolve os eventos que subiram neste tick. */
  feed(raw: RawTelemetry): GameplayEvent[] {
    const cur: Flags = {
      onJob: raw.onJob,
      jobDelivered: raw.jobDelivered,
      jobCancelled: raw.jobCancelled,
      jobFinished: raw.jobFinished,
      fined: raw.fined,
      tollgate: raw.tollgate,
      ferry: raw.ferry,
      train: raw.train,
      refuelPayed: raw.refuelPayed,
      refuel: raw.refuel,
    };
    const prev = this.prev;
    this.prev = cur;
    const out: GameplayEvent[] = [];
    if (!prev) {
      // primeiro frame: um frete já em andamento conta como início (documentos ainda não emitidos)
      if (cur.onJob) out.push(this.make('job-start', raw, {}));
      this.prevJobStart = raw.jobStartingTime;
      return this.dedupe(out);
    }
    const rose = (k: keyof Flags) => cur[k] && !prev[k];
    const jobChanged = cur.onJob && prev.onJob && raw.jobStartingTime > 0 && this.prevJobStart > 0 && raw.jobStartingTime !== this.prevJobStart;
    if (rose('onJob') || jobChanged) out.push(this.make('job-start', raw, {}));
    this.prevJobStart = raw.jobStartingTime;
    if (rose('jobDelivered')) {
      out.push(
        this.make('delivered', raw, {
          revenueEur: raw.jobDeliveredRevenue,
          cargoDamage: raw.jobDeliveredCargoDamage,
          distanceKm: raw.jobDeliveredDistanceKm,
          deliveryTimeMin: raw.jobDeliveredDeliveryTime,
          earnedXp: raw.jobDeliveredEarnedXp,
          autopark: raw.jobDeliveredAutoparkUsed,
          autoload: raw.jobDeliveredAutoloadUsed,
        }),
      );
    }
    if (rose('jobCancelled')) out.push(this.make('cancelled', raw, { penaltyEur: raw.jobCancelledPenalty }));
    if (rose('jobFinished')) out.push(this.make('finished', raw, {}));
    if (rose('fined')) out.push(this.make('fined', raw, { offence: raw.fineOffence || 'generic', amountEur: raw.fineAmount, speedKmh: raw.speed * 3.6, limitKmh: raw.speedLimit * 3.6 }));
    if (rose('tollgate')) out.push(this.make('toll', raw, { amountEur: raw.tollgatePayAmount }));
    if (rose('ferry')) out.push(this.make('ferry', raw, { from: raw.ferrySourceName, to: raw.ferryTargetName, amountEur: raw.ferryPayAmount }));
    if (rose('train')) out.push(this.make('train', raw, { from: raw.trainSourceName, to: raw.trainTargetName, amountEur: raw.trainPayAmount }));
    // abastecimento: paga na subida de refuelPayed (ou no fim de refuel, se o plugin não sinalizar o pagamento)
    if (rose('refuelPayed') || (prev.refuel && !cur.refuel && !cur.refuelPayed && !prev.refuelPayed && raw.refuelAmount > 0)) {
      out.push(this.make('refuel', raw, { liters: raw.refuelAmount, odometerKm: raw.odometer }));
    }
    return this.dedupe(out);
  }

  private make(kind: GameplayEventKind, raw: RawTelemetry, payload: Record<string, any>): GameplayEvent {
    return { kind, gameTime: raw.timeAbs, payload, job: raw.onJob || kind === 'delivered' || kind === 'cancelled' ? snapshotJob(raw) : null };
  }

  private dedupe(events: GameplayEvent[]): GameplayEvent[] {
    return events.filter((e) => {
      const key = `${e.kind}|${e.gameTime}|${JSON.stringify(e.payload)}`;
      if (this.recent.includes(key)) return false;
      this.recent.push(key);
      if (this.recent.length > 64) this.recent.shift();
      return true;
    });
  }
}
