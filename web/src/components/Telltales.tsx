/**
 * Indicadores luminosos (telltales) no estilo ISO 2575, desenhados em SVG.
 * Cada indicador acende conforme o estado recebido do jogo; `null` = N/D.
 */
import type { AuxLightLevel, LightsData } from '../../../shared/types';

type LampState = boolean | null | undefined;

const COLORS = {
  green: 'var(--tp-ok)',
  blue: 'var(--tp-info)',
  amber: 'var(--tp-warn)',
  red: 'var(--tp-crit)',
  white: 'var(--tp-text)',
};

const BEAM_LINES = (x0: number, slant: number) =>
  [5, 9, 13, 17].map((y) => <line key={y} x1={x0} y1={y} x2={x0 - 6} y2={y + slant} strokeLinecap="round" />);

const ICONS: Record<string, JSX.Element> = {
  parking: (
    <g strokeWidth={1.6} fill="none">
      <path d="M8 6a5 5 0 0 0 0 10" />
      <path d="M16 6a5 5 0 0 1 0 10" />
      {[3, 8, 13].map((y) => (
        <g key={y}>
          <line x1={1} y1={y + 2} x2={4.5} y2={y + 2} />
          <line x1={19.5} y1={y + 2} x2={23} y2={y + 2} />
        </g>
      ))}
    </g>
  ),
  lowBeam: (
    <g strokeWidth={1.7} fill="none">
      <path d="M14 4c4 0 7 3 7 7s-3 7-7 7c-1.5 0-2-3-2-7s.5-7 2-7z" />
      {BEAM_LINES(9, 3)}
    </g>
  ),
  highBeam: (
    <g strokeWidth={1.7} fill="none">
      <path d="M14 4c4 0 7 3 7 7s-3 7-7 7c-1.5 0-2-3-2-7s.5-7 2-7z" />
      {[5, 9, 13, 17].map((y) => (
        <line key={y} x1={9} y1={y} x2={2} y2={y} strokeLinecap="round" />
      ))}
    </g>
  ),
  auxFront: (
    <g strokeWidth={1.7} fill="none">
      <path d="M10 5c4 0 7 3 7 6s-3 6-7 6c-1.3 0-1.7-2.5-1.7-6S8.7 5 10 5z" />
      {[6, 11, 16].map((y) => (
        <line key={y} x1={6} y1={y} x2={1} y2={y + 2} strokeLinecap="round" />
      ))}
      <path d="M20 4v14" strokeDasharray="2 2" />
    </g>
  ),
  auxRoof: (
    <g strokeWidth={1.7} fill="none">
      <rect x={3} y={13} width={18} height={6} rx={1.5} />
      {[6, 10, 14, 18].map((x) => (
        <circle key={x} cx={x} cy={16} r={1.2} fill="currentColor" />
      ))}
      {[6, 12, 18].map((x) => (
        <line key={x} x1={x} y1={10} x2={x} y2={4} strokeLinecap="round" />
      ))}
    </g>
  ),
  blinkerLeft: <path d="M2 11 L10 4 V8 H21 V14 H10 V18 Z" fill="currentColor" />,
  blinkerRight: <path d="M22 11 L14 4 V8 H3 V14 H14 V18 Z" fill="currentColor" />,
  hazard: (
    <g fill="none" strokeWidth={2} strokeLinejoin="round">
      <path d="M12 2 L22.5 20 H1.5 Z" />
      <path d="M12 9 L17 17.5 H7 Z" />
    </g>
  ),
  brake: (
    <g fill="none" strokeWidth={1.8}>
      <circle cx={12} cy={11} r={6} />
      <path d="M5 4a10 10 0 0 0 0 14M19 4a10 10 0 0 1 0 14" />
      <line x1={12} y1={7.5} x2={12} y2={11.5} strokeLinecap="round" />
      <circle cx={12} cy={14} r={0.9} fill="currentColor" />
    </g>
  ),
  reverse: (
    <g fill="none" strokeWidth={1.8}>
      <rect x={4} y={4} width={16} height={14} rx={2} />
      <text x={12} y={15} fontSize={10} textAnchor="middle" fill="currentColor" stroke="none" fontWeight={700}>
        R
      </text>
    </g>
  ),
  beacon: (
    <g fill="none" strokeWidth={1.8}>
      <path d="M7 18v-5a5 5 0 0 1 10 0v5" />
      <line x1={4} y1={19} x2={20} y2={19} strokeLinecap="round" />
      <path d="M12 2v3M4.5 5.5l2 2M19.5 5.5l-2 2M2 12h2.5M19.5 12H22" strokeLinecap="round" />
    </g>
  ),
  dashboard: (
    <g fill="none" strokeWidth={1.8}>
      <path d="M3 16a9 9 0 0 1 18 0" />
      <path d="M12 16l4-5" strokeLinecap="round" />
      <circle cx={12} cy={16} r={1.2} fill="currentColor" />
    </g>
  ),
  wipers: (
    <g fill="none" strokeWidth={1.8} strokeLinecap="round">
      <path d="M3 17c3-9 15-9 18 0" />
      <path d="M12 18 L7 8" />
      <path d="M10 13l-3 1M9 10.5l-3 1" />
    </g>
  ),
  parkBrake: (
    <g fill="none" strokeWidth={1.8}>
      <circle cx={12} cy={11} r={6} />
      <path d="M5 4a10 10 0 0 0 0 14M19 4a10 10 0 0 1 0 14" />
      <text x={12} y={14.5} fontSize={9} textAnchor="middle" fill="currentColor" stroke="none" fontWeight={700}>
        P
      </text>
    </g>
  ),
  engineBrake: (
    <g fill="none" strokeWidth={1.8}>
      <rect x={5} y={7} width={14} height={9} rx={1.5} />
      <path d="M8 7V4h8v3M2 11h3M19 11h3" />
      <path d="M9 19h6" strokeLinecap="round" />
    </g>
  ),
  retarder: (
    <g fill="none" strokeWidth={1.8}>
      <circle cx={12} cy={11} r={7} />
      <path d="M9 8v6M9 8h3a2 2 0 0 1 0 4H9M12 12l3 2" strokeLinecap="round" />
    </g>
  ),
  cruise: (
    <g fill="none" strokeWidth={1.8} strokeLinecap="round">
      <path d="M4 16a8 8 0 1 1 16 0" />
      <path d="M12 16l3-5" />
      <path d="M2 20h20" />
    </g>
  ),
};

export function Telltale({
  icon,
  label,
  on,
  color = 'green',
  detail,
  size = 'md',
  className = '',
}: {
  icon: keyof typeof ICONS;
  label: string;
  on: LampState;
  color?: keyof typeof COLORS;
  detail?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const unknown = on === null || on === undefined;
  const c = COLORS[color];
  const status = unknown ? 'N/D' : on ? 'ligado' : 'desligado';
  return (
    <div
      className={`relative flex min-w-0 flex-col items-center justify-center gap-[3px] overflow-hidden px-0.5 ${size === 'sm' ? 'h-[52px]' : 'h-12 sm:h-14'} ${className}`}
      style={{ background: on ? `color-mix(in srgb, ${c} 12%, var(--tp-panel))` : 'var(--tp-panel)' }}
      title={`${label}: ${status}${detail ? ` (${detail})` : ''}`}
      data-testid={`telltale-${icon}`}
      data-state={unknown ? 'nd' : on ? 'on' : 'off'}
      aria-label={`${label}: ${status}`}
      role="img"
    >
      <svg
        viewBox="0 0 24 22"
        className="h-[22px] w-6 shrink-0"
        stroke="currentColor"
        style={{
          color: on ? c : 'var(--tp-dim)',
          opacity: unknown ? 0.2 : on ? 1 : 0.45,
          transition: 'color 80ms linear, opacity 80ms linear',
        }}
        aria-hidden
      >
        {ICONS[icon]}
      </svg>
      <span className={`font-cond max-w-full truncate text-center text-[10px] leading-[11px] font-medium uppercase tracking-[0.06em] ${on ? 'text-text' : 'text-dim'}`}>{label}</span>
      {detail && <span className="digits text-[9px] leading-[9px] text-muted">{detail}</span>}
      {unknown && <b className="digits absolute top-[3px] right-1 text-[8px] leading-none font-normal text-dim">N/D</b>}
    </div>
  );
}

const auxLabel = (v: AuxLightLevel | null) => (v === null ? 'N/D' : v === 0 ? 'desl.' : v === 1 ? 'reduzido' : 'máximo');

/** Régua de 12 indicadores luminosos (células encostadas separadas por fio de 1 px). */
export function LightingPanel({ lights, compact = false, cols }: { lights: LightsData; compact?: boolean; cols?: string }) {
  const size = 'md';
  const grid = cols ?? (compact ? 'grid-cols-6 md:grid-cols-12' : 'grid-cols-4 sm:grid-cols-6 xl:grid-cols-12');
  return (
    <div className={`grid gap-px bg-line ${grid}`} data-testid="lighting-panel">
      <Telltale size={size} icon="blinkerLeft" label="Pisca esq." on={lights.blinkerLeftOn} color="green" />
      <Telltale size={size} icon="hazard" label="Alerta" on={lights.hazard === null ? null : lights.hazard && (lights.blinkerLeftOn || lights.blinkerRightOn || false)} color="red" detail={compact ? undefined : lights.hazard ? 'ativo' : undefined} />
      <Telltale size={size} icon="blinkerRight" label="Pisca dir." on={lights.blinkerRightOn} color="green" />
      <Telltale size={size} icon="parking" label="Posição" on={lights.parking} color="green" />
      <Telltale size={size} icon="lowBeam" label="Farol baixo" on={lights.lowBeam} color="green" />
      <Telltale size={size} icon="highBeam" label="Farol alto" on={lights.highBeam} color="blue" />
      <Telltale size={size} icon="auxFront" label="Aux. diant." on={lights.auxFront === null ? null : lights.auxFront > 0} color="green" detail={compact ? undefined : auxLabel(lights.auxFront)} />
      <Telltale size={size} icon="auxRoof" label="Aux. teto" on={lights.auxRoof === null ? null : lights.auxRoof > 0} color="amber" detail={compact ? undefined : auxLabel(lights.auxRoof)} />
      <Telltale size={size} icon="brake" label="Freio" on={lights.brake} color="red" />
      <Telltale size={size} icon="reverse" label="Ré" on={lights.reverse} color="white" />
      <Telltale size={size} icon="beacon" label="Giroflex" on={lights.beacon} color="amber" />
      <Telltale
        size={size}
        icon="dashboard"
        label="Painel"
        on={lights.dashboardBacklight === null ? null : lights.dashboardBacklight > 0.01}
        color="blue"
        detail={lights.dashboardBacklight === null || lights.dashboardBacklight <= 0.01 ? undefined : `${Math.round(lights.dashboardBacklight * 100)}%`}
      />
    </div>
  );
}
