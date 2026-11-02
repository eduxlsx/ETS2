/** Renderiza qualquer documento simulado pelo tipo + stepper de status do frete. */
import type { DocType, JobStatus, TripDoc } from '../../../shared/types';
import { fmtGameDateTime } from '../../../shared/docs/build';
import { Dacte, Damdfe, Danfe } from './FiscalDocs';
import { DeliveryReport, FineTicket, FuelReceipt, PassageTicket, TollReceipt } from './Receipts';

export const DOC_KIND: Record<DocType, { k: string; label: string; group: 'fiscal' | 'recibo' | 'multa' }> = {
  nfe: { k: 'NF-e', label: 'DANFE (NF-e)', group: 'fiscal' },
  cte: { k: 'CT-e', label: 'DACTE (CT-e)', group: 'fiscal' },
  mdfe: { k: 'MDF', label: 'DAMDFE (MDF-e)', group: 'fiscal' },
  delivery: { k: 'REL', label: 'Relatório de entrega', group: 'fiscal' },
  toll: { k: 'PED', label: 'Recibo de pedágio', group: 'recibo' },
  fuel: { k: 'NFC', label: 'Cupom de abastecimento (NFC-e)', group: 'recibo' },
  ferry: { k: 'BAL', label: 'Bilhete de balsa', group: 'recibo' },
  train: { k: 'TRM', label: 'Bilhete de trem', group: 'recibo' },
  fine: { k: 'AIT', label: 'Auto de infração', group: 'multa' },
};

export const STATUS_LABEL: Record<string, string> = {
  issued: 'Emitido',
  transit: 'Em trânsito',
  awaiting_signature: 'Aguardando assinatura',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  archived: 'Arquivado',
};

export function DocView({ doc }: { doc: TripDoc }) {
  switch (doc.type) {
    case 'nfe':
      return <Danfe doc={doc} />;
    case 'cte':
      return <Dacte doc={doc} />;
    case 'mdfe':
      return <Damdfe doc={doc} />;
    case 'toll':
      return <TollReceipt doc={doc} />;
    case 'fuel':
      return <FuelReceipt doc={doc} />;
    case 'ferry':
    case 'train':
      return <PassageTicket doc={doc} />;
    case 'fine':
      return <FineTicket doc={doc} />;
    case 'delivery':
      return <DeliveryReport doc={doc} />;
    default:
      return null;
  }
}

/** Emitida → Em trânsito → Entregue · assinada → Arquivada (ou Cancelada). */
export function Stepper({ status, startedGameMin, plannedKm, finishedGameMin, penaltyEur }: { status: JobStatus | null; startedGameMin?: number | null; plannedKm?: number | null; finishedGameMin?: number | null; penaltyEur?: number | null }) {
  const order: Record<string, number> = { issued: 0, transit: 1, awaiting_signature: 2, delivered: 3, archived: 4, cancelled: 3 };
  const cur = status ? order[status] : -1;
  const steps: [string, string][] = [
    ['Emitida', startedGameMin !== undefined && startedGameMin !== null ? fmtGameDateTime(startedGameMin) : '—'],
    ['Em trânsito', plannedKm ? `${Math.round(plannedKm)} km` : '—'],
    [status === 'awaiting_signature' ? 'Assinar entrega' : 'Entregue · assinada', finishedGameMin ? fmtGameDateTime(finishedGameMin) : '—'],
    [status === 'cancelled' ? 'Cancelada' : 'Arquivada', status === 'cancelled' && penaltyEur ? `multa € ${penaltyEur.toLocaleString('pt-BR')}` : '—'],
  ];
  return (
    <div className="doc-steps" data-testid="doc-steps" data-status={status ?? 'none'}>
      {steps.map(([l, s], i) => {
        let c = '';
        if (status === 'cancelled') c = i < 2 ? 'done' : i === 3 ? 'cancel' : '';
        else if (status === 'archived') c = 'done';
        else if (status === 'delivered') c = i <= 2 ? 'done' : '';
        else c = i < cur ? 'done' : i === cur ? 'cur' : '';
        return (
          <div key={i} className={c}>
            <b>{l}</b>
            <span>{s}</span>
          </div>
        );
      })}
    </div>
  );
}
