/**
 * Limpador de para-brisa (esquema técnico). O SDK da SCS fornece SOMENTE
 * ligado/desligado (truck.wipers): a animação usa um ciclo fixo de 1,4 s apenas
 * como representação visual do estado "ligado" — não é a velocidade real.
 */
import type { CSSProperties } from 'react';
import type { WiperData } from '../../../shared/types';

export function WiperIndicator({ wipers, size = 170 }: { wipers: WiperData; size?: number }) {
  const on = wipers.on === true;
  const unknown = wipers.on === null;
  const arm = (x: number) => (
    <g className={`tp-wiper${on ? ' on' : ''}`} style={{ transformOrigin: `${x}px 88px` } as CSSProperties}>
      <line x1={x} y1={88} x2={x} y2={30} stroke="var(--tp-text)" strokeWidth={2} />
      <line x1={x} y1={72} x2={x} y2={28} stroke={on ? 'var(--tp-accent)' : 'var(--tp-muted)'} strokeWidth={4} />
      <circle cx={x} cy={88} r={3} fill="var(--tp-panel)" stroke="var(--tp-text)" strokeWidth={1.5} />
    </g>
  );
  return (
    <div className="flex flex-col items-center gap-1.5" data-testid="wiper-indicator" data-state={unknown ? 'nd' : on ? 'on' : 'off'}>
      <svg viewBox="0 0 200 100" style={{ width: size, maxWidth: '100%' }} aria-label={`Limpador ${unknown ? 'N/D' : on ? 'ligado' : 'desligado'}`} role="img">
        <path d="M10 92 Q12 18 100 12 Q188 18 190 92 Z" fill="none" stroke="var(--tp-line-strong)" strokeWidth={1.5} />
        <path d="M10 92 H190" stroke="var(--tp-line-strong)" strokeWidth={1} />
        {arm(60)}
        {arm(135)}
      </svg>
      <div className="text-center">
        <div className={`font-cond text-sm font-semibold uppercase tracking-[0.08em] ${unknown ? 'text-dim' : on ? 'text-accent' : 'text-muted'}`}>
          {unknown ? 'N/D' : on ? 'Ligado' : 'Desligado'}
        </div>
        <div className="text-[11px] text-dim" title="O SCS Telemetry SDK expõe apenas o estado ligado/desligado do limpador.">
          Estágio: N/D (SDK só informa liga/desliga)
        </div>
      </div>
    </div>
  );
}
