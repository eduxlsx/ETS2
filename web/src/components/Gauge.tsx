/**
 * Mostrador com ponteiro (DESIGN-SPEC §4.2): escala graduada de 250°, faixas
 * fora da escala, trilho fino de valor, ponteiro com cubo e janela LCD.
 */
import type { ReactNode } from 'react';
import { isNum } from '../lib/format';
import { svgNum } from './ui';

interface Zone {
  from: number;
  to: number;
  color: string;
}

// ângulos em graus, sentido horário a partir de "12 horas"; abertura de 110° embaixo (LCD)
const START = -125;
const SWEEP = 250;
const CX = 120;
const CY = 120;

export function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Mostrador circular de instrumento. */
export function Gauge({
  value,
  max,
  zones = [],
  marker,
  ticks = 10,
  label,
  center,
  unit,
  sub,
  subTone = 'muted',
  size = 290,
  testId,
  ariaLabel,
}: {
  value: number | null | undefined;
  max: number;
  zones?: Zone[];
  /** Marcação adicional (ex.: limite da via). */
  marker?: number | null;
  ticks?: number;
  label?: (v: number) => string;
  /** Conteúdo da janela LCD (valor digital). */
  center: ReactNode;
  /** Unidade escrita abaixo da janela LCD. */
  unit?: string;
  /** Linha extra abaixo da unidade (ex.: "ACIMA DO LIMITE"). */
  sub?: string;
  subTone?: 'muted' | 'crit';
  size?: number;
  testId?: string;
  ariaLabel?: string;
}) {
  const has = isNum(value);
  const v = has ? Math.max(0, Math.min(max, value)) : 0;
  const angle = (x: number) => START + (Math.max(0, Math.min(max, x)) / max) * SWEEP;
  const majors = Array.from({ length: ticks + 1 }, (_, i) => (i * max) / ticks);
  const minors: number[] = [];
  for (let i = 0; i < ticks; i++) for (let k = 1; k <= 4; k++) minors.push(((i + k / 5) * max) / ticks);
  const needle = angle(v);

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: size, containerType: 'inline-size' }} data-testid={testId}>
      <svg viewBox="0 0 240 240" className="block h-auto w-full" role="img" aria-label={ariaLabel}>
        {/* faixas (fora da escala) */}
        {zones
          .filter((z) => isNum(z.from) && isNum(z.to) && z.to > z.from)
          .map((z, i) => (
            <path key={i} d={arc(CX, CY, 110.5, angle(z.from), angle(z.to))} stroke={z.color} strokeWidth={5} fill="none" />
          ))}
        {/* régua */}
        <path d={arc(CX, CY, 104, START, START + SWEEP)} stroke="var(--tp-line-strong)" strokeWidth={1} fill="none" />
        {minors.map((t, i) => {
          const a = angle(t);
          const p0 = polar(CX, CY, 104, a);
          const p1 = polar(CX, CY, 99, a);
          return <line key={`m${i}`} x1={r2(p0.x)} y1={r2(p0.y)} x2={r2(p1.x)} y2={r2(p1.y)} stroke="var(--tp-dim)" strokeWidth={1} />;
        })}
        {majors.map((t, i) => {
          const a = angle(t);
          const p0 = polar(CX, CY, 104, a);
          const p1 = polar(CX, CY, 93, a);
          const pl = polar(CX, CY, 80, a);
          return (
            <g key={`M${i}`}>
              <line x1={r2(p0.x)} y1={r2(p0.y)} x2={r2(p1.x)} y2={r2(p1.y)} stroke="var(--tp-text)" strokeWidth={1.5} />
              {label && (
                <text x={r2(pl.x)} y={r2(pl.y)} fill="var(--tp-muted)" fontSize={11} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: 'var(--font-mono)' }}>
                  {svgNum(label(t), 11)}
                </text>
              )}
            </g>
          );
        })}
        {/* trilho de valor */}
        <path d={arc(CX, CY, 90, START, START + SWEEP)} stroke="var(--tp-line)" strokeWidth={3} fill="none" />
        {has && v > 0 && <path d={arc(CX, CY, 90, START, needle)} stroke="var(--tp-accent)" strokeWidth={3} fill="none" />}
        {/* marcador (limite da via) */}
        {isNum(marker) && marker > 0 && marker <= max &&
          (() => {
            const a = angle(marker);
            const tip = polar(CX, CY, 104, a);
            const b1 = polar(CX, CY, 114, a - 2.6);
            const b2 = polar(CX, CY, 114, a + 2.6);
            const l1 = polar(CX, CY, 93, a);
            return (
              <g data-testid="gauge-marker">
                <path d={`M ${r2(b1.x)} ${r2(b1.y)} L ${r2(b2.x)} ${r2(b2.y)} L ${r2(tip.x)} ${r2(tip.y)} Z`} fill="var(--tp-crit)" />
                <line x1={r2(tip.x)} y1={r2(tip.y)} x2={r2(l1.x)} y2={r2(l1.y)} stroke="var(--tp-crit)" strokeWidth={1.5} />
              </g>
            );
          })()}
        {/* janela LCD */}
        <rect x={65} y={146} width={110} height={44} fill="var(--tp-inset)" stroke="var(--tp-line)" />
        {unit && (
          <text x={CX} y={206} textAnchor="middle" fill="var(--tp-muted)" fontSize={11} fontWeight={600} letterSpacing="0.12em" style={{ fontFamily: 'var(--font-cond)', textTransform: 'uppercase' }}>
            {unit.toUpperCase()}
          </text>
        )}
        {sub && (
          <text x={CX} y={220} textAnchor="middle" fill={subTone === 'crit' ? 'var(--tp-crit)' : 'var(--tp-muted)'} fontSize={10} fontWeight={600} letterSpacing="0.1em" style={{ fontFamily: 'var(--font-cond)' }}>
            {sub.toUpperCase()}
          </text>
        )}
        {/* ponteiro */}
        <g className="tp-needle" style={{ transform: `rotate(${needle}deg)` }}>
          <line x1={CX} y1={CY + 14} x2={CX} y2={CY - 100} stroke={has ? 'var(--tp-accent)' : 'var(--tp-dim)'} strokeWidth={2.5} />
        </g>
        <circle cx={CX} cy={CY} r={7} fill="var(--tp-panel-2)" stroke="var(--tp-line-strong)" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={2} fill={has ? 'var(--tp-accent)' : 'var(--tp-dim)'} />
      </svg>
      {/* conteúdo digital posicionado sobre a janela LCD */}
      <div className="pointer-events-none absolute flex items-center justify-center overflow-hidden" style={{ left: `${(65 / 240) * 100}%`, width: `${(110 / 240) * 100}%`, top: `${(146 / 240) * 100}%`, height: `${(44 / 240) * 100}%` }}>
        {center}
      </div>
    </div>
  );
}
