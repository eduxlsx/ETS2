/**
 * Identificadores SIMULADOS e determinísticos para os documentos fiscais
 * fictícios (DOCUMENTOS-SPEC §1.2). Nada aqui é um documento real:
 * - CNPJs usam a raiz "99" (com dígitos verificadores válidos pelo algoritmo oficial);
 * - a chave de acesso usa cUF 91 (código de UF inexistente);
 * - a mesma semente gera sempre os mesmos números.
 */

/** Hash FNV-1a de 32 bits. */
export function fnv(s: string): number {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.codePointAt(0)!;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** Gera `n` dígitos determinísticos a partir de uma semente. */
export function digits(seed: string, n: number): string {
  let out = '';
  let h = fnv(seed);
  while (out.length < n) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
    out += String(h % 10);
  }
  return out;
}

/** Número inteiro determinístico em [0, max). */
export function hashInt(seed: string, max: number): number {
  return fnv(seed) % Math.max(1, max);
}

function dvMod11(nums: number[], weights: number[]): number {
  const s = nums.reduce((a, d, i) => a + d * weights[i], 0) % 11;
  return s < 2 ? 0 : 11 - s;
}

const onlyDigits = (s: string) => s.replace(/\D/g, '');

export function formatCnpj(d: string): string {
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** CNPJ fictício: raiz 99 + 6 dígitos do hash + filial 0001 + 2 DV oficiais. */
export function cnpj(seed: string): string {
  const b = ('99' + digits('cnpj:' + seed, 6) + '0001').split('').map(Number);
  const d1 = dvMod11(b, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = dvMod11([...b, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return formatCnpj([...b, d1, d2].join(''));
}

/** Valida os dígitos verificadores de um CNPJ (algoritmo oficial). */
export function isValidCnpj(v: string): boolean {
  const d = onlyDigits(v);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const n = d.split('').map(Number);
  const d1 = dvMod11(n.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = dvMod11(n.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === n[12] && d2 === n[13];
}

function cpfDv(arr: number[]): number {
  const s = arr.reduce((a, d, i) => a + d * (arr.length + 1 - i), 0) % 11;
  return s < 2 ? 0 : 11 - s;
}

/** CPF fictício (9 dígitos do hash + 2 DV oficiais). */
export function cpf(seed: string): string {
  const b = digits('cpf:' + seed, 9).split('').map(Number);
  const d1 = cpfDv(b);
  const d2 = cpfDv([...b, d1]);
  const s = [...b, d1, d2].join('');
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`;
}

export function isValidCpf(v: string): boolean {
  const d = onlyDigits(v);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const n = d.split('').map(Number);
  return cpfDv(n.slice(0, 9)) === n[9] && cpfDv(n.slice(0, 10)) === n[10];
}

/** Inscrição estadual fictícia (12 dígitos). */
export function ie(seed: string): string {
  const d = digits('ie:' + seed, 12);
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}.${d.slice(9)}`;
}

/** RNTRC fictício (8 dígitos). */
export const rntrc = (seed: string) => digits('rntrc:' + seed, 8);

/** DV módulo 11 da chave de acesso (pesos 2…9 da direita para a esquerda). */
export function chaveDv(base43: string): number {
  let s = 0;
  let w = 2;
  for (let i = base43.length - 1; i >= 0; i--) {
    s += Number(base43[i]) * w;
    w = w === 9 ? 2 : w + 1;
  }
  const r = s % 11;
  return r < 2 ? 0 : 11 - r;
}

/**
 * Chave de acesso de 44 dígitos:
 * cUF(2)=91 · AAMM(4) · CNPJ(14) · modelo(2) · série(3)=001 · nº(9) · tpEmis(1)=1 · cNF(8) · DV(1)
 */
export function chave(model: 55 | 57 | 58 | 65, numero: number, emitCnpj: string, aamm: string): string {
  const base =
    '91' +
    aamm.padStart(4, '0').slice(-4) +
    onlyDigits(emitCnpj).padStart(14, '0').slice(-14) +
    String(model).padStart(2, '0') +
    '001' +
    String(numero).padStart(9, '0').slice(-9) +
    '1' +
    digits(`cnf:${model}:${numero}:${emitCnpj}`, 8);
  return base + chaveDv(base);
}

export function isValidChave(k: string): boolean {
  return /^\d{44}$/.test(k) && chaveDv(k.slice(0, 43)) === Number(k[43]);
}

/** Modelo do documento contido na chave (posições 21–22). */
export const chaveModelo = (k: string) => Number(k.slice(20, 22));

/** Chave em grupos de 4. */
export const fmtChave = (k: string) => k.replace(/(\d{4})(?=\d)/g, '$1 ');

/** Número do documento com separadores: 000.004.217 */
export const fmtNumero = (n: number) => String(n).padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');

/** Protocolo de autorização fictício: 991 + AAMM + nº (7) + dígito. */
export function protocolo(aamm: string, numero: number): string {
  const base = '991' + aamm + String(numero).padStart(7, '0');
  return `${base.slice(0, 3)} ${base.slice(3, 7)} ${base.slice(7)} ${chaveDv(base) % 10}`;
}

/* ───────────────────────── Code 128-C ───────────────────────── */

/** Padrões oficiais (larguras barra/espaço) dos símbolos 0…106. */
export const C128 = ['212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232', '2331112'];

/** Símbolos Code 128-C (início C = 105, pares de dígitos, checksum módulo 103, parada 106). */
export function code128cSymbols(d: string): number[] {
  const data = d.length % 2 ? '0' + d : d;
  const vals = [105];
  for (let i = 0; i < data.length; i += 2) vals.push(Number(data.slice(i, i + 2)));
  let chk = 105;
  vals.slice(1).forEach((v, i) => (chk += v * (i + 1)));
  vals.push(chk % 103);
  vals.push(106);
  return vals;
}

/** Barras [x, largura] em módulos, com zona quieta de 10 módulos. */
export function code128cBars(d: string): { bars: [number, number][]; width: number } {
  const bars: [number, number][] = [];
  let x = 10;
  for (const v of code128cSymbols(d)) {
    const p = C128[v];
    for (let i = 0; i < p.length; i++) {
      const w = Number(p[i]);
      if (i % 2 === 0) bars.push([x, w]);
      x += w;
    }
  }
  return { bars, width: x + 10 };
}
