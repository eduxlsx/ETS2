/**
 * 09 Documentos — pasta de documentos SIMULADOS do frete (DOCUMENTOS-SPEC §4.8):
 * filtros, viagens agrupadas, prancheta com o documento, impressão/PDF,
 * rádio do despachante e disco do tacógrafo do dia.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { docsSettings, type JobRecord, type TripDoc, type TripDocSummary } from '../../../shared/types';
import { Badge, Card, Limitation, PageHeader } from '../components/ui';
import { DocView, DOC_KIND, STATUS_LABEL, Stepper } from '../docs/DocView';
import { RadioPanel } from '../docs/Dispatch';
import { TachoDisc } from '../docs/Duty';
import { brl } from '../docs/common';
import '../docs/docs.css';
import '../docs/fonts';
import { api } from '../lib/api';
import { useStore } from '../lib/telemetryStore';

type Filter = 'todos' | 'fiscal' | 'recibo' | 'multa';

const JOB_STATUS: Record<string, { label: string; tone: 'accent' | 'ok' | 'crit' | 'warn' | 'neutral' }> = {
  issued: { label: 'Emitido', tone: 'accent' },
  transit: { label: 'Em trânsito', tone: 'accent' },
  awaiting_signature: { label: 'Assinar entrega', tone: 'warn' },
  delivered: { label: 'Entregue', tone: 'ok' },
  cancelled: { label: 'Cancelado', tone: 'crit' },
  archived: { label: 'Arquivado', tone: 'neutral' },
};

export function Documents({ onSign }: { onSign?: (docId: number) => void }) {
  const docRev = useStore((s) => s.docRev);
  const settings = useStore((s) => s.settings);
  const frame = useStore((s) => s.frame);
  const ds = docsSettings(settings);
  const [docs, setDocs] = useState<TripDocSummary[]>([]);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [filter, setFilter] = useState<Filter>('todos');
  const [current, setCurrent] = useState<number | null>(null);
  const [doc, setDoc] = useState<TripDoc | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [printDocs, setPrintDocs] = useState<TripDoc[] | null>(null);
  const [duty, setDuty] = useState<Awaited<ReturnType<typeof api.duty>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([api.docs(), api.jobs(50)])
      .then(([d, j]) => {
        setDocs(d);
        setJobs(j);
        setError(null);
        setCurrent((c) => c ?? d.find((x) => x.type === 'nfe')?.id ?? d[0]?.id ?? null);
      })
      .catch((e) => setError(String(e)));
    api.duty().then(setDuty).catch(() => {});
  }, [docRev, frame?.source]);

  useEffect(() => {
    if (current === null) return setDoc(null);
    api.doc(current).then(setDoc).catch(() => setDoc(null));
  }, [current, docRev]);

  // impressão: monta as folhas no .print-root e chama window.print()
  useEffect(() => {
    if (!printDocs) return;
    const t = setTimeout(() => {
      window.print();
      setPrintDocs(null);
    }, 300);
    return () => clearTimeout(t);
  }, [printDocs]);

  const visible = docs.filter((d) => filter === 'todos' || DOC_KIND[d.type]?.group === filter);
  const groups = useMemo(() => {
    const byJob = new Map<number | 'none', TripDocSummary[]>();
    for (const d of visible) byJob.set(d.jobId ?? 'none', [...(byJob.get(d.jobId ?? 'none') ?? []), d]);
    return [...byJob.entries()].map(([id, list]) => ({ job: id === 'none' ? null : jobs.find((j) => j.id === id) ?? null, id, list: list.slice().sort((a, b) => a.id - b.id) }));
  }, [visible, jobs]);
  const flat = groups.flatMap((g) => g.list);

  const open = (id: number) => {
    setCurrent(id);
    setMobileOpen(true);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = flat.findIndex((d) => d.id === current);
    const next = flat[Math.max(0, Math.min(flat.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
    if (next) {
      setCurrent(next.id);
      (listRef.current?.querySelector(`[data-doc="${next.id}"]`) as HTMLElement | null)?.focus();
    }
  };

  const printOne = () => doc && setPrintDocs([doc]);
  const printTrip = async () => {
    if (!doc?.jobId) return printOne();
    const ids = docs.filter((d) => d.jobId === doc.jobId).map((d) => d.id);
    setPrintDocs(await Promise.all(ids.map((id) => api.doc(id))));
  };
  const share = async () => {
    if (!doc) return;
    const text = `${doc.title} — Documento Fiscal`;
    try {
      if (navigator.share) await navigator.share({ title: doc.title, text });
      else await navigator.clipboard.writeText(text);
    } catch {
      /* cancelado */
    }
  };

  const job = doc?.jobId ? jobs.find((j) => j.id === doc.jobId) : null;
  const viewer = (
    <div className="clip doc-viewer" data-testid="clipboard">
      {doc ? <DocView doc={doc} /> : <div className="sheet-wrap"><div className="sheet flex items-center justify-center" style={{ font: '2cqw var(--doc-font)' }}>Selecione um documento</div></div>}
    </div>
  );
  const actions = doc && (
    <div className="flex flex-wrap gap-2">
      {doc.type === 'nfe' && doc.status === 'awaiting_signature' && onSign && (
        <button className="tp-btn warn" onClick={() => onSign(doc.id)}>
          Entregar e assinar
        </button>
      )}
      <button className="tp-btn" onClick={printOne}>
        Imprimir / PDF
      </button>
      {doc.jobId && (
        <button className="tp-btn" onClick={printTrip}>
          Exportar todos da viagem
        </button>
      )}
      <button className="tp-btn" onClick={share}>
        Compartilhar
      </button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-px bg-line">
      <PageHeader title="Documentos" code="09">
        <Badge tone={frame?.source === 'demo' ? 'warn' : 'neutral'}>{frame?.source === 'demo' ? 'DEMO — não são salvos' : 'NFe'}</Badge>
      </PageHeader>
      {error && <p className="bg-panel p-3 text-sm text-crit">{error}</p>}
      <div className="grid grid-cols-1 gap-px bg-line md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="bg-panel">
          <div className="flex gap-1.5 overflow-x-auto border-b border-line p-2.5" role="group" aria-label="Filtro">
            {(
              [
                ['todos', 'Todos'],
                ['fiscal', 'Fiscais'],
                ['recibo', 'Recibos'],
                ['multa', 'Multas'],
              ] as [Filter, string][]
            ).map(([k, l]) => (
              <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
                {l}
              </button>
            ))}
          </div>
          <div ref={listRef} onKeyDown={onKey} data-testid="doc-folder">
            {!groups.length && <p className="tp-hatch m-2.5 p-3 text-[13px] text-dim">Nenhum documento ainda. Aceite um frete no jogo (ou ative o modo DEMO): NF-e, CT-e e MDF-e são emitidos no início do frete; recibos aparecem em pedágios, balsas, abastecimentos e multas.</p>}
            {groups.map((g) => (
              <div key={String(g.id)} className="border-b border-line">
                <header className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                  <b className="font-cond text-sm font-semibold uppercase tracking-[0.04em]">{g.job ? `${g.job.srcCity ?? '?'} → ${g.job.dstCity ?? '?'}` : 'Fora de frete'}</b>
                  {g.job && <Badge tone={JOB_STATUS[g.job.status]?.tone ?? 'neutral'}>{JOB_STATUS[g.job.status]?.label ?? g.job.status}</Badge>}
                </header>
                {g.list.map((d) => (
                  <button key={d.id} data-doc={d.id} className={`doc-item${d.id === current ? ' act' : ''}`} onClick={() => open(d.id)} aria-current={d.id === current ? 'true' : undefined}>
                    <span className="ic" data-k={DOC_KIND[d.type]?.k ?? d.type} />
                    <span className="t">
                      <b>{d.title}</b>
                      <span>{d.amountEur ? `${brl(d.amountEur * (ds.fxBrlPerEur || 6))} · ` : ''}{STATUS_LABEL[d.status] ?? d.status}</span>
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>
        <section className="hidden min-w-0 bg-panel md:block">
          {job && (
            <div className="border-b border-line p-2.5">
              <Stepper status={job.status} startedGameMin={job.startedGameMin} plannedKm={job.plannedKm} finishedGameMin={job.finishedGameMin} penaltyEur={job.cancelPenaltyEur} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
            <span className="tp-title">{doc ? DOC_KIND[doc.type]?.label : 'Prancheta'}</span>
            <div className="ml-auto">{actions}</div>
          </div>
          {viewer}
        </section>
      </div>

      {/* celular: documento em tela cheia com pinça para zoom */}
      {mobileOpen && doc && (
        <div className="fixed inset-0 z-40 flex flex-col bg-bg md:hidden" role="dialog" aria-modal="true" aria-label={doc.title}>
          <div className="flex h-11 shrink-0 items-center border-b border-line bg-panel px-3 pt-[env(safe-area-inset-top)]">
            <span className="tp-title truncate">{doc.title}</span>
            <button className="tp-btn text ml-auto" onClick={() => setMobileOpen(false)}>
              Fechar
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">{viewer}</div>
          <div className="border-t border-line bg-panel p-2 pb-[max(8px,env(safe-area-inset-bottom))]">{actions}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-px bg-line lg:grid-cols-2">
        <Card title="Rádio do despachante" code="D-02">
          <RadioPanel />
          <p className="mt-2 text-[11px] text-dim">Voz e avisos podem ser ligados em Configurações › Documentos.</p>
        </Card>
        <Card title="Disco do tacógrafo (hoje)" code="D-03">
          {duty ? (
            <TachoDisc day={duty.day} segments={duty.segments} speed={duty.speed} driver={ds.driverName} plate={frame?.truck.licensePlate ?? '—'} gameMin={duty.summary?.gameMin ?? null} />
          ) : (
            <p className="text-sm text-muted">Sem dados da jornada.</p>
          )}
          <p className="mt-2 text-center text-[11px] text-dim">anel interno: direção (grosso) · trabalho (médio) · descanso (fino) · traço azul: velocidade</p>
        </Card>
      </div>
      <div className="bg-panel p-3">
        <Limitation>
          Todos os documentos são SIMULADOS e não têm valor fiscal: empresas, CNPJs (raiz 99), chaves de acesso (UF 91) e números são fictícios e
          determinísticos. Vêm do SDK: carga, massa, cidades/empresas, receita, prazo, placas, valores de pedágio/balsa/multa e litros abastecidos;
          o resto (NCM, preço da mercadoria, impostos, câmbio, preço do diesel) é simulado. No modo DEMO nada é salvo.
        </Limitation>
      </div>

      {printDocs &&
        createPortal(
          <div className="print-root">
            {printDocs.map((d) => (
              <div key={d.id}>
                <DocView doc={d} />
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
