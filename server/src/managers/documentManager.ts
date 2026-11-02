import { EventEmitter } from 'node:events';
import {
  buildCte,
  buildDelivery,
  buildFine,
  buildFuel,
  buildMdfe,
  buildNfe,
  buildPassage,
  buildToll,
  fmtGameTime,
  type DocContext,
  type JobInput,
} from '../../../shared/docs/build.js';
import { fmtNumero } from '../../../shared/docs/ids.js';
import { dockNumber, offence } from '../../../shared/docs/tables.js';
import {
  docsSettings,
  type DataSource,
  type DispatchMessage,
  type DocStamp,
  type DocType,
  type JobRecord,
  type LedgerEntry,
  type PaperworkSummary,
  type Settings,
  type SignatureStroke,
  type TelemetryFrame,
  type TripDoc,
} from '../../../shared/types.js';
import type { RawTelemetry } from '../sdk/raw.js';
import type { DocStore } from './docStore.js';
import { summarize } from './docStore.js';
import type { DutyManager } from './dutyManager.js';
import { GameplayEventDetector, snapshotJob, type GameplayEvent, type JobSnapshot } from './gameplayEvents.js';

const COUNTER_START: Record<string, number> = { nfe: 4201, cte: 1381, mdfe: 501, nfce: 88201 };
const COOLDOWN_MS = 60_000;

function toJobInput(s: JobSnapshot): JobInput {
  return {
    cargoId: s.cargoId, cargo: s.cargo, massKg: s.massKg, units: s.units, citySrc: s.citySrc, compSrc: s.compSrc, cityDst: s.cityDst, compDst: s.compDst,
    citySrcId: s.citySrcId, cityDstId: s.cityDstId, incomeEur: s.incomeEur, plannedKm: s.plannedKm, deadlineGameMin: s.deadlineGameMin,
    startedGameMin: s.startedGameMin, truckPlate: s.truckPlate, truckPlateCountry: s.truckPlateCountry, trailerPlate: s.trailerPlate,
    trailerPlateCountry: s.trailerPlateCountry, truckBrand: s.truckBrand, truckName: s.truckName, trailerName: s.trailerName,
    trailerBodyType: s.trailerBodyType, axles: s.axles,
  };
}

/** Rubrica gerada automaticamente (assinatura eletrônica automática). */
export function autoSignature(seed: number): SignatureStroke[] {
  const s: SignatureStroke = [];
  let x = 0.06;
  const y = 0.62;
  const k = 1 + (seed % 5) * 0.08;
  for (let i = 0; i < 90; i++) {
    x += 0.0052;
    const a = i * 0.42 * k;
    s.push([x, y - 0.11 * Math.sin(a) * (1 + 0.6 * Math.sin(i * 0.11)) - 0.05 * Math.sin(a * 0.5), 1.3 + 1.2 * Math.abs(Math.cos(a))]);
  }
  return [s, [[0.08, 0.74, 1.4], [0.3, 0.71, 2.2], [0.52, 0.73, 1.2]]];
}

/** Normaliza/valida os traços vindos do cliente (0..1, no máx. 60 traços × 2000 pontos). */
export function sanitizeStrokes(input: unknown): SignatureStroke[] | null {
  if (!Array.isArray(input)) return null;
  const out: SignatureStroke[] = [];
  for (const st of input.slice(0, 60)) {
    if (!Array.isArray(st)) continue;
    const pts: SignatureStroke = [];
    for (const p of st.slice(0, 2000)) {
      if (!Array.isArray(p) || p.length < 2) continue;
      const [x, y, w = 2] = p.map(Number);
      if (![x, y, w].every(Number.isFinite)) continue;
      pts.push([Math.max(0, Math.min(1, Math.round(x * 1e4) / 1e4)), Math.max(0, Math.min(1, Math.round(y * 1e4) / 1e4)), Math.max(0.5, Math.min(6, Math.round(w * 10) / 10))]);
    }
    if (pts.length) out.push(pts);
  }
  return out;
}

export class DocumentManager extends EventEmitter {
  private detector = new GameplayEventDetector();
  private job: JobRecord | null = null;
  private jobInput: JobInput | null = null;
  private docsOfJob: Partial<Record<DocType, number>> = {};
  private autoSignAt: { docId: number; at: number } | null = null;
  private cooldown = new Map<string, number>();
  private flags = { half: false, arriving: false, late: false };
  private lastDamage = 0;
  private lastReserve: boolean | null = null;
  private lastGameMin = 0;
  private now = () => Date.now();

  constructor(readonly store: DocStore, private getSettings: () => Settings, private duty: DutyManager | null, opts?: { now?: () => number }) {
    super();
    if (opts?.now) this.now = opts.now;
    duty?.on('duty-warning', (w: { level: 'warn' | 'crit'; minutesLeft: number }) =>
      this.dispatch(
        'duty',
        w.level,
        w.level === 'warn'
          ? `Faltam ${w.minutesLeft} minutos para a parada obrigatória (direção contínua).`
          : 'Direção contínua acima de 5 h 30. Faça a pausa de 30 minutos.',
        true,
      ),
    );
  }

  get source(): DataSource {
    return this.store.source;
  }

  private ctx(): DocContext {
    const d = docsSettings(this.getSettings());
    return { fx: d.fxBrlPerEur, carrier: d.carrierName, driver: d.driverName, dieselPrice: d.dieselPriceBrl };
  }

  /** Processa um tick: eventos do SDK + avisos derivados do frame. */
  update(raw: RawTelemetry, frame: TelemetryFrame): void {
    this.lastGameMin = raw.timeAbs;
    for (const ev of this.detector.feed(raw)) this.handle(ev, raw);
    this.watch(frame);
    if (this.autoSignAt && this.now() >= this.autoSignAt.at) {
      const id = this.autoSignAt.docId;
      this.autoSignAt = null;
      this.sign(id, null, true);
    }
  }

  /** Resumo para o frame (barra de status, Painel). */
  paperwork(): PaperworkSummary | null {
    const j = this.job;
    if (!j) return null;
    const nfe = this.docsOfJob.nfe ? this.store.getDoc(this.docsOfJob.nfe) : null;
    const cte = this.docsOfJob.cte ? this.store.getDoc(this.docsOfJob.cte) : null;
    const mdfe = this.docsOfJob.mdfe ? this.store.getDoc(this.docsOfJob.mdfe) : null;
    return {
      jobId: j.id,
      status: j.status,
      route: `${j.srcCity ?? '?'} → ${j.dstCity ?? '?'}`,
      nfe: nfe?.number ?? null,
      cte: cte?.number ?? null,
      mdfe: mdfe?.number ?? null,
      nfeDocId: nfe?.id ?? null,
      awaitingSignature: j.status === 'awaiting_signature',
      source: this.source,
    };
  }

  currentJob(): JobRecord | null {
    return this.job ? this.store.getJob(this.job.id) : this.store.listJobs(1, 0)[0] ?? null;
  }

  /* ───────────────────────── eventos ───────────────────────── */

  handle(ev: GameplayEvent, raw?: RawTelemetry): void {
    this.store.insertEvent(ev.kind, ev.gameTime, { payload: ev.payload, job: ev.job });
    switch (ev.kind) {
      case 'job-start':
        if (ev.job) this.startJob(ev.job, ev.gameTime);
        break;
      case 'delivered':
        this.delivered(ev);
        break;
      case 'cancelled':
        this.cancelled(ev);
        break;
      case 'toll':
        this.toll(ev);
        break;
      case 'ferry':
      case 'train':
        this.passage(ev);
        break;
      case 'refuel':
        this.refuel(ev);
        break;
      case 'fined':
        this.fine(ev, raw);
        break;
      default:
        break;
    }
  }

  private emitDoc(d: TripDoc | null) {
    if (d) this.emit('doc', summarize(d));
  }

  private addDoc(type: DocType, title: string, data: Record<string, any>, gameMin: number, status: TripDoc['status'] = 'issued', number: number | null = null, key: string | null = null): TripDoc {
    const doc = this.store.insertDoc({ jobId: this.job?.id ?? null, type, number, key, status, gameMin, createdAt: this.now(), source: this.source, title, data });
    this.emitDoc(doc);
    return doc;
  }

  private setDocStatus(id: number | undefined, status: TripDoc['status'], extra: Partial<TripDoc> = {}) {
    if (!id) return null;
    const d = this.store.updateDoc(id, { status, ...extra });
    this.emitDoc(d);
    return d;
  }

  private ledger(kind: LedgerEntry['kind'], label: string, amountEur: number, origin: 'sdk' | 'sim', documentId: number | null, gameMin: number) {
    this.store.insertLedger({ jobId: this.job?.id ?? null, documentId, gameMin, kind, label, amountEur: Math.round(amountEur * 100) / 100, origin, createdAt: this.now() });
  }

  private startJob(snap: JobSnapshot, gameMin: number) {
    // documentos do frete anterior → arquivados
    if (this.job) {
      // canhoto ainda sem assinatura: assina automaticamente antes de arquivar
      const nfePrev = this.docsOfJob.nfe ? this.store.getDoc(this.docsOfJob.nfe) : null;
      if (nfePrev?.status === 'awaiting_signature') this.sign(nfePrev.id, null, true);
      const prev = this.store.getJob(this.job.id);
      if (prev && prev.status !== 'cancelled') {
        this.store.updateJob(prev.id, { status: 'archived' });
        for (const id of Object.values(this.docsOfJob)) {
          const d = id ? this.store.getDoc(id) : null;
          if (d && d.status !== 'cancelled') this.setDocStatus(d.id, 'archived');
        }
      }
    }
    const input = toJobInput(snap);
    this.jobInput = input;
    this.docsOfJob = {};
    this.flags = { half: false, arriving: false, late: false };
    this.lastDamage = 0;
    this.autoSignAt = null;
    this.job = this.store.insertJob({
      status: 'issued', startedGameMin: input.startedGameMin, deadlineGameMin: input.deadlineGameMin, finishedGameMin: null, cargoId: input.cargoId || null,
      cargo: input.cargo || null, massKg: input.massKg, units: input.units, srcCity: input.citySrc, srcCompany: input.compSrc, dstCity: input.cityDst,
      dstCompany: input.compDst, incomeEur: input.incomeEur, plannedKm: input.plannedKm, deliveredRevenueEur: null, deliveredDamage: null, deliveredKm: null,
      deliveredTimeMin: null, earnedXp: null, autopark: null, autoload: null, cancelPenaltyEur: null, truckPlate: input.truckPlate || null,
      truckPlateCountry: input.truckPlateCountry || null, trailerPlate: input.trailerPlate || null, truckName: `${input.truckBrand} ${input.truckName}`.trim() || null,
      rating: null, checklist: null, createdAt: this.now(), source: this.source,
    });
    const ctx = this.ctx();
    const nfe = buildNfe(input, ctx, this.store.nextCounter('nfe', COUNTER_START.nfe));
    const cte = buildCte(input, ctx, this.store.nextCounter('cte', COUNTER_START.cte), nfe.key);
    const mdfe = buildMdfe(input, ctx, this.store.nextCounter('mdfe', COUNTER_START.mdfe), nfe.key, cte.key);
    const dNfe = this.addDoc('nfe', `DANFE ${fmtNumero(nfe.numero)}`, nfe, gameMin, 'issued', nfe.numero, nfe.key);
    const dCte = this.addDoc('cte', `DACTE ${fmtNumero(cte.numero)}`, { ...cte, amountEur: input.incomeEur }, gameMin, 'issued', cte.numero, cte.key);
    const dMdfe = this.addDoc('mdfe', `DAMDFE ${fmtNumero(mdfe.numero)}`, mdfe, gameMin, 'issued', mdfe.numero, mdfe.key);
    this.docsOfJob = { nfe: dNfe.id, cte: dCte.id, mdfe: dMdfe.id };
    // emitida → em trânsito
    this.store.updateJob(this.job.id, { status: 'transit' });
    this.job.status = 'transit';
    for (const id of [dNfe.id, dCte.id, dMdfe.id]) this.setDocStatus(id, 'transit');
    if (input.incomeEur > 0) this.ledger('advance', 'Adiantamento de frete (50 %)', input.incomeEur * 0.5, 'sim', dCte.id, gameMin);
    const t = Math.round((input.massKg / 1000) * 10) / 10;
    this.dispatch('job', 'info', `Frete confirmado: ${(input.cargo || 'carga').toLowerCase()}, ${t.toLocaleString('pt-BR')} t para ${input.compDst} em ${input.cityDst}. NF-e, CT-e e MDF-e emitidos.`, true);
    this.emit('job-start', this.job);
  }

  private ensureJob(ev: GameplayEvent) {
    if (!this.job && ev.job) this.startJob(ev.job, ev.gameTime);
  }

  private delivered(ev: GameplayEvent) {
    this.ensureJob(ev);
    if (!this.job || !this.jobInput) return;
    const p = ev.payload;
    const finished = ev.gameTime;
    const job = this.store.updateJob(this.job.id, {
      status: 'awaiting_signature', finishedGameMin: finished, deliveredRevenueEur: p.revenueEur, deliveredDamage: p.cargoDamage, deliveredKm: p.distanceKm,
      deliveredTimeMin: p.deliveryTimeMin, earnedXp: p.earnedXp, autopark: !!p.autopark, autoload: !!p.autoload,
    });
    if (job) this.job = job;
    const nfeId = this.docsOfJob.nfe;
    this.setDocStatus(nfeId, 'awaiting_signature');
    this.setDocStatus(this.docsOfJob.cte, 'delivered');
    this.setDocStatus(this.docsOfJob.mdfe, 'delivered');
    // relatório de entrega
    const fines = this.store.listDocs({ jobId: this.job.id, type: 'fine' }).length;
    const report = buildDelivery(this.jobInput, this.ctx(), finished, p as any, { fines, dutyViolated: this.duty?.violated ?? false, avgConsumption: null });
    const rep = this.addDoc('delivery', `Relatório de entrega · ${this.jobInput.cityDst}`, report, finished, 'delivered');
    this.docsOfJob.delivery = rep.id;
    this.store.updateJob(this.job.id, { rating: report.rating });
    // saldo do frete
    const revenue = Number(p.revenueEur) || 0;
    const advance = (this.jobInput.incomeEur || 0) * 0.5;
    if (revenue > 0) this.ledger('revenue', 'Saldo do frete na entrega', revenue - advance, 'sdk', nfeId ?? null, finished);
    const d = docsSettings(this.getSettings());
    if (d.autoSign && nfeId) this.autoSignAt = { docId: nfeId, at: this.now() + d.autoSignMinutes * 60_000 };
    this.dispatch('delivered', 'ok', `Chegada em ${this.jobInput.cityDst}. Confira a carga e assine o canhoto da NF-e ${fmtNumero(this.store.getDoc(nfeId!)?.number ?? 0)}.`, true);
  }

  /** Assina o canhoto (motorista ou automático) e aplica os carimbos. */
  sign(docId: number, strokes: SignatureStroke[] | null, auto = false): TripDoc | { error: string } {
    const doc = this.store.getDoc(docId);
    if (!doc) return { error: 'Documento não encontrado' };
    if (doc.type !== 'nfe' || doc.status !== 'awaiting_signature') return { error: 'O canhoto só pode ser assinado quando a entrega estiver aguardando assinatura' };
    const job = doc.jobId ? this.store.getJob(doc.jobId) : null;
    const d = docsSettings(this.getSettings());
    const gm = job?.finishedGameMin ?? this.lastGameMin;
    const dock = dockNumber(`${job?.dstCompany ?? ''}|${job?.startedGameMin ?? 0}`);
    const seed = doc.id * 7 + (job?.id ?? 0);
    const stamps: DocStamp[] = [
      {
        kind: 'received', color: 'blue', rot: -12 + (seed % 9), at: this.now(),
        lines: [`${(job?.dstCompany ?? '').toUpperCase()} · ${(job?.dstCity ?? '').toUpperCase()}`, 'RECEBIDO', fmtGameDateTimeShort(gm), `CONFERIDO · DOCA ${dock}`],
      },
    ];
    const damagePct = (job?.deliveredDamage ?? 0) * 100;
    if (damagePct > d.damageStampPct) {
      stamps.push({ kind: 'damage', color: 'red', rot: -4 - (seed % 5), at: this.now() + 800, lines: ['AVARIA', `REGISTRADA ${damagePct.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} %`] });
    }
    const signed = this.store.updateDoc(doc.id, {
      status: 'delivered',
      signature: { strokes: strokes && strokes.length ? strokes : autoSignature(seed), signedAt: this.now(), auto: auto || !strokes?.length },
      stamps,
      data: { ...doc.data, receivedGameMin: gm, dock, damagePct },
    });
    this.emitDoc(signed);
    if (job) {
      this.store.updateJob(job.id, { status: 'delivered' });
      if (this.job?.id === job.id) this.job.status = 'delivered';
    }
    if (this.autoSignAt?.docId === doc.id) this.autoSignAt = null;
    this.dispatch('delivered', 'ok', `Entrega confirmada${job?.dstCity ? ` em ${job.dstCity}` : ''}. NF-e ${fmtNumero(doc.number ?? 0)} ${auto ? 'assinada automaticamente' : 'assinada'} e carimbada.`, true);
    return signed!;
  }

  private cancelled(ev: GameplayEvent) {
    this.ensureJob(ev);
    if (!this.job) return;
    const penalty = Number(ev.payload.penaltyEur) || 0;
    this.store.updateJob(this.job.id, { status: 'cancelled', cancelPenaltyEur: penalty, finishedGameMin: ev.gameTime });
    this.job.status = 'cancelled';
    for (const t of ['nfe', 'cte', 'mdfe'] as const) {
      const id = this.docsOfJob[t];
      if (!id) continue;
      this.setDocStatus(id, 'cancelled', {
        stamps: [{ kind: 'cancelled', color: 'red', rot: -6, at: this.now(), lines: ['CANCELADO', penalty > 0 ? `MULTA CONTRATUAL € ${penalty.toLocaleString('pt-BR')}` : 'FRETE CANCELADO'] }],
      });
    }
    this.autoSignAt = null;
    if (penalty > 0) this.ledger('cancel_penalty', 'Multa de cancelamento do frete', -penalty, 'sdk', this.docsOfJob.cte ?? null, ev.gameTime);
    this.dispatch('cancelled', 'crit', `Frete cancelado.${penalty > 0 ? ` Multa contratual de € ${penalty.toLocaleString('pt-BR')} lançada na carteira.` : ''}`, true);
  }

  private plate(ev: GameplayEvent): string {
    return ev.job?.truckPlate || this.jobInput?.truckPlate || '—';
  }

  private toll(ev: GameplayEvent) {
    const amount = Number(ev.payload.amountEur) || 0;
    const data = buildToll(this.jobInput, this.ctx(), ev.gameTime, amount, ev.job?.axles ?? this.jobInput?.axles ?? 5, this.plate(ev));
    const doc = this.addDoc('toll', `Pedágio · ${data.plaza.split(' ·')[0]}`, { ...data, amountEur: amount }, ev.gameTime, 'issued');
    if (amount > 0) this.ledger('toll', `Pedágio ${data.plaza}`, -amount, 'sdk', doc.id, ev.gameTime);
    this.dispatch('toll', 'info', `Pedágio pago: € ${amount.toLocaleString('pt-BR')} (recibo na pasta).`, false);
  }

  private passage(ev: GameplayEvent) {
    const kind = ev.kind as 'ferry' | 'train';
    const amount = Number(ev.payload.amountEur) || 0;
    const data = buildPassage(kind, this.ctx(), ev.gameTime, ev.payload.from || '?', ev.payload.to || '?', amount, this.plate(ev));
    const doc = this.addDoc(kind, `${kind === 'ferry' ? 'Balsa' : 'Trem'} ${data.from} → ${data.to}`, { ...data, amountEur: amount }, ev.gameTime, 'issued');
    if (amount > 0) this.ledger(kind, `${kind === 'ferry' ? 'Balsa' : 'Trem'} ${data.from} → ${data.to}`, -amount, 'sdk', doc.id, ev.gameTime);
    this.dispatch('ferry', 'info', `Embarque confirmado: ${data.from} → ${data.to}.`, false);
  }

  private refuel(ev: GameplayEvent) {
    const liters = Number(ev.payload.liters) || 0;
    if (liters <= 0) return;
    const ctx = this.ctx();
    const data = buildFuel(ctx, ev.gameTime, liters, Number(ev.payload.odometerKm) || 0, this.plate(ev), this.store.nextCounter('nfce', COUNTER_START.nfce));
    const amountEur = data.totalBrl / ctx.fx;
    const doc = this.addDoc('fuel', `Abastecimento ${liters.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`, { ...data, amountEur }, ev.gameTime, 'issued', data.numero, data.key);
    this.ledger('fuel', `Abastecimento ${liters.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`, -amountEur, 'sim', doc.id, ev.gameTime);
    this.dispatch('refuel', 'info', `Abastecimento registrado: ${liters.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L (cartão frota).`, false);
  }

  private fine(ev: GameplayEvent, raw?: RawTelemetry) {
    const amount = Number(ev.payload.amountEur) || 0;
    const truck = ev.job ? `${ev.job.truckBrand} ${ev.job.truckName}`.trim() : raw ? `${raw.truckBrand} ${raw.truckName}`.trim() : '—';
    const data = buildFine(this.jobInput, this.ctx(), ev.gameTime, ev.payload.offence, amount, this.plate(ev), truck, ev.payload.speedKmh ?? null, ev.payload.limitKmh ?? null);
    const doc = this.addDoc('fine', `Multa · ${offence(ev.payload.offence).desc.toLowerCase()}`, { ...data, amountEur: amount }, ev.gameTime, 'issued');
    if (amount > 0) this.ledger('fine', `Multa: ${data.offence.desc}`, -amount, 'sdk', doc.id, ev.gameTime);
    this.dispatch('fine', 'crit', `Recebemos o auto de infração: ${data.offence.desc.toLowerCase()}, € ${amount.toLocaleString('pt-BR')}.`, true);
  }

  /* ───────────────────────── checklist ───────────────────────── */

  saveChecklist(jobId: number, items: Record<string, boolean>): JobRecord | null {
    const clean: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(items ?? {}).slice(0, 30)) if (/^[\w-]{1,40}$/.test(k)) clean[k] = !!v;
    return this.store.updateJob(jobId, { checklist: clean });
  }

  /* ───────────────────────── despachante ───────────────────────── */

  dispatch(event: DispatchMessage['event'], level: DispatchMessage['level'], text: string, force = false) {
    const t = this.now();
    if (!force && t - (this.cooldown.get(event) ?? 0) < COOLDOWN_MS) return;
    this.cooldown.set(event, t);
    const msg: DispatchMessage = { id: `${event}-${t}`, event, level, text, gameMin: this.lastGameMin, at: t };
    this.emit('dispatch', msg);
  }

  /** Avisos derivados do frame (metade do percurso, chegada, atraso, avaria, reserva). */
  private watch(f: TelemetryFrame) {
    const j = f.job;
    if (j.onJob && this.job && (this.job.status === 'transit' || this.job.status === 'issued')) {
      const planned = j.plannedDistanceKm;
      const left = j.routeDistanceKm;
      if (planned && left !== null && left <= planned * 0.5 && left > 25 && !this.flags.half) {
        this.flags.half = true;
        const slack = j.deadlineGameMin && j.routeTimeS !== null ? j.deadlineGameMin - (this.lastGameMin + j.routeTimeS / 60) : null;
        this.dispatch('half', 'info', `Metade do percurso.${slack !== null ? ` Folga de ${fmtDuration(slack)} no prazo.` : ''}`, true);
      }
      if (left !== null && left < 25 && left > 0 && !this.flags.arriving) {
        this.flags.arriving = true;
        const dock = dockNumber(`${j.destinationCompany ?? ''}|${this.job.startedGameMin}`);
        this.dispatch('arriving', 'ok', `${j.destinationCompany ?? 'Cliente'} avisada: doca ${dock} reservada.`, true);
      }
      const avg = f.trip.avgSpeedKmh && f.trip.avgSpeedKmh > 20 ? f.trip.avgSpeedKmh : 60;
      if (j.deadlineGameMin && left !== null && !this.flags.late && (!planned || left < planned * 0.9)) {
        // ETA: tempo de rota do próprio GPS do jogo; sem ele, distância ÷ velocidade média do trip
        const etaMin = j.routeTimeS !== null && j.routeTimeS > 0 ? j.routeTimeS / 60 : (left / avg) * 60;
        const over = this.lastGameMin + etaMin - j.deadlineGameMin;
        if (over > 0 && left > 5) {
          this.flags.late = true;
          this.dispatch('late', 'warn', `Previsão de atraso de ${fmtDuration(over)}. Quer que eu avise o cliente?`, true);
        }
      }
      const dmg = (f.wear.cargo ?? 0) * 100;
      if (dmg - this.lastDamage > 2) {
        this.lastDamage = dmg;
        this.dispatch('damage', 'warn', `Registramos avaria de ${dmg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} % na carga.`, true);
      }
    }
    const reserve = f.fuel.reserve;
    if (reserve && this.lastReserve === false) {
      this.dispatch('fuel', 'warn', `Entrou na reserva. Autonomia de ${Math.round(f.fuel.rangeKm ?? 0)} km.`, true);
    }
    this.lastReserve = reserve;
  }

  /** Força a criação dos documentos para um frete já em andamento (sem evento). */
  bootstrap(raw: RawTelemetry) {
    if (raw.onJob && !this.job) this.startJob(snapshotJob(raw), raw.timeAbs);
  }
}

function fmtDuration(min: number): string {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`;
}

function fmtGameDateTimeShort(gm: number): string {
  const days = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
  return `${days[Math.floor(gm / 1440) % 7]} ${fmtGameTime(gm)}`;
}
