import { useState, type CSSProperties } from 'react';
import type { TelemetryFrame } from '../../../shared/types';
import { TRAILER_MODELS } from '../../../shared/vehicles';
import { Badge, Segmented } from '../components/ui';
import { getVehicle } from './registry';
import { getTrailerDrawing } from './trailers';
import { TruckFront } from './TruckFront';
import { TruckSide } from './TruckSide';

export function trailerLabel(key: string): string {
  return TRAILER_MODELS.find((t) => t.key === key)?.label ?? key;
}

export function VehicleView({
  frame,
  exaggeration,
  initialView = 'side',
  compact = false,
  withFront = false,
}: {
  frame: TelemetryFrame;
  exaggeration: number;
  initialView?: 'side' | 'front';
  compact?: boolean;
  /** Mostra a miniatura frontal ao lado da vista lateral (telas largas). */
  withFront?: boolean;
}) {
  const [view, setView] = useState<'side' | 'front'>(initialView);
  const vehicle = getVehicle(frame.truck.modelKey);
  const src = frame.truck.modelSource;
  const tr = frame.trailer;
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-cond truncate text-[15px] font-semibold tracking-[0.04em]">{vehicle.label}</span>
        <Badge tone={src === 'auto' ? 'ok' : src === 'manual' ? 'accent' : 'warn'}>{src === 'auto' ? 'Auto' : src === 'manual' ? 'Manual' : 'Aproximado'}</Badge>
        {tr.attached && (
          <Badge tone={tr.modelSource === 'fallback' ? 'warn' : 'neutral'}>
            Reboque: {trailerLabel(getTrailerDrawing(tr.modelKey).type)}
            {tr.modelSource === 'fallback' ? ' (aproximado)' : ''}
          </Badge>
        )}
        <Segmented
          className="ml-auto"
          value={view}
          onChange={setView}
          options={[
            ['side', 'Lateral'],
            ['front', 'Frontal'],
          ]}
        />
      </div>
      <div
        className={`grid flex-1 items-end gap-3 ${withFront && view === 'side' ? 'lg:grid-cols-[1fr_150px]' : ''} ${compact ? 'min-h-[120px]' : 'min-h-[180px]'}`}
        style={{ '--truck-paint': vehicle.paint } as CSSProperties}
      >
        {view === 'side' ? (
          <TruckSide
            vehicle={vehicle}
            lights={frame.lights}
            suspension={frame.suspension}
            trailer={frame.trailer}
            exaggeration={exaggeration}
            showLabels
            className="block h-auto max-h-[360px] w-full"
          />
        ) : (
          <TruckFront vehicle={vehicle} lights={frame.lights} wipers={frame.wipers} className="mx-auto block h-auto max-h-[380px] w-full max-w-[300px]" />
        )}
        {withFront && view === 'side' && (
          <div className="hidden lg:block">
            <TruckFront vehicle={vehicle} lights={frame.lights} wipers={frame.wipers} className="block h-auto w-full" />
            <div className="tp-label mt-1 text-center">Frontal</div>
          </div>
        )}
      </div>
      {!compact && (
        <p className="text-[11px] leading-[15px] text-dim">
          Representação vetorial estilizada para identificação do modelo — não é um desenho oficial do fabricante.
          {src === 'fallback' && ' O modelo exato não foi reconhecido; escolha-o manualmente em Configurações.'}
          {frame.truck.id && (
            <>
              {' '}
              Identificador do jogo: <span className="digits text-muted">{frame.truck.id}</span>.
            </>
          )}
          {view === 'side' && ` Suspensão: a variação da deflexão real é exagerada ×${exaggeration} no desenho; os números sob as rodas são a deflexão real em mm.`}
        </p>
      )}
    </div>
  );
}
