/** Proteções contra leituras inválidas (NaN, infinito, lixo de memória). */

export function num(v: number | null | undefined, min = -Infinity, max = Infinity): number | null {
  if (v === null || v === undefined || typeof v !== 'number' || !Number.isFinite(v)) return null;
  if (v < min || v > max) return null;
  return v;
}

/** Número positivo onde 0 significa "sem dado" no SDK. */
export function positive(v: number | null | undefined, max = Infinity): number | null {
  const n = num(v, 0, max);
  return n === null || n <= 0 ? null : n;
}

export function ratio(v: number | null | undefined): number | null {
  return num(v, -0.001, 1.001) === null ? null : Math.min(1, Math.max(0, v as number));
}

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/g;

export function text(v: string | null | undefined, maxLen = 128): string | null {
  if (typeof v !== 'string') return null;
  const clean = v.replace(CONTROL, '').trim();
  if (!clean || clean.length > maxLen) return null;
  if (clean.includes('�')) return null; // bytes inválidos em UTF-8 → leitura corrompida
  return clean;
}

export function round(v: number | null, digits = 1): number | null {
  if (v === null) return null;
  const p = 10 ** digits;
  return Math.round(v * p) / p;
}
