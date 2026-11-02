/**
 * Vista frontal do caminhão — portada de docs/design/trucks/front-master.svg e
 * front-families.svg (caixa 300×410, 96 px = 1 m, solo em y = 400, eixo x = 150).
 * As luzes são controladas pelos dados reais do jogo. Lembrete de orientação:
 * olhando o caminhão de frente, o lado ESQUERDO do caminhão aparece à DIREITA de quem olha.
 */
import { useId, type CSSProperties, type ReactNode } from 'react';
import type { LightsData, WiperData } from '../../../shared/types';
import type { HeadlightShape, VehicleDefinition } from './types';

const CX = 150;

type Family = 'scania' | 'volvo' | 'daf' | 'mb' | 'vw' | 'gen';

export function familyOf(shape: HeadlightShape): Family {
  if (shape.startsWith('scania')) return 'scania';
  if (shape.startsWith('volvo')) return 'volvo';
  if (shape.startsWith('daf')) return 'daf';
  if (shape.startsWith('actros')) return 'mb';
  if (shape === 'meteor') return 'vw';
  return 'gen';
}

interface HeadlightGeom {
  lens: string;
  blinker: { x: number; y: number; w: number; h: number };
  low: { cx: number; cy: number; r: number };
  high: { cx: number; cy: number; r: number };
  drl: string;
}

/** Formas dos faróis por família (front-families.svg, ids hl-*). x = 0 é a borda externa. */
const HEADLIGHTS: Record<Family, HeadlightGeom> = {
  scania: {
    lens: 'M 0 4 Q 0 0 4 0 L 60 0 Q 66 0 66 6 L 62 24 L 4 24 Q 0 24 0 20 Z',
    blinker: { x: 2, y: 4, w: 9, h: 16 },
    low: { cx: 24, cy: 13, r: 7 },
    high: { cx: 44, cy: 13, r: 7 },
    drl: 'M 14 1.5 H 60 V 4.1 H 14 Z',
  },
  volvo: {
    lens: 'M 0 4 L 60 0 Q 68 0 66 8 L 44 40 H 6 Q 0 40 0 34 Z',
    blinker: { x: 14, y: 31, w: 20, h: 6 },
    low: { cx: 22, cy: 22, r: 7 },
    high: { cx: 40, cy: 14, r: 5.5 },
    drl: 'M 6 6 L 58 3 L 58 7 L 10 10 L 10 34 L 6 34 Z',
  },
  daf: {
    lens: 'M 0 0 H 58 L 70 22 H 4 Q 0 22 0 18 Z',
    blinker: { x: 2, y: 3, w: 8, h: 13 },
    low: { cx: 22, cy: 10, r: 6 },
    high: { cx: 40, cy: 10, r: 6 },
    drl: 'M 8 17 H 62 L 63.5 19.5 H 8 Z',
  },
  mb: {
    lens: 'M 0 10 Q 30 -4 70 4 V 28 Q 70 32 66 32 H 4 Q 0 32 0 28 Z',
    blinker: { x: 2, y: 16, w: 8, h: 12 },
    low: { cx: 24, cy: 20, r: 7 },
    high: { cx: 46, cy: 20, r: 7 },
    drl: 'M 4 9 Q 30 -2 66 5 V 8.5 Q 30 1.5 4 12.5 Z',
  },
  vw: {
    lens: 'M 3 0 H 67 Q 70 0 70 3 V 23 Q 70 26 67 26 H 3 Q 0 26 0 23 V 3 Q 0 0 3 0 Z',
    blinker: { x: 2, y: 3, w: 10, h: 20 },
    low: { cx: 26, cy: 13, r: 7 },
    high: { cx: 46, cy: 13, r: 7 },
    drl: 'M 58 4 H 66 V 22 H 58 Z',
  },
  gen: {
    lens: 'M 5 0 H 59 Q 64 0 64 5 V 21 Q 64 26 59 26 H 5 Q 0 26 0 21 V 5 Q 0 0 5 0 Z',
    blinker: { x: 3, y: 5, w: 9, h: 16 },
    low: { cx: 26, cy: 13, r: 7 },
    high: { cx: 46, cy: 13, r: 7 },
    drl: 'M 16 1.6 H 56 V 3.8 H 16 Z',
  },
};

/** Mantido por compatibilidade: contorno da lente do farol de cada forma (coordenadas locais). */
export function headlightPath(shape: HeadlightShape): string {
  return HEADLIGHTS[familyOf(shape)].lens;
}

function cls(base: string, on: boolean | null | undefined, extra = '') {
  return `${base} tp-lamp${on ? ' on' : ''}${extra ? ' ' + extra : ''}`;
}

function Grille({ v, u }: { v: VehicleDefinition; u: (s: string) => string }) {
  const g = v.front.grille;
  const fam = familyOf(v.front.headlight.shape);
  const x0 = g.inset;
  const x1 = 300 - g.inset;
  const xb0 = g.insetBottom ?? x0;
  const xb1 = 300 - xb0;
  const outline = `M ${x0} ${g.top} L ${x1} ${g.top} L ${xb1} ${g.bottom} L ${xb0} ${g.bottom} Z`;
  const out: ReactNode[] = [];
  const band = g.logoBand ? 14 : 0;
  const innerTop = g.top + (band ? band + 4 : 0);
  const h = g.bottom - innerTop;

  if (fam === 'scania' || g.style === 'horizontal-bars') {
    // fundo + lamelas finas (pintura) ou barras metálicas (Mercedes)
    out.push(<path key="bg" d={outline} className="t-plastic-2" />);
    out.push(<rect key="hole" x={x0 + 4} y={innerTop} width={x1 - x0 - 8} height={g.bottom - innerTop - 3} className="t-ink" />);
    const metal = fam === 'mb';
    const thick = metal ? 7 : 4;
    for (let i = 0; i < g.bars; i++) {
      const yy = g.bars === 1 ? innerTop + h / 2 : innerTop + 5 + ((h - 10 - thick) * i) / (g.bars - 1);
      out.push(<rect key={`b${i}`} x={x0 + 2} y={yy} width={x1 - x0 - 4} height={thick} className={metal ? 't-metal' : 't-paint'} />);
      out.push(<rect key={`s${i}`} x={x0 + 2} y={yy + thick - 1} width={x1 - x0 - 4} height={1} className="t-shade-2" />);
    }
  } else if (g.style === 'wide-bars') {
    out.push(<path key="bg" d={outline} className="t-ink" />);
    const metal = fam === 'mb';
    const thick = metal ? 10 : 11;
    for (let i = 0; i < g.bars; i++) {
      const yy = innerTop + 8 + ((h - 16 - thick) * i) / Math.max(1, g.bars - 1);
      out.push(<rect key={`b${i}`} x={x0 + 2} y={yy} width={x1 - x0 - 4} height={thick} className={metal ? 't-metal' : 't-paint'} />);
      out.push(<rect key={`s${i}`} x={x0 + 2} y={yy + thick - 1} width={x1 - x0 - 4} height={1} className="t-shade-2" />);
    }
  } else if (g.style === 'diagonal') {
    out.push(<path key="bg" d={outline} className="t-ink" />);
    const n = Math.max(1, g.bars);
    for (let i = 0; i < n; i++) {
      const yy = g.top + 8 + ((h - 14) * i) / n;
      const t = (yy - g.top) / (g.bottom - g.top);
      const l = x0 + (xb0 - x0) * t + 4;
      out.push(<rect key={`b${i}`} x={l} y={yy} width={300 - 2 * l} height={5} className="t-paint" />);
      out.push(<rect key={`s${i}`} x={l} y={yy + 4} width={300 - 2 * l} height={1} className="t-shade-2" />);
    }
    out.push(<path key="diag" d={`M ${x0 + 16} ${g.bottom - 4} L ${x1 - 20} ${g.top + 2} L ${x1 - 14} ${g.top + 8} L ${x0 + 22} ${g.bottom + 2} Z`} className="t-metal-lt" />);
  } else {
    // mesh (colmeia DAF)
    out.push(<path key="bg" d={outline} className="t-ink" />);
    out.push(<path key="hex" d={`M ${x0} ${innerTop} L ${x1} ${innerTop} L ${xb1} ${g.bottom} L ${xb0} ${g.bottom} Z`} fill={`url(#${u('hex')})`} />);
    for (let i = 0; i < g.bars; i++) {
      const yy = innerTop + 10 + ((h - 20) * i) / Math.max(1, g.bars - 1);
      const t = (yy - g.top) / (g.bottom - g.top);
      const l = x0 + (xb0 - x0) * t + 2;
      out.push(<rect key={`b${i}`} x={l} y={yy} width={300 - 2 * l} height={4} className="t-metal" />);
    }
  }
  if (band) {
    out.push(<rect key="band" x={x0 + 2} y={g.top + 2} width={x1 - x0 - 4} height={band} className={g.logoBand === 'metal' ? 't-metal-lt' : 't-plastic'} />);
  }
  if (g.emblem === 'ring') {
    const cy = (g.top + g.bottom) / 2;
    out.push(<circle key="em" cx={CX} cy={cy} r={10} className="t-ink" stroke="var(--truck-metal-lt)" strokeWidth={3} />);
  } else if (g.emblem === 'disc') {
    const cy = (innerTop + g.bottom) / 2;
    const r = fam === 'mb' ? 18 : 14;
    out.push(<circle key="em" cx={CX} cy={cy} r={r} className={fam === 'mb' ? 't-paint' : 't-ink'} stroke="var(--truck-metal-lt)" strokeWidth={3} />);
    if (fam === 'mb') out.push(<circle key="em2" cx={CX} cy={cy} r={11} fill="none" stroke="var(--truck-metal)" strokeWidth={2} />);
  }
  out.push(<path key="seam" d={outline} className="t-seam" />);
  const logo = v.front.logo;
  return (
    <g data-part="grille">
      {out}
      {logo.text && (
        <text x={CX} y={logo.y} textAnchor="middle" className="t-logo" style={g.logoBand === 'metal' ? { fill: 'var(--truck-ink)' } : undefined}>
          {logo.text}
        </text>
      )}
    </g>
  );
}

export function TruckFront({
  vehicle,
  lights,
  wipers,
  className = '',
}: {
  vehicle: VehicleDefinition;
  lights: LightsData;
  wipers?: WiperData;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const u = (s: string) => `${s}-${uid}`;
  const f = vehicle.front;
  const ws = f.windshield;
  const hl = f.headlight;
  const geo = HEADLIGHTS[familyOf(hl.shape)];
  const low = !!lights.lowBeam;
  const high = !!lights.highBeam;
  const auxLevel = lights.auxFront ?? 0;
  const roofLevel = lights.auxRoof ?? 0;
  const ry = f.roofY;
  const bt = f.bumper.top;
  const wt = ws.top;
  const wb = ws.bottom;
  const r = Math.max(4, ws.radius);
  const wsPath = `M ${46 + r} ${wt} L ${254 - r} ${wt} Q 254 ${wt} 254 ${wt + r} L 258 ${wb - r} Q 258 ${wb} ${258 - r} ${wb} L ${42 + r} ${wb} Q 42 ${wb} 42 ${wb - r} L 46 ${wt + r} Q 46 ${wt} ${46 + r} ${wt} Z`;
  const shell = `M 32 ${bt} L 32 200 L 40 ${ry + 22} Q 42 ${ry} 62 ${ry} L 238 ${ry} Q 258 ${ry} 260 ${ry + 22} L 268 200 L 268 ${bt} Z`;
  const wiperOn = !!wipers?.on;

  // farol: lado do observador → lado do caminhão
  const headlamp = (side: 'viewerLeft' | 'viewerRight') => {
    const truckSide = side === 'viewerLeft' ? 'right' : 'left';
    const blinkOn = truckSide === 'left' ? lights.blinkerLeftOn : lights.blinkerRightOn;
    const transform = side === 'viewerLeft' ? `translate(${hl.inset} ${hl.y})` : `translate(${300 - hl.inset} ${hl.y}) scale(-1 1)`;
    const b = geo.blinker;
    return (
      <g transform={transform} data-side={truckSide}>
        <path d={geo.lens} className="t-lens-clear" stroke="var(--truck-metal-dk)" />
        <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="1" className="t-lens-amber" />
        <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="1" className={cls('t-lit-amber', blinkOn)} data-lamp={`blinker-${truckSide}`} />
        <circle cx={geo.low.cx} cy={geo.low.cy} r={geo.low.r + 1.5} className="t-metal-dk" />
        <circle cx={geo.low.cx} cy={geo.low.cy} r={geo.low.r} className={cls('t-lit-xenon', low || high)} data-lamp="lowBeam" />
        <circle cx={geo.high.cx} cy={geo.high.cy} r={geo.high.r + 1.5} className="t-metal-dk" />
        <circle cx={geo.high.cx} cy={geo.high.cy} r={geo.high.r} className={cls('t-lit-xenon', high)} data-lamp="highBeam" />
        <path d={f.signature ?? geo.drl} className={cls('t-lit-white', lights.parking)} data-lamp="parking" />
      </g>
    );
  };

  const mirror = (
    <>
      <line x1="34" y1={wt + 26} x2="16" y2={wt + 18} stroke="var(--truck-plastic)" strokeWidth="4" />
      <line x1="32" y1={wt + 96} x2="16" y2={wt + 102} stroke="var(--truck-plastic)" strokeWidth="4" />
      <rect x="2" y={wt + 4} width="18" height="64" rx="3" className="t-plastic" />
      <rect x="5" y={wt + 8} width="12" height="56" rx="1.5" className="t-glass" />
      <path d={`M 7 ${wt + 10} L 12 ${wt + 10} L 7 ${wt + 38} Z`} className="t-glass-hi" />
      <rect x="3" y={wt + 74} width="16" height="30" rx="3" className="t-plastic" />
      <rect x="6" y={wt + 77} width="10" height="24" rx="1.5" className="t-glass" />
    </>
  );

  const wiper = (px: number) => (
    <g className={`tp-wiper-f${wiperOn ? ' on' : ''}`} style={{ transformOrigin: `${px}px ${wb + 3}px` } as CSSProperties} data-lamp="wipers">
      <line x1={px} y1={wb + 3} x2={px - 36} y2={wb - 4} stroke="var(--truck-ink)" strokeWidth="3" strokeLinecap="round" />
      <line x1={px - 58} y1={wb - 5} x2={px} y2={wb - 5} stroke="var(--truck-ink)" strokeWidth="2" />
      <circle cx={px} cy={wb + 3} r="2.5" className="t-metal-dk" />
    </g>
  );

  return (
    <svg
      viewBox="0 0 300 410"
      className={className}
      role="img"
      aria-label={`${vehicle.label} — vista frontal`}
      data-testid="truck-front"
      data-model={vehicle.key}
      style={{ '--truck-paint': vehicle.paint } as CSSProperties}
    >
      <defs>
        <pattern id={u('hex')} width="9" height="15.6" patternUnits="userSpaceOnUse">
          <path d="M0 2.6 4.5 0 9 2.6 9 5.2 4.5 7.8 0 5.2Z M4.5 7.8V10.4M0 13 4.5 10.4 9 13" fill="none" stroke="var(--truck-plastic-2)" strokeWidth="1.2" />
        </pattern>
        <clipPath id={u('ws')}>
          <path d={wsPath} />
        </clipPath>
      </defs>

      {/* solo e feixe */}
      <line x1="0" y1="400" x2="300" y2="400" className="t-ground" />
      <g className={`tp-beam${low || high ? ' on' : ''}`} data-lamp="beam">
        <path className="t-beam" opacity=".07" d={high ? 'M 4 400 L 296 400 L 300 406 L 0 406 Z' : 'M 20 400 L 280 400 L 268 405 L 32 405 Z'} />
        <path className="t-beam" opacity=".12" d="M 60 400 L 240 400 L 232 403 L 68 403 Z" />
      </g>

      {/* pneus + eixo */}
      <rect x="67" y="368" width="166" height="8" className="t-chassis" />
      <ellipse cx="52" cy="400" rx="20" ry="2" className="t-ink" opacity=".5" />
      <ellipse cx="248" cy="400" rx="20" ry="2" className="t-ink" opacity=".5" />
      {[37, 233].map((x) => (
        <g key={x} transform={`translate(${x} 360)`}>
          <rect x="0" y="0" width="30" height="40" rx="5" className="t-rubber t-out" />
          <rect x="1" y="0" width="28" height="40" rx="4" fill="none" stroke="#fff" strokeOpacity=".06" />
          <g stroke="#000" strokeOpacity=".75" strokeWidth="1.8" fill="none">
            <path d="M 8 6 l 1 4 l -1 4 l 1 4 l -1 4 l 1 4 l -1 4 l 1 4 l -1 4" />
            <path d="M 15 6 l 1 4 l -1 4 l 1 4 l -1 4 l 1 4 l -1 4 l 1 4 l -1 4" />
            <path d="M 22 6 l 1 4 l -1 4 l 1 4 l -1 4 l 1 4 l -1 4 l 1 4 l -1 4" />
          </g>
          <path d="M 2 12 H 7 M 10 16 H 14 M 17 12 H 21 M 24 16 H 28 M 2 24 H 7 M 10 28 H 14 M 17 24 H 21 M 24 28 H 28 M 2 36 H 7 M 17 36 H 21" stroke="#000" strokeOpacity=".35" strokeWidth="1" />
        </g>
      ))}

      {/* espelhos */}
      <g>{mirror}</g>
      <g transform="translate(300 0) scale(-1 1)">{mirror}</g>

      {/* defletores de canto (coluna A) */}
      {[0, 1].map((i) => {
        const d = i === 0 ? `M 32 200 L 40 ${ry + 34} L 34 ${ry + 36} L 26 200 Z` : `M 268 200 L 260 ${ry + 34} L 266 ${ry + 36} L 274 200 Z`;
        return (
          <g key={i}>
            <path d={d} className="t-paint" />
            <path d={d} className="t-shade-2" />
          </g>
        );
      })}

      {/* cabine (casca) */}
      <g data-part="cab">
        <path d={shell} className="t-paint" />
        <path d={`M 44 ${ry + 20} Q 46 ${ry + 4} 62 ${ry + 4} L 238 ${ry + 4} Q 254 ${ry + 4} 256 ${ry + 20} L 256 ${ry + 26} L 44 ${ry + 26} Z`} className="t-hi" />
        <path d={`M 32 ${bt} L 32 200 L 40 ${ry + 22} L 47 ${ry + 20} L 41 200 L 41 ${bt} Z`} className="t-shade" />
        <path d={`M 268 ${bt} L 268 200 L 260 ${ry + 22} L 253 ${ry + 20} L 259 200 L 259 ${bt} Z`} className="t-shade" />
        <line x1="34" y1={wb + 5} x2="266" y2={wb + 5} className="t-seam-hi" />
        <line x1="34" y1={wb + 6.5} x2="266" y2={wb + 6.5} className="t-seam" />
        <rect x="42" y={wb} width="216" height="6" className="t-shade-2" />
        <line x1="56" y1={wb + 10} x2="56" y2={bt - 2} className="t-seam" />
        <line x1="244" y1={wb + 10} x2="244" y2={bt - 2} className="t-seam" />
      </g>

      {/* para-brisa com interior insinuado */}
      <path d={wsPath} className="t-glass" />
      <g clipPath={`url(#${u('ws')})`}>
        <rect x="186" y={wb - 54} width="36" height="40" rx="4" className="t-ink" opacity=".3" />
        <rect x="78" y={wb - 54} width="36" height="40" rx="4" className="t-ink" opacity=".3" />
        <rect x="42" y={wb - 18} width="216" height="18" className="t-ink" opacity=".35" />
        <ellipse cx="204" cy={wb - 18} rx="22" ry="5" fill="none" stroke="#000" strokeOpacity=".55" strokeWidth="2.5" />
        <path d={`M 66 ${wt} L 104 ${wt} L 76 ${wb} L 38 ${wb} Z`} className="t-glass-hi" />
        <path d={`M 114 ${wt} L 126 ${wt} L 98 ${wb} L 86 ${wb} Z`} className="t-glass-hi" />
      </g>
      <path d={wsPath} fill="none" stroke="#000" strokeOpacity=".7" strokeWidth="2" />

      {/* para-sol */}
      {f.sunVisor && (
        <>
          <path d={`M 44 ${wt - 10} L 256 ${wt - 10} L 252 ${wt + 6} L 48 ${wt + 6} Z`} className="t-plastic" />
          <line x1="48" y1={wt + 5.5} x2="252" y2={wt + 5.5} className="t-seam-hi" />
        </>
      )}
      {/* espelho frontal (classe VI) do lado do passageiro */}
      <line x1="62" y1={wt - 18} x2="64" y2={wt + 8} stroke="var(--truck-plastic)" strokeWidth="2" />
      <rect x="54" y={wt + 8} width="22" height="14" rx="4" className="t-plastic" />

      {/* gabarito do teto (5) */}
      {[59, 125, 145, 165, 231].map((x) => (
        <g key={x}>
          <rect x={x} y={ry + 26} width="10" height="5" rx="1" className="t-lens-clear" />
          <rect x={x} y={ry + 26} width="10" height="5" rx="1" className={cls('t-lit-white', lights.parking)} data-lamp="clearance" />
        </g>
      ))}

      {/* barra de teto com 4 auxiliares (SDK: auxRoof) */}
      <g data-part="roof-bar">
        <rect x="84" y={ry - 3} width="4" height="4" className="t-plastic" />
        <rect x="212" y={ry - 3} width="4" height="4" className="t-plastic" />
        <rect x="72" y={ry - 13} width="156" height="11" rx="1" className="t-plastic" />
        {[92, 128, 172, 208].map((x) => (
          <g key={x}>
            <circle cx={x} cy={ry - 7.5} r="5" className="t-ink" />
            <circle cx={x} cy={ry - 7.5} r="4" className="t-lens-clear" />
            <circle cx={x} cy={ry - 7.5} r="3.8" className={cls('t-lit-white', roofLevel > 0)} style={roofLevel === 1 ? { opacity: 0.55 } : undefined} data-lamp="auxRoof" data-level={roofLevel} />
          </g>
        ))}
      </g>

      {/* giroflex (2) */}
      {[59, 241].map((x) => (
        <g key={x}>
          <rect x={x - 7} y={ry - 6} width="14" height="6" className="t-plastic" />
          <path d={`M ${x - 6} ${ry - 6} Q ${x - 6} ${ry - 18} ${x} ${ry - 18} Q ${x + 6} ${ry - 18} ${x + 6} ${ry - 6} Z`} className="t-lens-amber" />
          <path d={`M ${x - 6} ${ry - 6} Q ${x - 6} ${ry - 18} ${x} ${ry - 18} Q ${x + 6} ${ry - 18} ${x + 6} ${ry - 6} Z`} className={cls('t-lit-amber', lights.beacon, 'tp-beacon')} data-lamp="beacon" />
        </g>
      ))}

      {/* limpadores (pivô na base do para-brisa) */}
      {wiper(104)}
      {wiper(196)}

      {/* grade e logotipo (texto genérico, não é a marca registrada) */}
      <Grille v={vehicle} u={u} />
      {f.extras?.map((d, i) => <path key={i} d={d} fill="none" stroke="#000" strokeOpacity={0.3} />)}

      {/* para-choque */}
      <path d={`M 24 ${bt} L 276 ${bt} L 276 352 Q 276 362 266 362 L 34 362 Q 24 362 24 352 Z`} className="t-plastic-2" />
      <line x1="26" y1={bt + 0.5} x2="274" y2={bt + 0.5} className="t-seam-hi" />
      <rect x="104" y="316" width="92" height="22" rx="1" className="t-ink" />
      <g stroke="var(--truck-plastic-2)" strokeWidth="1.5">
        <line x1="106" y1="322" x2="194" y2="322" />
        <line x1="106" y1="328" x2="194" y2="328" />
        <line x1="106" y1="334" x2="194" y2="334" />
      </g>
      <rect x="122" y="342" width="56" height="12" rx="1" className="t-plate" />
      <rect x="122" y="342" width="6" height="12" className="t-plate-eu" />
      <g className="t-ink" opacity=".75">
        {[133, 140, 149, 156, 163, 170].map((x) => (
          <rect key={x} x={x} y="345" width="5" height="6" />
        ))}
      </g>
      <rect x="30" y="361" width="240" height="6" className="t-plastic" />
      <rect x="144" y="356" width="12" height="6" className="t-metal-dk" />

      {/* auxiliares dianteiros / neblina (SDK: auxFront) */}
      {[54, 246].map((x) => (
        <g key={x}>
          <circle cx={x} cy="340" r="10" className="t-ink" />
          <circle cx={x} cy="340" r="8" className="t-lens-clear" />
          <circle cx={x} cy="340" r="7.5" className={cls('t-lit-white', auxLevel > 0)} style={auxLevel === 1 ? { opacity: 0.55 } : undefined} data-lamp="auxFront" data-level={auxLevel}>
            <title>Aux. dianteiro / neblina</title>
          </circle>
        </g>
      ))}

      {headlamp('viewerLeft')}
      {headlamp('viewerRight')}
    </svg>
  );
}
