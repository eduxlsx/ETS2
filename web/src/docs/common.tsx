/** Primitivas dos documentos simulados: folha A4, caixas, código de barras, QR, marca d'água. */
import qrcode from 'qrcode-generator';
import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { code128cBars } from '../../../shared/docs/ids';
import type { DataSource } from '../../../shared/types';

export const brl = (v: number | null | undefined) =>
  typeof v === 'number' && Number.isFinite(v) ? 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
export const num = (v: number | null | undefined, d = 2) =>
  typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—';
export const eur = (v: number | null | undefined) =>
  typeof v === 'number' && Number.isFinite(v) ? '€ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—';

export const DISCLAIMER = 'DOCUMENTO SIMULADO — SEM VALOR FISCAL · gerado pelo TRUCKPULSE a partir de um frete do Euro Truck Simulator 2 · empresas e números fictícios';

export function Watermark({ source }: { source?: DataSource }) {
  return (
    <div className={`wm${source === 'demo' ? ' demo' : ''}`} aria-hidden>
      <span>{source === 'demo' ? 'DEMO · NFe' : 'NFEs'}</span>
    </div>
  );
}

export function Disclaimer() {
  return <div className="disc">{DISCLAIMER}</div>;
}

/** Folha A4 escalável (cqw). */
export function Sheet({ children, auto = false, source, testId }: { children: ReactNode; auto?: boolean; source?: DataSource; testId?: string }) {
  return (
    <div className="sheet-wrap">
      <div className={`sheet${auto ? ' auto' : ''}`} data-testid={testId}>
        <Watermark source={source} />
        {children}
      </div>
    </div>
  );
}

/** Caixa rotulada do DANFE. */
export function Bx({ l, v, cls = '', span, style, children }: { l: ReactNode; v?: ReactNode; cls?: string; span?: number; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div className="bx" style={{ ...(span ? { gridColumn: `span ${span}` } : {}), ...style }}>
      <span className="l">{l}</span>
      {v !== undefined && <span className={`v ${cls}`}>{v}</span>}
      {children}
    </div>
  );
}

export function BRow({ cols, children }: { cols: string; children: ReactNode }) {
  return (
    <div className="brow" style={{ gridTemplateColumns: cols }}>
      {children}
    </div>
  );
}

/** Código de barras Code 128-C (implementação própria, sem dependência). */
export function Barcode({ digits, height = 60, label = 'Código de barras da chave de acesso' }: { digits: string; height?: number; label?: string }) {
  const { bars, width } = useMemo(() => code128cBars(digits.replace(/\D/g, '')), [digits]);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" fill="#111" role="img" aria-label={label}>
      {bars.map(([x, w], i) => (
        <rect key={i} x={x} y={0} width={w} height={height} />
      ))}
    </svg>
  );
}

/** QR code local (qrcode-generator). Tinta do papel, não do tema. */
export function DocQr({ text, fg = '#111', bg = 'transparent' }: { text: string; fg?: string; bg?: string }) {
  const { n, path } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { n: count, path: d };
  }, [text]);
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} shapeRendering="crispEdges" role="img" aria-label="QR code de consulta (fictícia)">
      <rect x={-2} y={-2} width={n + 4} height={n + 4} fill={bg} />
      <path d={path} fill={fg} />
    </svg>
  );
}

export const nfmt = (n: number | null | undefined) => (n === null || n === undefined ? '—' : String(n).padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3'));
export const fmtKey = (k: string | null | undefined) => (k ? k.replace(/(\d{4})(?=\d)/g, '$1 ') : '—');
