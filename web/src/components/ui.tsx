/**
 * Primitivas visuais "instrumento de frota" (DESIGN-SPEC §4.1).
 * Painéis retos, fios de 1 px, rótulos condensados em caixa-alta e números
 * em B612 Mono. Nada de sombra, gradiente ou brilho.
 */
import { motion } from 'framer-motion';
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { ND, isNum } from '../lib/format';

export type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'crit' | 'off';

export const toneText: Record<Tone, string> = {
  neutral: 'text-text',
  accent: 'text-accent',
  ok: 'text-ok',
  warn: 'text-warn',
  crit: 'text-crit',
  off: 'text-dim',
};
export const toneBg: Record<Tone, string> = {
  neutral: 'bg-muted',
  accent: 'bg-accent',
  ok: 'bg-ok',
  warn: 'bg-warn',
  crit: 'bg-crit',
  off: 'bg-dim',
};
export const toneVar: Record<Tone, string> = {
  neutral: 'var(--tp-muted)',
  accent: 'var(--tp-accent)',
  ok: 'var(--tp-ok)',
  warn: 'var(--tp-warn)',
  crit: 'var(--tp-crit)',
  off: 'var(--tp-dim)',
};

const SEP_RE = /(?<=\d)([,:.])(?=\d)/;

/**
 * Número com separadores "colados": na B612 Mono a vírgula, o ponto e os
 * dois-pontos ocupam uma célula inteira ("31, 4"); envolvemos o separador
 * entre dígitos em `.sep` (margem negativa).
 */
export function Num({ value, className }: { value: ReactNode; className?: string }) {
  if (typeof value !== 'string' && typeof value !== 'number') return <>{value}</>;
  const parts = String(value).split(SEP_RE);
  const body =
    parts.length === 1
      ? parts[0]
      : parts.map((p, i) => (i % 2 === 1 ? <span key={i} className="sep">{p}</span> : <Fragment key={i}>{p}</Fragment>));
  return className ? <span className={className}>{body}</span> : <>{body}</>;
}

/** Variante para `<text>` de SVG: usa `<tspan dx>` em vez de span. */
export function svgNum(value: string, fontSize: number): ReactNode {
  const parts = value.split(SEP_RE);
  if (parts.length === 1) return value;
  const d = -0.24 * fontSize;
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <tspan key={i} dx={d}>
        {p}
      </tspan>
    ) : (
      <tspan key={i} dx={i === 0 ? 0 : d}>
        {p}
      </tspan>
    ),
  );
}

/** LED quadrado 6×6 (não bolinha). */
export function Led({ tone = 'ok', blink = false, color }: { tone?: Tone; blink?: boolean; color?: string }) {
  return <span className={`tp-led${blink ? ' tp-blink' : ''}`} style={{ '--c': color ?? toneVar[tone] } as CSSProperties} aria-hidden />;
}

/** Módulo do "rack": painel reto, cabeçalho de 32 px com título, código e ação. */
export function Card({
  title,
  code,
  icon: _icon,
  action,
  children,
  className = '',
  bodyClass = '',
  pad = true,
  testId,
}: {
  title?: ReactNode;
  /** Código do painel (ex.: "P-01"), em mono à direita do título. */
  code?: string;
  /** Aceito por compatibilidade, mas não é renderizado (painéis não têm ícone). */
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClass?: string;
  pad?: boolean;
  testId?: string;
}) {
  return (
    <section className={`min-w-0 bg-panel ${className}`} data-testid={testId}>
      {title && (
        <header className="flex min-h-8 items-center gap-2.5 border-b border-line px-3">
          <h2 className="tp-title truncate">{title}</h2>
          {code && <span className="digits shrink-0 text-[10px] text-dim">{code}</span>}
          {action && <div className="ml-auto flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={`${pad ? 'p-2.5 sm:p-3' : ''} ${bodyClass}`}>{children}</div>
    </section>
  );
}

/** Cabeçalho de página: título condensado + ações. */
export function PageHeader({ title, code, children }: { title: ReactNode; code?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-panel px-3 py-2.5">
      <h1 className="tp-page-title">{title}</h1>
      {code && <span className="digits text-[10px] text-dim">{code}</span>}
      {children && <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Valor com rótulo. Mostra "N/D" quando o dado não existe, com explicação no hover. */
export function Stat({
  label,
  value,
  unit,
  tone = 'neutral',
  hint,
  big = false,
  ndReason,
  className = '',
}: {
  label: ReactNode;
  value: string | null | undefined;
  unit?: string;
  tone?: Tone;
  hint?: ReactNode;
  big?: boolean;
  ndReason?: string;
  className?: string;
}) {
  const missing = value === null || value === undefined || value === ND;
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="tp-label truncate">{label}</div>
      <div className={`digits flex items-baseline ${big ? 'text-[34px] leading-[38px]' : 'text-[15px] leading-5'} ${missing ? '' : toneText[tone]}`}>
        {missing ? (
          <span className="tp-nd" title={ndReason ?? 'Dado não disponível no momento'}>
            {ND}
          </span>
        ) : (
          <span className="truncate">
            <Num value={value} />
          </span>
        )}
        {!missing && unit && <span className="tp-unit shrink-0">{unit}</span>}
      </div>
      {hint && <div className="truncate text-[11px] leading-4 text-dim">{hint}</div>}
    </div>
  );
}

/** Escala linear graduada (trilho 8 px + régua de 5 marcações). */
export function Meter({
  value,
  max = 1,
  tone = 'accent',
  label,
  right,
  height = 'h-2',
  markers = [],
  segments,
  ticks = true,
}: {
  value: number | null | undefined;
  max?: number;
  tone?: Tone;
  label?: ReactNode;
  right?: ReactNode;
  height?: string;
  markers?: number[];
  /** Barra segmentada (ex.: 20 segmentos no combustível). */
  segments?: number;
  ticks?: boolean;
}) {
  const ratio = isNum(value) ? Math.max(0, Math.min(1, value / max)) : null;
  const marks = markers.filter((m) => isNum(m) && m >= 0 && m <= max);
  return (
    <div className="min-w-0">
      {(label || right !== undefined) && (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="tp-label truncate">{label}</span>
          <span className="digits shrink-0 text-[13px] leading-4">{typeof right === 'string' ? <Num value={right} /> : right}</span>
        </div>
      )}
      <div className="relative">
        {segments ? (
          <div
            className="grid gap-px border border-line bg-inset p-px"
            style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))`, height: height === 'h-2' ? 22 : undefined }}
            role="meter"
            aria-valuenow={isNum(value) ? value : undefined}
            aria-valuemax={max}
          >
            {Array.from({ length: segments }, (_, i) => {
              const lit = ratio !== null && (i + 0.5) / segments <= ratio;
              return <i key={i} className={lit ? toneBg[tone] : 'bg-panel-2'} />;
            })}
          </div>
        ) : (
          <div className={`relative ${height} border border-line bg-inset`}>
            {ratio !== null && (
              <motion.div
                className={`absolute inset-y-0 left-0 ${toneBg[tone]}`}
                initial={false}
                animate={{ width: `${ratio * 100}%` }}
                transition={{ type: 'tween', ease: 'linear', duration: 0.25 }}
              />
            )}
          </div>
        )}
        {marks.map((m) => (
          <div key={m} className="pointer-events-none absolute -top-1 -bottom-px w-px bg-text" style={{ left: `${(m / max) * 100}%` }}>
            <span className="absolute -top-px -left-[3px] border-[3.5px] border-transparent border-t-text" />
          </div>
        ))}
      </div>
      {ticks && (
        <div className="flex h-[3px] justify-between" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} className="w-px bg-line-strong" />
          ))}
        </div>
      )}
    </div>
  );
}

const badgeStyle: Record<Tone, string> = {
  neutral: 'border-line-strong text-muted',
  accent: 'border-accent text-accent bg-accent/12',
  ok: 'border-ok text-ok bg-ok/12',
  warn: 'border-warn text-warn bg-warn/12',
  crit: 'border-crit text-crit bg-crit/12',
  off: 'border-line text-dim',
};

export function Badge({ tone = 'neutral', children, pulse = false }: { tone?: Tone; children: ReactNode; pulse?: boolean }) {
  return (
    <span
      className={`font-cond inline-flex items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-1.5 text-[11px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${badgeStyle[tone]}`}
    >
      {pulse && <Led tone={tone === 'neutral' ? 'off' : tone} blink />}
      {children}
    </span>
  );
}

/** Linha de ficha técnica: `rótulo ········ valor`. */
export function Row({ label, children, title }: { label: ReactNode; children: ReactNode; title?: string }) {
  return (
    <div className="flex min-w-0 items-baseline text-[13px] leading-6" title={title}>
      <span className="shrink-0 text-muted">{label}</span>
      <span className="tp-leader" aria-hidden />
      <span className="digits min-w-0 truncate text-right">
        <Num value={children} />
      </span>
    </div>
  );
}

/** Nota de limitação do SDK (bloco "NOTA"). */
export function Limitation({ children, label = 'Nota' }: { children: ReactNode; label?: string }) {
  return (
    <div className="mt-2.5 border-l-2 border-line-strong py-0.5 pl-2.5 text-xs leading-[17px] text-muted">
      <b className="font-cond block text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">{label}</b>
      {children}
    </div>
  );
}

/** Controle segmentado (abas / alternâncias). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  role = 'tablist',
  className = '',
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, ReactNode][];
  role?: 'tablist' | 'group';
  className?: string;
}) {
  return (
    <div className={`tp-seg ${className}`} role={role}>
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role={role === 'tablist' ? 'tab' : undefined}
          aria-selected={role === 'tablist' ? value === v : undefined}
          aria-pressed={role === 'group' ? value === v : undefined}
          onClick={() => onChange(v)}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function wearTone(v: number | null | undefined, limitPct = 25): Tone {
  if (!isNum(v)) return 'off';
  const p = v * 100;
  if (p >= limitPct * 2) return 'crit';
  if (p >= limitPct) return 'warn';
  return 'ok';
}

/**
 * Contador mecânico (odômetro analógico): dígitos em células com fio entre si e o
 * último dígito (decimal) em célula invertida.
 */
export function Odometer({ value, intDigits = 5, decimals = 1, unit, size = 'md' }: { value: number | null | undefined; intDigits?: number; decimals?: number; unit?: string; size?: 'md' | 'lg' }) {
  const ok = isNum(value) && value >= 0;
  const scaled = ok ? Math.floor(value * 10 ** decimals) : null;
  const total = intDigits + decimals;
  const str = scaled === null ? '' : String(scaled).padStart(total, '0').slice(-total);
  const cell = size === 'lg' ? 'w-[26px] text-[34px] leading-[40px]' : 'w-[22px] text-[28px] leading-[36px]';
  return (
    <div className="flex items-end" title={ok ? undefined : 'Dado não disponível'} role="img" aria-label={ok ? `${value!.toFixed(decimals)} ${unit ?? ''}` : 'N/D'}>
      {Array.from({ length: total }, (_, i) => {
        const dec = i >= intDigits;
        return (
          <span key={i} className={`digits -mr-px border text-center ${cell} ${dec ? 'border-text bg-text text-bg' : 'border-line bg-inset'} ${ok ? '' : 'text-dim'}`}>
            {ok ? str[i] : '–'}
          </span>
        );
      })}
      {unit && <span className="tp-unit ml-2">{unit}</span>}
    </div>
  );
}
