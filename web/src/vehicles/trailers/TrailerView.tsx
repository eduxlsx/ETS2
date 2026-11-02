/** Desenho lateral do reboque sozinho (página Reboque), em largura total. */
import { useId } from 'react';
import type { LightsData } from '../../../../shared/types';
import { getTrailerDrawing } from './index';

export function TrailerView({ modelKey, lights, className = '' }: { modelKey: string; lights: LightsData; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const u = (id: string) => `${uid}-${id}`;
  const d = getTrailerDrawing(modelKey);
  const L = { parking: !!lights.parking, brake: !!lights.brake, blinkerLeftOn: !!lights.blinkerLeftOn, reverse: !!lights.reverse };
  return (
    <svg viewBox="0 -24 1440 434" className={className} role="img" aria-label={`Reboque ${d.label} — vista lateral`} data-testid="trailer-view" data-type={d.type}>
      <defs>
        <d.Defs u={u} />
      </defs>
      <line x1="0" y1="400" x2="1440" y2="400" className="t-ground" />
      {Array.from({ length: 15 }, (_, i) => (
        <line key={i} x1={1400 - i * 100} y1={400.5} x2={1400 - i * 100} y2={404} className="t-ruler" />
      ))}
      <d.Body L={L} u={u} />
      {d.Axle.map((A, i) => (
        <g key={i}>
          <A />
        </g>
      ))}
      <d.Post L={L} u={u} />
    </svg>
  );
}
