/** Módulos de integração: "Documentos do frete" (Painel) e "Saldo da viagem" (Viagem / carteira). */
import { useEffect, useState } from 'react';
import { docsSettings, type JobRecord, type LedgerEntry } from '../../../shared/types';
import { fmtGameTime } from '../../../shared/docs/build';
import { Card, Num } from '../components/ui';
import { api } from '../lib/api';
import { setState, useStore } from '../lib/telemetryStore';
import { brl, nfmt } from './common';
import { Stepper } from './DocView';
import './docs.css';

function useCurrentJob() {
  const docRev = useStore((s) => s.docRev);
  const source = useStore((s) => s.frame?.source);
  const [job, setJob] = useState<JobRecord | null>(null);
  useEffect(() => {
    api.currentJob().then((r) => setJob(r.job)).catch(() => setJob(null));
  }, [docRev, source]);
  return job;
}

function PaperThumb({ stamped }: { stamped: boolean }) {
  return (
    <div
      aria-hidden
      className="relative h-[60px] w-[46px] flex-none"
      style={{ background: 'var(--paper)', clipPath: 'polygon(0 0,74% 0,100% 18%,100% 100%,0 100%)' }}
    >
      <div className="absolute inset-x-2 top-2.5 h-7" style={{ background: 'repeating-linear-gradient(#999 0 1px, transparent 1px 5px)' }} />
      {stamped && <div className="absolute right-1 bottom-1 h-[22px] w-[22px] rounded-full border-2 opacity-70" style={{ borderColor: 'var(--ink-blue)', transform: 'rotate(-12deg)' }} />}
    </div>
  );
}

export function PaperworkModule({ className = '', onSign = (id: number) => setState({ signRequest: id }) }: { className?: string; onSign?: (docId: number) => void }) {
  const pw = useStore((s) => s.frame?.paperwork ?? null);
  const job = useCurrentJob();
  return (
    <Card
      title="Documentos do frete"
      code="P-11"
      className={className}
      action={
        <a className="tp-btn" href="#/documentos">
          Abrir pasta
        </a>
      }
    >
      {!pw ? (
        <p className="text-[13px] text-dim">Sem frete ativo. Os documentos simulados (NF-e, CT-e, MDF-e) são emitidos quando você aceita um frete.</p>
      ) : (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <PaperThumb stamped={pw.status === 'delivered' || pw.status === 'archived'} />
            <div className="min-w-0 flex-1">
              <div className="font-cond text-[15px] font-semibold uppercase tracking-[0.04em]">{pw.route}</div>
              <div className="digits text-[12px] text-muted">
                NF-e <Num value={nfmt(pw.nfe)} /> · CT-e <Num value={nfmt(pw.cte)} /> · MDF-e <Num value={nfmt(pw.mdfe)} />
              </div>
            </div>
            {pw.awaitingSignature && pw.nfeDocId && onSign && (
              <button className="tp-btn warn !min-h-11" onClick={() => onSign(pw.nfeDocId!)}>
                Entregar e assinar
              </button>
            )}
          </div>
          <Stepper status={pw.status} startedGameMin={job?.startedGameMin} plannedKm={job?.plannedKm} finishedGameMin={job?.finishedGameMin} penaltyEur={job?.cancelPenaltyEur} />
          <p className="text-[11px] text-dim">Documentos simulados — sem valor fiscal.{pw.source === 'demo' ? ' Modo DEMO: não são salvos.' : ''}</p>
        </div>
      )}
    </Card>
  );
}

const KIND_SRC: Record<string, string> = {
  advance: 'SIM (50 % na emissão do CT-e)',
  revenue: 'SDK jobDeliveredRevenue',
  toll: 'SDK tollgatePayAmount',
  ferry: 'SDK ferryPayAmount',
  train: 'SDK trainPayAmount',
  fuel: 'SDK refuelAmount × preço SIM',
  fine: 'SDK fineAmount',
  cancel_penalty: 'SDK jobCancelledPenalty',
};

/** Carteira do motorista (extrato do frete atual ou geral). */
export function LedgerModule({ className = '', scope = 'job' }: { className?: string; scope?: 'job' | 'all' }) {
  const docRev = useStore((s) => s.docRev);
  const settings = useStore((s) => s.settings);
  const fx = docsSettings(settings).fxBrlPerEur;
  const job = useCurrentJob();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  useEffect(() => {
    if (scope === 'job' && !job) return setEntries([]);
    api.ledger(scope === 'job' ? job!.id : undefined).then((r) => setEntries(r.entries)).catch(() => setEntries([]));
  }, [docRev, job?.id, scope]);
  let bal = 0;
  const income = entries.filter((e) => e.amountEur > 0).reduce((a, e) => a + e.amountEur, 0) * fx;
  const expense = entries.filter((e) => e.amountEur < 0).reduce((a, e) => a + e.amountEur, 0) * fx;
  const km = job?.deliveredKm ?? job?.plannedKm ?? null;
  return (
    <Card title={scope === 'job' ? 'Saldo da viagem' : 'Carteira do motorista'} code="V-06" className={className} pad={false}>
      <div className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-4">
        {(
          [
            ['Receitas', brl(income), 'text-ok'],
            ['Despesas', brl(-expense), 'text-crit'],
            ['Resultado', brl(income + expense), ''],
            ['R$ / km', km ? (((income + expense) / km).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : '—', ''],
          ] as [string, string, string][]
        ).map(([l, v, c]) => (
          <div key={l} className="bg-panel px-3 py-2.5">
            <div className="tp-label">{l}</div>
            <div className={`digits text-[20px] leading-7 ${c}`}>
              <Num value={v} />
            </div>
          </div>
        ))}
      </div>
      {!entries.length ? (
        <p className="p-3 text-[13px] text-dim">Sem lançamentos ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="tp-table" data-testid="ledger">
            <thead>
              <tr>
                <th>Hora (jogo)</th>
                <th>Lançamento</th>
                <th className="num">Valor</th>
                <th className="num max-sm:hidden">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                bal += e.amountEur * fx;
                return (
                  <tr key={e.id} title={`€ ${e.amountEur.toLocaleString('pt-BR')} · câmbio ${fx.toLocaleString('pt-BR')}`}>
                    <td className="digits">{fmtGameTime(e.gameMin)}</td>
                    <td className="!whitespace-normal">
                      {e.label}
                      <div className="digits text-[10px] text-dim">{KIND_SRC[e.kind] ?? e.origin.toUpperCase()}</div>
                    </td>
                    <td className={`num ${e.amountEur < 0 ? 'text-crit' : 'text-ok'}`}>
                      {e.amountEur < 0 ? '−' : '+'} <Num value={brl(Math.abs(e.amountEur * fx))} />
                    </td>
                    <td className="num max-sm:hidden">
                      <Num value={brl(bal)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="px-3 py-2 text-[11px] text-dim">Valores do jogo em € convertidos pelo câmbio simulado de Configurações › Documentos (valor original no tooltip).</p>
    </Card>
  );
}
