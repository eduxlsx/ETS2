/** Despachante da transportadora (rádio): toasts, visor LCD e voz opcional (Web Speech API). */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { docsSettings, type DispatchMessage } from '../../../shared/types';
import { fmtGameTime } from '../../../shared/docs/build';
import { useStore } from '../lib/telemetryStore';
import './docs.css';

const COLOR: Record<DispatchMessage['level'], string> = {
  info: 'var(--tp-accent)',
  ok: 'var(--tp-ok)',
  warn: 'var(--tp-warn)',
  crit: 'var(--tp-crit)',
};

export function speak(text: string) {
  try {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 1.05;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {
    /* sem voz */
  }
}

/** Toasts no canto (no celular, acima da barra inferior). */
export function DispatchToasts() {
  const list = useStore((s) => s.dispatch);
  const settings = useStore((s) => s.settings);
  const ds = docsSettings(settings);
  const [visible, setVisible] = useState<DispatchMessage[]>([]);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const fresh = list.filter((m) => !seen.current.has(m.id));
    if (!fresh.length) return;
    fresh.forEach((m) => seen.current.add(m.id));
    if (!ds.dispatcherToasts) return;
    setVisible((v) => [...fresh, ...v].slice(0, 3));
    if (ds.dispatcherVoice) speak(fresh[0].text);
    const ids = fresh.map((m) => m.id);
    const t = setTimeout(() => setVisible((v) => v.filter((m) => !ids.includes(m.id))), 7000);
    return () => clearTimeout(t);
  }, [list]);

  if (!visible.length) return null;
  return (
    <div className="toasts" aria-live="polite" data-testid="dispatch-toasts">
      {visible.map((m) => (
        <div key={m.id} className="toast" style={{ '--c': COLOR[m.level] } as CSSProperties} role="status">
          <div className="wave" aria-hidden>
            <i />
            <i />
            <i />
          </div>
          <div>
            <div className="who">Central · CH 19</div>
            <p>{m.text}</p>
          </div>
          <span className="t">{fmtGameTime(m.gameMin)}</span>
        </div>
      ))}
    </div>
  );
}

/** Rádio com visor LCD verde-oliva (página Documentos). */
export function RadioPanel() {
  const list = useStore((s) => s.dispatch);
  const last = list[0];
  return (
    <div className="radio" data-testid="radio">
      <div className="lcd">
        <div className="ch">
          <span>CH 19 · CENTRAL</span>
          <span>{last ? fmtGameTime(last.gameMin) : '--:--'}</span>
        </div>
        <div>{last ? last.text : 'Sem mensagens. O despachante fala quando há frete, pedágio, multa, atraso ou entrega.'}</div>
      </div>
      {list.length > 1 && (
        <ul className="mt-2 max-h-40 overflow-y-auto">
          {list.slice(1, 12).map((m) => (
            <li key={m.id} className="flex gap-2 border-b border-[#2a2a20] py-1 text-[12px] text-[#b8c25e]">
              <span className="digits shrink-0">{fmtGameTime(m.gameMin)}</span>
              <span>{m.text}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="grill" aria-hidden />
    </div>
  );
}
