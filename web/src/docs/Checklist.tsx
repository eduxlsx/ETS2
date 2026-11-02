/**
 * Checklist pré-viagem (DOCUMENTOS-SPEC §6.4). Itens automáticos [ OK ]/[FALHA]
 * pelo SDK + itens manuais (gravados no frete via POST /api/checklist/:jobId).
 */
import { useEffect, useState } from 'react';
import type { TelemetryFrame } from '../../../shared/types';
import { CheckMark } from '../pages/Diagnostics';
import { api } from '../lib/api';

const MANUAL: [string, string][] = [
  ['docs', 'NF-e, CT-e e MDF-e na pasta'],
  ['cargo', 'Carga amarrada e conferida'],
  ['tacho', 'Disco do tacógrafo trocado'],
  ['epi', 'EPI e triângulo a bordo'],
];

export function autoChecks(f: TelemetryFrame): { label: string; ok: boolean | null; src: string }[] {
  const e = f.engine;
  const need = f.job.plannedDistanceKm && f.fuel.avgConsumptionL100 ? (f.job.plannedDistanceKm * f.fuel.avgConsumptionL100) / 100 : null;
  const wear = [f.wear.engine, f.wear.transmission, f.wear.chassis, f.wear.cabin, f.wear.wheels].filter((v): v is number => v !== null);
  return [
    { label: 'Freio de estacionamento aplicado', ok: e.parkingBrake, src: 'parkingBrake' },
    { label: 'Pressão de ar acima do limite de aviso', ok: e.airPressurePsi === null ? null : !e.warnings.airPressure, src: 'airPressure' },
    { label: 'Combustível suficiente para a rota', ok: need === null || f.fuel.liters === null ? null : f.fuel.liters >= need, src: need ? `precisa ~${Math.round(need)} L` : 'consumo × distância' },
    { label: 'Reboque acoplado', ok: f.trailer.attached, src: 'trailer.attached' },
    { label: 'Desgaste do caminhão < 10 %', ok: wear.length ? Math.max(...wear) < 0.1 : null, src: 'wear' },
    { label: 'Luzes de posição funcionando', ok: f.lights.parking, src: 'lights.parking' },
  ];
}

export function Checklist({ frame, jobId, initial, onSaved }: { frame: TelemetryFrame; jobId: number | null; initial?: Record<string, boolean> | null; onSaved?: () => void }) {
  const [items, setItems] = useState<Record<string, boolean>>(initial ?? {});
  useEffect(() => setItems(initial ?? {}), [jobId]);
  const toggle = (k: string, v: boolean) => {
    const next = { ...items, [k]: v };
    setItems(next);
    if (jobId) api.checklist(jobId, next).then(() => onSaved?.()).catch(() => {});
  };
  return (
    <ul data-testid="checklist">
      {autoChecks(frame).map((c) => (
        <li key={c.label} className="flex min-h-11 items-center gap-2.5 border-b border-line px-1 text-[13px]">
          <span className="w-16 shrink-0">
            <CheckMark ok={c.ok} />
          </span>
          <span className="min-w-0 flex-1">{c.label}</span>
          <small className="digits shrink-0 text-[10px] text-dim">{c.src}</small>
        </li>
      ))}
      {MANUAL.map(([k, l]) => (
        <li key={k} className="flex min-h-11 items-center gap-2.5 border-b border-line px-1 text-[13px] last:border-b-0">
          <span className="w-16 shrink-0">
            <CheckMark ok={items[k] ? true : null} />
          </span>
          <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2.5">
            <input type="checkbox" className="h-5 w-5 accent-[var(--tp-accent)]" checked={!!items[k]} onChange={(e) => toggle(k, e.target.checked)} />
            {l}
          </label>
          <small className="digits text-[10px] text-dim">manual</small>
        </li>
      ))}
    </ul>
  );
}

export function ChecklistModal({ frame, jobId, onClose }: { frame: TelemetryFrame; jobId: number | null; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Checklist pré-viagem">
      <div className="flex w-full max-w-[560px] flex-col overflow-y-auto border border-line-strong bg-panel sm:max-h-[90dvh]">
        <div className="flex h-11 shrink-0 items-center border-b border-line px-3 pt-[env(safe-area-inset-top)] sm:pt-0">
          <span className="tp-title">Checklist pré-viagem</span>
          <button className="tp-btn text ml-auto" onClick={onClose}>
            Dispensar
          </button>
        </div>
        <div className="p-3">
          <p className="mb-2 text-[13px] text-muted">Novo frete: {frame.job.cargo ?? 'carga'} para {frame.job.destinationCity ?? '?'}. Itens automáticos vêm do SDK; marque os manuais.</p>
          <Checklist frame={frame} jobId={jobId} />
        </div>
        <div className="flex justify-end border-t border-line p-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
          <button className="tp-btn solid !min-h-11" onClick={onClose}>
            Pronto
          </button>
        </div>
      </div>
    </div>
  );
}
