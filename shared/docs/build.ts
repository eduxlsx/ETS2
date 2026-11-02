/**
 * Monta o `data` (snapshot usado no render) de cada documento simulado.
 * Funções puras e determinísticas: o mesmo frete gera sempre os mesmos números.
 * Valores monetários em € (como o jogo informa); `fx` guarda o câmbio usado na
 * emissão para o documento continuar idêntico se a configuração mudar.
 */
import { chave, cnpj, cpf, digits, ie, protocolo, rntrc } from './ids.js';
import {
  agency,
  agentName,
  cargoTax,
  cityUf,
  companyAddress,
  countryCode,
  dockNumber,
  emitterName,
  ferryOperator,
  fuelStation,
  offence,
  receiverName,
  receiverPerson,
  tollCategory,
  tollOperator,
  trainOperator,
} from './tables.js';

/** Data-base fictícia do relógio do jogo (o SDK só dá minutos desde segunda 00:00). */
const GAME_EPOCH = Date.UTC(2026, 10, 2, 0, 0); // segunda-feira, 02/11/2026

export function gameDate(gameMin: number): Date {
  return new Date(GAME_EPOCH + Math.max(0, gameMin) * 60_000);
}
const p2 = (n: number) => String(n).padStart(2, '0');
/** "04/11/2026 00:12" */
export function fmtGameDateTime(gameMin: number | null | undefined): string {
  if (gameMin === null || gameMin === undefined) return '—';
  const d = gameDate(gameMin);
  return `${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`;
}
export const fmtGameDate = (gameMin: number | null | undefined) => fmtGameDateTime(gameMin).slice(0, 10);
export const fmtGameTime = (gameMin: number | null | undefined) => fmtGameDateTime(gameMin).slice(11);
/** AAMM do relógio do jogo (para a chave de acesso). */
export function aamm(gameMin: number): string {
  const d = gameDate(gameMin);
  return p2(d.getUTCFullYear() % 100) + p2(d.getUTCMonth() + 1);
}
/** Dia do jogo (0 = primeira segunda-feira). */
export const gameDay = (gameMin: number) => Math.floor(Math.max(0, gameMin) / 1440);

export interface JobInput {
  cargoId: string;
  cargo: string;
  massKg: number;
  units: number;
  citySrc: string;
  compSrc: string;
  cityDst: string;
  compDst: string;
  citySrcId?: string;
  cityDstId?: string;
  incomeEur: number;
  plannedKm: number;
  deadlineGameMin: number | null;
  startedGameMin: number;
  truckPlate: string;
  truckPlateCountry: string;
  trailerPlate: string;
  trailerPlateCountry?: string;
  truckBrand: string;
  truckName: string;
  trailerName?: string;
  trailerBodyType?: string;
  axles: number;
}

export interface DocContext {
  fx: number;
  carrier: string;
  driver: string;
  dieselPrice: number;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

export function parties(job: JobInput, ctx: DocContext) {
  const emit = { name: emitterName(job.compSrc || 'Remetente'), cnpj: cnpj(`${job.compSrc}|${job.citySrc}`), ie: ie(`emit:${job.compSrc}|${job.citySrc}`), city: job.citySrc, uf: cityUf(job.citySrc, job.citySrcId), addr: companyAddress(job.compSrc, job.citySrc), initial: (job.compSrc || '?')[0].toUpperCase() };
  const dest = { name: receiverName(job.compDst || 'Destinatário'), cnpj: cnpj(`${job.compDst}|${job.cityDst}`), ie: ie(`dest:${job.compDst}|${job.cityDst}`), city: job.cityDst, uf: cityUf(job.cityDst, job.cityDstId), addr: companyAddress(job.compDst, job.cityDst) };
  const carrier = { name: ctx.carrier.toUpperCase(), cnpj: cnpj(`carrier|${ctx.carrier}`), ie: ie(`carrier:${ctx.carrier}`), rntrc: rntrc(ctx.carrier), addr: companyAddress(ctx.carrier, 'sede') };
  return { emit, dest, carrier };
}

/** Valores da mercadoria (SIM): massa × preço/kg da categoria; ICMS 12 %. */
export function goods(job: JobInput) {
  const tax = cargoTax(job.cargoId, job.cargo);
  const vProd = r2(Math.max(0, job.massKg) * tax.priceKg);
  return { tax, vProd, icms: r2(vProd * 0.12), grossKg: Math.max(0, job.massKg) + 600, volumes: job.units > 0 ? job.units : 24 };
}

export function buildNfe(job: JobInput, ctx: DocContext, numero: number) {
  const { emit, dest, carrier } = parties(job, ctx);
  const g = goods(job);
  const ym = aamm(job.startedGameMin);
  return {
    model: 55,
    numero,
    key: chave(55, numero, emit.cnpj, ym),
    protocolo: protocolo(ym, numero),
    emittedGameMin: job.startedGameMin,
    deadlineGameMin: job.deadlineGameMin,
    emit,
    dest,
    carrier,
    job,
    cargo: { id: job.cargoId, name: job.cargo, ncm: g.tax.ncm, desc: g.tax.desc, priceKg: g.tax.priceKg, species: g.tax.species, known: g.tax.key !== null },
    vProd: g.vProd,
    icms: g.icms,
    grossKg: g.grossKg,
    netKg: Math.max(0, job.massKg),
    volumes: g.volumes,
    fx: ctx.fx,
    incomeEur: job.incomeEur,
  };
}

export function buildCte(job: JobInput, ctx: DocContext, numero: number, nfeKey: string) {
  const { emit, dest, carrier } = parties(job, ctx);
  const g = goods(job);
  const ym = aamm(job.startedGameMin);
  const vFrete = r2(job.incomeEur * ctx.fx);
  return {
    model: 57,
    numero,
    key: chave(57, numero, carrier.cnpj, ym),
    protocolo: protocolo(ym, numero + 500000),
    emittedGameMin: job.startedGameMin,
    deadlineGameMin: job.deadlineGameMin,
    emit,
    dest,
    carrier,
    job,
    vProd: g.vProd,
    grossKg: g.grossKg,
    vFrete,
    components: { peso: r2(vFrete * 0.82), advalorem: r2(vFrete * 0.08), pedagio: r2(vFrete * 0.06), outros: r2(vFrete * 0.04) },
    icms: r2(vFrete * 0.12),
    nfeKey,
    fx: ctx.fx,
    incomeEur: job.incomeEur,
  };
}

export function buildMdfe(job: JobInput, ctx: DocContext, numero: number, nfeKey: string, cteKey: string) {
  const { emit, dest, carrier } = parties(job, ctx);
  const g = goods(job);
  const ym = aamm(job.startedGameMin);
  const key = chave(58, numero, carrier.cnpj, ym);
  return {
    model: 58,
    numero,
    key,
    qr: `https://truckpulse.local/consulta?chave=${key}`,
    emittedGameMin: job.startedGameMin,
    emit,
    dest,
    carrier,
    job,
    vProd: g.vProd,
    grossKg: g.grossKg,
    driver: { name: ctx.driver, cpf: cpf(ctx.driver) },
    insurer: { name: 'SEGURADORA EXEMPLO S.A. (FICTÍCIA)', policy: digits('apolice:' + ctx.carrier, 10), averbacao: digits(`av:${numero}`, 14) },
    nfeKey,
    cteKey,
    fx: ctx.fx,
  };
}

export function buildToll(job: JobInput | null, ctx: DocContext, gameMin: number, amountEur: number, axles: number, plate: string) {
  const seed = `${gameMin}|${amountEur}`;
  const op = tollOperator(seed);
  return {
    operator: op,
    operatorCnpj: cnpj('toll:' + op),
    plaza: `P-${digits('praca:' + seed, 2)} · KM ${100 + (Number(digits('km:' + seed, 3)) % 800)}`,
    booth: digits('cab:' + seed, 2),
    category: tollCategory(axles),
    plate,
    amountEur,
    fx: ctx.fx,
    receipt: digits('rec:' + seed, 20),
    route: job ? `${job.citySrc} → ${job.cityDst}` : null,
    gameMin,
  };
}

export function buildFuel(ctx: DocContext, gameMin: number, liters: number, odometerKm: number, plate: string, numero: number) {
  const seed = `${gameMin}|${liters.toFixed(1)}`;
  const station = fuelStation(seed);
  const stationCnpj = cnpj('posto:' + station);
  const key = chave(65, numero, stationCnpj, aamm(gameMin));
  return {
    model: 65,
    numero,
    key,
    qr: `https://truckpulse.local/nfce?chave=${key}`,
    station,
    stationCnpj,
    stationIe: ie('posto:' + station),
    pump: digits('bomba:' + seed, 2),
    nozzle: digits('bico:' + seed, 2),
    liters,
    priceBrl: ctx.dieselPrice,
    totalBrl: r2(liters * ctx.dieselPrice),
    odometerKm,
    plate,
    gameMin,
  };
}

export function buildPassage(kind: 'ferry' | 'train', ctx: DocContext, gameMin: number, from: string, to: string, amountEur: number, plate: string) {
  const seed = `${kind}|${gameMin}|${from}|${to}`;
  return {
    kind,
    operator: kind === 'ferry' ? ferryOperator(seed) : trainOperator(seed),
    ticket: digits('bilhete:' + seed, 7),
    from,
    to,
    amountEur,
    fx: ctx.fx,
    plate,
    deck: 1 + (Number(digits('deck:' + seed, 1)) % 4),
    gameMin,
  };
}

export function buildFine(job: JobInput | null, ctx: DocContext, gameMin: number, code: string, amountEur: number, plate: string, truck: string, speedKmh: number | null, limitKmh: number | null) {
  const seed = `${gameMin}|${code}|${amountEur}`;
  const o = offence(code);
  return {
    ait: `${digits('ait:' + seed, 3)}-${digits('ait2:' + seed, 6)}`,
    agency: agency(seed),
    agent: agentName(seed),
    agentId: digits('mat:' + seed, 6),
    offence: o,
    amountEur,
    fx: ctx.fx,
    plate,
    truck,
    place: job ? `Rodovia — rota ${job.citySrc} → ${job.cityDst}` : 'Rodovia',
    measured: code.startsWith('speeding') && speedKmh !== null ? { speedKmh: Math.round(speedKmh), limitKmh: limitKmh ? Math.round(limitKmh) : null } : null,
    driver: ctx.driver,
    gameMin,
  };
}

export interface DeliveryInput {
  revenueEur: number;
  cargoDamage: number;
  distanceKm: number;
  deliveryTimeMin: number;
  earnedXp: number;
  autopark: boolean;
  autoload: boolean;
}

/** Nota de avaliação (SIM): 5 − 1,5·(avaria/10 %) − 0,5·multas − 1·atraso − 0,5·jornada + 0,5·(sem autopark), 1–5 em passos de 0,5. */
export function deliveryRating(o: { damage: number; fines: number; lateMin: number; dutyViolated: boolean; autopark: boolean }): number {
  const raw = 5 - 1.5 * (o.damage / 0.1) - 0.5 * o.fines - (o.lateMin > 0 ? 1 : 0) - (o.dutyViolated ? 0.5 : 0) + (o.autopark ? 0 : 0.5);
  return Math.max(1, Math.min(5, Math.round(raw * 2) / 2));
}

export function buildDelivery(job: JobInput, ctx: DocContext, gameMin: number, d: DeliveryInput, extra: { fines: number; dutyViolated: boolean; avgConsumption: number | null }) {
  const lateMin = job.deadlineGameMin ? gameMin - job.deadlineGameMin : 0;
  const rating = deliveryRating({ damage: d.cargoDamage, fines: extra.fines, lateMin, dutyViolated: extra.dutyViolated, autopark: d.autopark });
  return {
    job,
    gameMin,
    delivered: d,
    lateMin,
    fines: extra.fines,
    dutyViolated: extra.dutyViolated,
    avgConsumption: extra.avgConsumption,
    rating,
    receiver: receiverPerson(`${job.compDst}|${job.startedGameMin}`),
    dock: dockNumber(`${job.compDst}|${job.startedGameMin}`),
    fx: ctx.fx,
  };
}

export { countryCode };
