/**
 * Carimbos em SVG (não imagem) com tinta irregular: feTurbulence (máscara alfa)
 * + feDisplacementMap leve. Azul #1f3f9a (recebido) / vermelho #b3261e (avaria, cancelado).
 */
import { useId, type CSSProperties } from 'react';
import type { DocStamp, SignatureStroke } from '../../../shared/types';

const COLOR = { blue: '#1f3f9a', red: '#b3261e' } as const;

function InkFilter({ id, seed, rect = false }: { id: string; seed: number; rect?: boolean }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency={rect ? 0.85 : 0.9} numOctaves={2} seed={seed} result="n" />
      <feColorMatrix in="n" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${rect ? -2.4 : -2.2} ${rect ? 1.4 : 1.35}`} result="m" />
      <feComposite in="SourceGraphic" in2="m" operator="in" result="c" />
      <feTurbulence type="turbulence" baseFrequency={rect ? 0.03 : 0.035} numOctaves={2} seed={seed + 3} result="w" />
      <feDisplacementMap in="c" in2="w" scale={rect ? 3 : 3.5} />
    </filter>
  );
}

/** Carimbo redondo RECEBIDO (anel duplo com textPath). lines = [topo, centro, data/hora, base] */
export function RoundStamp({ stamp, animate = false }: { stamp: DocStamp; animate?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const c = COLOR[stamp.color];
  const seed = Math.abs(Math.round(stamp.rot * 7)) + 3;
  const [top = '', center = 'RECEBIDO', when = '', sub = ''] = stamp.lines;
  const [day, time] = when.split(' ');
  return (
    <svg className={`stamp${animate ? ' hit' : ''}`} viewBox="0 0 220 220" style={{ '--r0': `${stamp.rot - 9}deg`, '--r1': `${stamp.rot}deg` } as CSSProperties} aria-label={`Carimbo: ${center}`} role="img" data-stamp={stamp.kind}>
      <defs>
        <InkFilter id={`ink${uid}`} seed={seed} />
        <path id={`t${uid}`} d="M 34 110 A 76 76 0 0 1 186 110" />
        <path id={`b${uid}`} d="M 26 110 A 84 84 0 0 0 194 110" />
      </defs>
      <g filter={`url(#ink${uid})`} fill={c} stroke={c}>
        <circle cx="110" cy="110" r="100" fill="none" strokeWidth="6" />
        <circle cx="110" cy="110" r="90" fill="none" strokeWidth="2" />
        <circle cx="110" cy="110" r="56" fill="none" strokeWidth="2" />
        <text fontFamily="Arimo,Arial,sans-serif" fontWeight="700" fontSize={top.length > 26 ? 11 : 15} letterSpacing="2" stroke="none">
          <textPath href={`#t${uid}`} startOffset="50%" textAnchor="middle">
            {top}
          </textPath>
        </text>
        <text fontFamily="Arimo,Arial,sans-serif" fontWeight="700" fontSize="12" letterSpacing="2" stroke="none">
          <textPath href={`#b${uid}`} startOffset="50%" textAnchor="middle" dominantBaseline="hanging">
            {sub}
          </textPath>
        </text>
        <text x="110" y="104" textAnchor="middle" fontFamily="Arimo,Arial,sans-serif" fontWeight="700" fontSize="20" stroke="none">
          {center}
        </text>
        <text x="110" y="126" textAnchor="middle" fontFamily="'Courier Prime',monospace" fontWeight="700" fontSize="14" stroke="none">
          {day}
        </text>
        <text x="110" y="143" textAnchor="middle" fontFamily="'Courier Prime',monospace" fontSize="13" stroke="none">
          {time}
        </text>
        <text x="20" y="116" fontSize="14" stroke="none">
          ★
        </text>
        <text x="188" y="116" fontSize="14" stroke="none">
          ★
        </text>
      </g>
    </svg>
  );
}

/** Carimbo retangular (AVARIA REGISTRADA x % / CANCELADO). */
export function RectStamp({ stamp, animate = false }: { stamp: DocStamp; animate?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const c = COLOR[stamp.color];
  const seed = Math.abs(Math.round(stamp.rot * 5)) + 11;
  const [l1 = '', l2 = ''] = stamp.lines;
  return (
    <svg className={`stamp${animate ? ' hit' : ''}`} viewBox="0 0 300 125" style={{ '--r0': `${-stamp.rot + 6}deg`, '--r1': `${stamp.rot}deg` } as CSSProperties} aria-label={`Carimbo: ${l1} ${l2}`} role="img" data-stamp={stamp.kind}>
      <defs>
        <InkFilter id={`inkr${uid}`} seed={seed} rect />
      </defs>
      <g filter={`url(#inkr${uid})`} fill={c} stroke={c}>
        <rect x="6" y="6" width="288" height="113" fill="none" strokeWidth="7" />
        <rect x="16" y="16" width="268" height="93" fill="none" strokeWidth="2" />
        <text x="150" y="70" textAnchor="middle" fontFamily="Arimo,Arial,sans-serif" fontWeight="700" fontSize={l1.length > 9 ? 32 : 40} letterSpacing="4" stroke="none">
          {l1}
        </text>
        <text x="150" y="96" textAnchor="middle" fontFamily="'Courier Prime',monospace" fontWeight="700" fontSize={l2.length > 28 ? 12 : 15} stroke="none">
          {l2}
        </text>
      </g>
    </svg>
  );
}

export function StampView({ stamp, animate }: { stamp: DocStamp; animate?: boolean }) {
  return stamp.kind === 'received' ? <RoundStamp stamp={stamp} animate={animate} /> : <RectStamp stamp={stamp} animate={animate} />;
}

/** Desenha traços normalizados (0..1) em SVG — redesenha em qualquer tamanho. */
export function SignatureSvg({ strokes, color = 'var(--ink-pen)', aspect = 3 }: { strokes: SignatureStroke[]; color?: string; aspect?: number }) {
  const W = 300;
  const H = W / aspect;
  const scale = 0.55;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="100%" aria-label="Assinatura do recebedor" role="img">
      {strokes.map((st, i) => (
        <g key={i} stroke={color} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {st.slice(1).map((p, j) => {
            const a = st[j];
            return <line key={j} x1={a[0] * W} y1={a[1] * H} x2={p[0] * W} y2={p[1] * H} strokeWidth={p[2] * scale} />;
          })}
        </g>
      ))}
    </svg>
  );
}
