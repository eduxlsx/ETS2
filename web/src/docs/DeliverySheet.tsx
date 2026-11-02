/**
 * Canhoto de recebimento: abre sozinho quando a entrega fica "aguardando
 * assinatura" (jobDelivered). Assinatura em canvas → POST /api/docs/:id/sign →
 * carimbos animados (RECEBIDO azul; AVARIA vermelha acima do limite).
 */
import { useEffect, useRef, useState } from 'react';
import { docsSettings, type TripDoc } from '../../../shared/types';
import { fmtGameDateTime } from '../../../shared/docs/build';
import { dockNumber, receiverPerson } from '../../../shared/docs/tables';
import { api } from '../lib/api';
import { useStore } from '../lib/telemetryStore';
import { brl, nfmt, num } from './common';
import { SignaturePad, type SignaturePadHandle } from './SignaturePad';
import { StampView } from './Stamp';
import './docs.css';

export function thud() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ac = new AC();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(45, ac.currentTime + 0.12);
    g.gain.setValueAtTime(0.35, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.16);
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + 0.17);
  } catch {
    /* sem áudio */
  }
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function DeliverySheet({ docId, onClose }: { docId: number; onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const frame = useStore((s) => s.frame);
  const ds = docsSettings(settings);
  const [doc, setDoc] = useState<TripDoc | null>(null);
  const [empty, setEmpty] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState(0);
  const [thump, setThump] = useState(false);
  const pad = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    api.doc(docId).then(setDoc).catch((e) => setError(String(e)));
  }, [docId]);

  const signed = doc?.status === 'delivered';
  useEffect(() => {
    if (!signed || !doc?.stamps?.length) return;
    const timers: number[] = [];
    doc.stamps.forEach((_, i) => {
      timers.push(
        window.setTimeout(
          () => {
            setShown(i + 1);
            if (!reduced()) {
              setThump(false);
              requestAnimationFrame(() => setThump(true));
              if (ds.stampSound) thud();
            }
          },
          reduced() ? 0 : 120 + i * 700,
        ),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [signed, doc?.id]);

  const sign = async () => {
    if (!doc) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.sign(doc.id, pad.current?.strokes() ?? []);
      setDoc(r);
    } catch (e) {
      setError(`Não foi possível assinar: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const d = doc?.data;
  const job = d?.job;
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Canhoto de recebimento">
      <div className="flex w-full max-w-[760px] flex-col overflow-y-auto border border-line-strong bg-panel sm:max-h-[94dvh]">
        <div className="flex h-11 shrink-0 items-center border-b border-line px-3 pt-[env(safe-area-inset-top)] sm:pt-0">
          <span className="tp-title">Entrega · canhoto da NF-e</span>
          {doc?.source === 'demo' && <span className="tp-label ml-2 !text-warn">DEMO — não é salvo</span>}
          <button className="tp-btn text ml-auto" onClick={onClose}>
            {signed ? 'Fechar' : 'Depois'}
          </button>
        </div>
        <div className="p-3">
          {error && <p className="mb-2 text-sm text-crit">{error}</p>}
          {!doc || !d ? (
            <p className="text-sm text-muted">Carregando o canhoto…</p>
          ) : (
            <div className={`sign-area${thump ? ' thump' : ''}`} data-status={doc.status} data-testid="delivery-sheet">
              <div className="hdr">
                <span>
                  Recebemos de {d.emit.name} os produtos constantes da NF-e indicada
                </span>
                <span>Nº {nfmt(d.numero)} · série 001</span>
              </div>
              <div className="sign-grid">
                <div>
                  <span className="l">Destinatário</span>
                  <span className="v">
                    {d.dest.name} — {job.cityDst}
                  </span>
                </div>
                <div>
                  <span className="l">Valor total</span>
                  <span className="v">{brl(d.vProd)}</span>
                </div>
                <div>
                  <span className="l">Data e hora do recebimento (jogo)</span>
                  <span className="v">{signed ? fmtGameDateTime(doc.data.receivedGameMin) : frame?.game.gameTimeMin ? fmtGameDateTime(frame.game.gameTimeMin) : '—'}</span>
                </div>
                <div>
                  <span className="l">Recebedor · doca</span>
                  <span className="hand">
                    {receiverPerson(`${job.compDst}|${job.startedGameMin}`)} · doca {dockNumber(`${job.compDst}|${job.startedGameMin}`)}
                  </span>
                </div>
                <div className="pad">
                  {signed ? (
                    <div className="absolute inset-0 flex items-center px-3 text-[13px]" style={{ color: 'var(--ink-2)' }}>
                      {doc.signature?.auto ? 'Assinatura eletrônica automática.' : 'Assinado.'}
                    </div>
                  ) : (
                    <SignaturePad ref={pad} disabled={busy} onChange={setEmpty} />
                  )}
                  <span className="x">✕</span>
                  <span className="hint">Assinatura do recebedor{empty && !signed ? ' — desenhe aqui (ou confirme para assinar com rubrica automática)' : ''}</span>
                  {signed &&
                    doc.stamps?.slice(0, shown).map((s, i) => (
                      <div key={i} className={`stamp-slot${s.kind === 'received' ? '' : ' rect'}`}>
                        <StampView stamp={s} animate={!reduced()} />
                      </div>
                    ))}
                </div>
                <div>
                  <span className="l">Avaria registrada</span>
                  <span className="v">
                    {signed
                      ? `${num(doc.data.damagePct, 1)} % ${doc.data.damagePct > ds.damageStampPct ? `— ACIMA do limite de ${num(ds.damageStampPct, 0)} %` : `(abaixo do limite de ${num(ds.damageStampPct, 0)} %)`}`
                      : 'apurada na assinatura (SDK: jobDeliveredCargoDamage)'}
                  </span>
                </div>
                <div>
                  <span className="l">Ressalvas</span>
                  <span className="v">—</span>
                </div>
              </div>
              <p className="mt-2 text-[11px]" style={{ color: 'var(--ink-red)', fontWeight: 700 }}>
                NFe
              </p>
            </div>
          )}
          {doc && !signed && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button className="tp-btn !min-h-11" onClick={() => pad.current?.clear()} disabled={busy}>
                Limpar
              </button>
              <button className="tp-btn solid !min-h-11" onClick={sign} disabled={busy} data-testid="sign-deliver">
                {busy ? 'Assinando…' : 'Assinar e entregar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
