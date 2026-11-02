/** Componentes de painel reutilizados por várias páginas. */
import type { CSSProperties } from 'react';
import type { Alert, EnvironmentData, Settings, TelemetryFrame } from '../../../shared/types';
import { ND, fixed, gameMinutes, speed } from '../lib/format';
import { setState, useStore } from '../lib/telemetryStore';
import { api } from '../lib/api';
import { Card, Limitation, Row } from './ui';

/** Placa real de limite de velocidade (círculo branco, anel vermelho, número em DIN). */
export function SpeedLimitSign({ kmh, settings, size = 64 }: { kmh: number | null; settings: Settings; size?: number }) {
  const v = speed(kmh, settings);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border-crit bg-white text-black"
      style={{ width: size, height: size, borderWidth: Math.max(4, Math.round(size * 0.094)), fontSize: size * 0.38, fontFamily: 'var(--font-cond)', fontWeight: 600 }}
      title={kmh === null ? 'O jogo não informou limite para esta via' : `Limite da via: ${v.text} ${v.unit}`}
      data-testid="speed-limit-sign"
    >
      <span className={kmh === null ? 'text-[0.55em] text-neutral-500' : 'leading-none'}>{kmh === null ? ND : v.text}</span>
    </div>
  );
}

const LEVEL: Record<Alert['level'], { code: string; color: string }> = {
  critical: { code: 'CRIT', color: 'var(--tp-crit)' },
  warning: { code: 'AVISO', color: 'var(--tp-warn)' },
  info: { code: 'INFO', color: 'var(--tp-muted)' },
};

/** Quadro de anunciadores: código do nível + mensagem, fila horizontal. */
export function AlertsBar({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) return null;
  return (
    <div className="flex shrink-0 gap-px overflow-x-auto border-b border-line bg-line" data-testid="alerts" role="alert">
      {alerts.map((a) => {
        const l = LEVEL[a.level];
        return (
          <div
            key={a.id}
            className={`flex min-h-[30px] flex-none items-stretch border bg-panel ${a.level === 'critical' ? 'tp-flash' : ''}`}
            style={{ '--c': l.color, borderColor: l.color } as CSSProperties}
          >
            <b className="font-cond flex items-center px-2 text-[11px] font-semibold tracking-[0.1em] text-accent-ink" style={{ background: l.color }}>
              {l.code}
            </b>
            <span className="flex items-center px-3 text-[13px] whitespace-nowrap" style={{ background: `color-mix(in srgb, ${l.color} 10%, transparent)` }}>
              {a.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function EnvironmentCard({ env, frame, code, className }: { env: EnvironmentData; frame: TelemetryFrame; code?: string; className?: string }) {
  return (
    <Card title="Clima e ambiente" code={code} className={className}>
      <Row label="Horário do jogo">{env.gameTimeLabel ? `${env.weekday?.toUpperCase() ?? ''} ${env.gameTimeLabel}` : ND}</Row>
      <Row label="Período" title="Derivado do horário do jogo (não é um canal de clima)">
        <span className="font-sans">{env.dayPhase ?? ND}</span>
      </Row>
      <Row label="Chuva" title="O SCS Telemetry SDK não expõe clima">
        <span className="tp-nd" title="O SCS Telemetry SDK não expõe clima">{ND}</span>
      </Row>
      <Row label="Intensidade da chuva">
        <span className="tp-nd" title="O SCS Telemetry SDK não expõe clima">{ND}</span>
      </Row>
      <Row label="Pista (superfície)" title="Canal truck.wheel.substance — material sob as rodas">
        <span className="font-sans">{env.roadSurfaces.length ? env.roadSurfaces.join(', ') : ND}</span>
      </Row>
      <Row label="Visibilidade">
        <span className="tp-nd" title="O SCS Telemetry SDK não expõe visibilidade">{ND}</span>
      </Row>
      <Row label="Próximo descanso">{gameMinutes(frame.game.restStopMin)}</Row>
      <Row label="Escala de tempo">{frame.game.timeScale ? `${fixed(frame.game.timeScale, 0)}×` : ND}</Row>
      <Limitation>
        O SCS Telemetry SDK (e o plugin scs-sdk-plugin) não fornece canais de chuva, intensidade da chuva nem
        visibilidade. Esses campos ficam "N/D" em vez de serem estimados — inclusive o limpador ligado <b>não</b> é
        usado para deduzir chuva. A superfície da pista vem do canal real de substância das rodas.
      </Limitation>
    </Card>
  );
}

/** Painel "SEM SINAL" — fundo listrado, mensagem e ações. */
export function NoDataNotice({ frame }: { frame: TelemetryFrame | null }) {
  const mode = useStore((s) => s.mode);
  if (!frame) {
    return (
      <div className="tp-hatch bg-panel px-3 py-3" data-testid="no-data">
        <div className="font-cond text-base font-semibold uppercase tracking-[0.06em]">Sem sinal</div>
        <p className="text-sm text-muted">Aguardando o servidor TRUCKPULSE…</p>
      </div>
    );
  }
  return (
    <div className="tp-hatch flex flex-wrap items-center gap-x-4 gap-y-2 bg-panel px-3 py-3" data-testid="no-data">
      <div className="min-w-0 flex-1">
        <div className="font-cond text-base leading-5 font-semibold uppercase tracking-[0.06em]">Sem sinal do jogo</div>
        <p className="text-sm text-muted">
          {frame.connection.message} Os painéis continuam visíveis e mostram N/D até a conexão.
        </p>
      </div>
      <div className="flex gap-1">
        <button className="tp-btn text" onClick={() => (location.hash = '#/diagnostico')}>
          Abrir diagnóstico
        </button>
        {mode !== 'demo' && (
          <button
            className="tp-btn text"
            onClick={() => {
              setState({ mode: 'demo' });
              api.setMode('demo').catch(() => setState({ mode: 'live' }));
            }}
          >
            Ativar DEMO
          </button>
        )}
      </div>
    </div>
  );
}
