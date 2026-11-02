/**
 * Jornada do motorista / diário de bordo / tacógrafo (DOCUMENTOS-SPEC §6.1).
 *
 * Integra o estado a cada tick pelo relógio do jogo (time_abs):
 *   direção  — velocidade > 2 km/h e motor ligado
 *   trabalho — parado, motor ligado e frete ativo (carga/descarga)
 *   parado   — parado, motor ligado, sem frete
 *   descanso — motor desligado ou freio de estacionamento (conta como pausa a partir de 15 min)
 * Regras SIMULADAS (Lei 13.103/2015): 5h30 de direção contínua → 30 min de pausa;
 * 8 h de direção por dia + até 2 h extras; 11 h de interjornada.
 * O `restStop` real do jogo é mostrado lado a lado (são relógios diferentes).
 */
import { EventEmitter } from 'node:events';
import type { DataSource, DutySegment, DutyState, DutySummary } from '../../../shared/types.js';
import { gameDay } from '../../../shared/docs/build.js';
import type { RawTelemetry } from '../sdk/raw.js';
import type { DocStore } from './docStore.js';

export const DUTY_LIMITS = { continuousMin: 330, breakMin: 30, dailyMin: 480, dailyExtraMin: 120, interjornadaMin: 660 };
const HYSTERESIS_MIN = 2;
const REST_COUNTS_AFTER = 15;

export interface SpeedSample {
  gameMin: number;
  kmh: number;
}

export class DutyManager extends EventEmitter {
  private state: DutyState | null = null;
  private candidate: { state: DutyState; since: number } | null = null;
  private seg: DutySegment | null = null;
  private lastMin: number | null = null;
  private lastOdo: number | null = null;
  private contDriving = 0;
  private nonDrivingStreak = 0;
  private restStreak = 0;
  private lastLongRest = 0;
  private dailyDriving = new Map<number, number>();
  private samples = new Map<number, SpeedSample[]>();
  private lastSummaryMin = -1;
  private warned = { five: false, over: false };
  private last: DutySummary | null = null;

  constructor(private store: DocStore, private source: DataSource) {
    super();
  }

  get summary(): DutySummary | null {
    return this.last;
  }

  classify(raw: RawTelemetry): DutyState {
    const kmh = Math.abs(raw.speed) * 3.6;
    if (raw.engineEnabled && kmh > 2) return 'driving';
    if (!raw.engineEnabled || raw.parkBrake) return 'rest';
    return raw.onJob ? 'work' : 'idle';
  }

  update(raw: RawTelemetry, place: string | null): DutySummary | null {
    if (raw.paused || !raw.timeAbs) return this.last;
    const min = raw.timeAbs;
    const kmh = Math.abs(raw.speed) * 3.6;
    const day = gameDay(min);
    // amostra de velocidade (1 por minuto do jogo) para o traço do tacógrafo
    const list = this.samples.get(day) ?? [];
    if (!list.length || list[list.length - 1].gameMin !== min) {
      list.push({ gameMin: min, kmh: Math.round(kmh) });
      this.samples.set(day, list);
      if (this.samples.size > 3) this.samples.delete(Math.min(...this.samples.keys()));
    }

    const want = this.classify(raw);
    if (this.state === null) {
      this.state = want;
      this.openSegment(want, min, place);
    } else if (want !== this.state) {
      if (!this.candidate || this.candidate.state !== want) this.candidate = { state: want, since: min };
      else if (min - this.candidate.since >= HYSTERESIS_MIN) {
        this.closeSegment(this.candidate.since);
        this.state = want;
        this.openSegment(want, this.candidate.since, place);
        this.candidate = null;
      }
    } else this.candidate = null;

    // integração por minuto do jogo
    const dMin = this.lastMin === null ? 0 : Math.max(0, Math.min(30, min - this.lastMin));
    this.lastMin = min;
    const odo = raw.odometer;
    if (this.seg && this.lastOdo !== null && odo > this.lastOdo && odo - this.lastOdo < 5) this.seg.km += odo - this.lastOdo;
    this.lastOdo = odo;
    if (dMin > 0) {
      if (this.state === 'driving') {
        this.contDriving += dMin;
        this.nonDrivingStreak = 0;
        this.restStreak = 0;
        this.dailyDriving.set(day, (this.dailyDriving.get(day) ?? 0) + dMin);
      } else {
        this.nonDrivingStreak += dMin;
        if (this.state === 'rest') this.restStreak += dMin;
        if (this.restStreak >= REST_COUNTS_AFTER && this.nonDrivingStreak >= DUTY_LIMITS.breakMin) {
          this.contDriving = 0;
          this.warned = { five: false, over: false };
        }
        if (this.restStreak > this.lastLongRest || this.restStreak >= DUTY_LIMITS.interjornadaMin) this.lastLongRest = Math.max(this.lastLongRest, this.restStreak);
      }
    }
    if (this.contDriving >= 300 && !this.warned.five) {
      this.warned.five = true;
      this.emit('duty-warning', { level: 'warn', minutesLeft: DUTY_LIMITS.continuousMin - this.contDriving });
    }
    if (this.contDriving > DUTY_LIMITS.continuousMin && !this.warned.over) {
      this.warned.over = true;
      this.emit('duty-warning', { level: 'crit', minutesLeft: 0 });
    }

    this.last = {
      state: this.state!,
      gameMin: min,
      continuousDrivingMin: Math.round(this.contDriving),
      dailyDrivingMin: Math.round(this.dailyDriving.get(day) ?? 0),
      currentRestMin: this.state === 'rest' ? Math.round(this.restStreak) : 0,
      lastLongRestMin: Math.round(this.lastLongRest),
      gameRestStopMin: raw.restStop || raw.restStop === 0 ? raw.restStop : null,
      limits: DUTY_LIMITS,
      source: this.source,
    };
    if (min !== this.lastSummaryMin) {
      this.lastSummaryMin = min;
      this.emit('summary', this.last);
    }
    return this.last;
  }

  /** Jornada violada (direção contínua acima do limite ou diária acima de 10 h). */
  get violated(): boolean {
    const day = this.lastMin === null ? 0 : gameDay(this.lastMin);
    return this.contDriving > DUTY_LIMITS.continuousMin || (this.dailyDriving.get(day) ?? 0) > DUTY_LIMITS.dailyMin + DUTY_LIMITS.dailyExtraMin;
  }

  speedSamples(day: number): SpeedSample[] {
    return this.samples.get(day) ?? [];
  }

  segments(day: number): DutySegment[] {
    const list = this.store.listSegments(day, day);
    if (this.seg && this.seg.gameDay === day && !list.some((s) => s.id === this.seg!.id)) list.push(this.seg);
    return list.map((s) => (this.seg && s.id === this.seg.id ? { ...s, km: this.seg.km, endGameMin: this.lastMin } : s));
  }

  private openSegment(state: DutyState, startMin: number, place: string | null) {
    this.seg = this.store.insertSegment({ gameDay: gameDay(startMin), state, startGameMin: startMin, endGameMin: null, km: 0, place });
  }

  private closeSegment(endMin: number) {
    if (!this.seg?.id) return;
    this.seg.endGameMin = endMin;
    this.store.updateSegment(this.seg.id, { endGameMin: endMin, km: Math.round(this.seg.km * 10) / 10 });
  }

  flush(): void {
    if (this.seg?.id && this.lastMin !== null) this.store.updateSegment(this.seg.id, { endGameMin: this.lastMin, km: Math.round(this.seg.km * 10) / 10 });
  }
}
