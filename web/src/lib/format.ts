import type { Settings } from '../../../shared/types';

export const ND = 'N/D';

const KM_TO_MI = 0.621371;
const L_TO_GAL = 0.264172;
const PSI_TO_BAR = 0.0689476;

export function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function fixed(v: number | null | undefined, digits = 0): string {
  return isNum(v) ? v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : ND;
}

export function speed(kmh: number | null | undefined, s: Pick<Settings, 'speedUnit'>) {
  const mph = s.speedUnit === 'mph';
  const v = isNum(kmh) ? (mph ? kmh * KM_TO_MI : kmh) : null;
  return { value: v, text: fixed(v, 0), unit: mph ? 'mph' : 'km/h' };
}

export function distance(km: number | null | undefined, s: Pick<Settings, 'distanceUnit'>, digits = 1) {
  const mi = s.distanceUnit === 'mi';
  const v = isNum(km) ? (mi ? km * KM_TO_MI : km) : null;
  return { value: v, text: fixed(v, digits), unit: mi ? 'mi' : 'km' };
}

export function fuel(l: number | null | undefined, s: Pick<Settings, 'fuelUnit'>, digits = 0) {
  const gal = s.fuelUnit === 'gal';
  const v = isNum(l) ? (gal ? l * L_TO_GAL : l) : null;
  return { value: v, text: fixed(v, digits), unit: gal ? 'gal' : 'L' };
}

/** Consumo: L/100 km ou mpg (galões US). */
export function consumption(l100: number | null | undefined, s: Pick<Settings, 'fuelUnit' | 'distanceUnit'>) {
  if (s.fuelUnit === 'gal' || s.distanceUnit === 'mi') {
    const mpg = isNum(l100) && l100 > 0 ? 235.215 / l100 : null;
    return { value: mpg, text: fixed(mpg, 1), unit: 'mpg' };
  }
  return { value: isNum(l100) ? l100 : null, text: fixed(l100, 1), unit: 'L/100km' };
}

export function temp(c: number | null | undefined, s: Pick<Settings, 'temperatureUnit'>) {
  const f = s.temperatureUnit === 'f';
  const v = isNum(c) ? (f ? c * 1.8 + 32 : c) : null;
  return { value: v, text: fixed(v, 0), unit: f ? '°F' : '°C' };
}

export function pressure(psi: number | null | undefined, s: Pick<Settings, 'pressureUnit'>) {
  const bar = s.pressureUnit === 'bar';
  const v = isNum(psi) ? (bar ? psi * PSI_TO_BAR : psi) : null;
  return { value: v, text: fixed(v, bar ? 1 : 0), unit: bar ? 'bar' : 'psi' };
}

export function pct(ratio: number | null | undefined, digits = 0): string {
  return isNum(ratio) ? `${fixed(ratio * 100, digits)}%` : ND;
}

export function duration(seconds: number | null | undefined): string {
  if (!isNum(seconds)) return ND;
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  const sec = s % 60;
  return `${m}min ${String(sec).padStart(2, '0')}s`;
}

export function gameMinutes(min: number | null | undefined): string {
  if (!isNum(min)) return ND;
  const h = Math.floor(Math.abs(min) / 60);
  const m = Math.abs(min) % 60;
  return `${min < 0 ? '-' : ''}${h}h ${String(m).padStart(2, '0')}min`;
}

export function dateTime(ts: number | null | undefined): string {
  if (!isNum(ts)) return ND;
  return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function yesNo(v: boolean | null | undefined, yes = 'Ligado', no = 'Desligado'): string {
  return v === null || v === undefined ? ND : v ? yes : no;
}
