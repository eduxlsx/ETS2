/**
 * Peças comuns dos reboques (docs/design/trailers/*.svg).
 */
import type { FC, ReactNode } from 'react';

export interface TrailerLamps {
  parking: boolean;
  brake: boolean;
  blinkerLeftOn: boolean;
  reverse: boolean;
}

export interface TrailerDrawing {
  type: string;
  label: string;
  /** Centro de cada roda de referência (coordenadas locais do desenho), da frente para trás. */
  axles: { refX: number; refY: number; scale: number }[];
  Defs: FC<{ u: (id: string) => string }>;
  /** Tudo que fica atrás das rodas (chassi, carroceria, carga). */
  Body: FC<{ L: TrailerLamps; u: (id: string) => string }>;
  /** Peças desenhadas depois das rodas (para-barro, lanternas, para-choque). */
  Post: FC<{ L: TrailerLamps; u: (id: string) => string }>;
  /** Conjunto de cada eixo (braço, bolsa de ar, roda, para-lama), nas posições de referência. */
  Axle: (() => ReactNode)[];
}

/** Classe de uma luz acesa: `t-lit-* tp-lamp [on]`. */
export function lit(base: string, on: boolean | null | undefined): string {
  return `${base} tp-lamp${on ? ' on' : ''}`;
}

/** Roda "super single" do reboque (centro em 0,0, r = 0,50 m). */
export function TrWheel({ transform }: { transform?: string }) {
  return (
    <g transform={transform}>
      <circle r="50" className="t-rubber t-out" />
      <circle r="49.2" fill="none" stroke="#fff" strokeOpacity=".07" strokeWidth="2.4" strokeDasharray="3.4 2.2" />
      <circle r="37" fill="none" stroke="#000" strokeOpacity=".5" />
      <circle r="29" className="t-metal-dk" /><circle r="27.5" className="t-metal-lt" /><circle r="23" className="t-metal" />
      <circle cx="19.50" cy="0.00" r="2.6" className="t-rubber" /><circle cx="15.78" cy="11.46" r="2.6" className="t-rubber" /><circle cx="6.03" cy="18.55" r="2.6" className="t-rubber" /><circle cx="-6.03" cy="18.55" r="2.6" className="t-rubber" /><circle cx="-15.78" cy="11.46" r="2.6" className="t-rubber" /><circle cx="-19.50" cy="0.00" r="2.6" className="t-rubber" /><circle cx="-15.78" cy="-11.46" r="2.6" className="t-rubber" /><circle cx="-6.03" cy="-18.55" r="2.6" className="t-rubber" /><circle cx="6.03" cy="-18.55" r="2.6" className="t-rubber" /><circle cx="15.78" cy="-11.46" r="2.6" className="t-rubber" />
      <circle r="13.5" className="t-metal-lt" /><circle cx="9.99" cy="3.24" r="1.4" className="t-metal-dk" /><circle cx="6.17" cy="8.49" r="1.4" className="t-metal-dk" /><circle cx="0.00" cy="10.50" r="1.4" className="t-metal-dk" /><circle cx="-6.17" cy="8.49" r="1.4" className="t-metal-dk" /><circle cx="-9.99" cy="3.24" r="1.4" className="t-metal-dk" /><circle cx="-9.99" cy="-3.24" r="1.4" className="t-metal-dk" /><circle cx="-6.17" cy="-8.49" r="1.4" className="t-metal-dk" /><circle cx="-0.00" cy="-10.50" r="1.4" className="t-metal-dk" /><circle cx="6.17" cy="-8.49" r="1.4" className="t-metal-dk" /><circle cx="9.99" cy="-3.24" r="1.4" className="t-metal-dk" />
      <circle r="6.5" className="t-metal-dk" /><circle r="3" className="t-metal-lt" />
      <path d="M -22 -13 A 26 26 0 0 1 -6 -25" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="2" />
    </g>
  );
}
