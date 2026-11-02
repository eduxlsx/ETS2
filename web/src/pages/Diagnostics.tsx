import { useEffect, useState } from 'react';
import type { DiagnosticsReport } from '../../../shared/types';
import { Card, PageHeader, Row } from '../components/ui';
import { api } from '../lib/api';
import { ND } from '../lib/format';
import { useStore } from '../lib/telemetryStore';

/** Canais e disponibilidade — resumo do docs/SDK-CHANNELS.md. */
const CHANNELS: [string, string, string][] = [
  ['Velocidade', 'truck.speed (m/s)', 'Disponível'],
  ['Limite da via', 'truck.navigation.speed.limit (m/s)', 'Disponível (0 = sem limite → N/D)'],
  ['RPM / RPM máx.', 'truck.engine.rpm / config.rpm.limit', 'Disponível'],
  ['Marcha / painel', 'truck.engine.gear / truck.displayed.gear', 'Disponível'],
  ['Freio motor / retarder', 'truck.brake.motor / truck.brake.retarder', 'Disponível'],
  ['Temperaturas água/óleo', 'truck.water.temperature / truck.oil.temperature (°C)', 'Disponível'],
  ['Pressão do óleo', 'truck.oil.pressure (psi)', 'Disponível'],
  ['Bateria', 'truck.battery.voltage (V)', 'Disponível'],
  ['Combustível / capacidade', 'truck.fuel.amount / config.fuel.capacity (L)', 'Disponível'],
  ['Consumo / autonomia', 'truck.fuel.consumption.average (L/km) / truck.fuel.range (km)', 'Disponível'],
  ['Odômetro', 'truck.odometer (km)', 'Disponível'],
  ['Luzes', 'truck.light.* (posição, baixo, alto, aux, setas, freio, ré, giroflex, painel)', 'Disponível'],
  ['Limpador', 'truck.wipers (bool)', 'Só ligado/desligado — estágio N/D'],
  ['Suspensão', 'truck.wheel.susp.deflection (m)', 'Disponível por roda'],
  ['Desgaste', 'truck.wear.* / trailer.wear.*', 'Disponível'],
  ['Horário do jogo', 'game.time (min)', 'Disponível'],
  ['Chuva / intensidade / visibilidade', '—', 'NÃO existe no SDK → N/D'],
  ['Elevação pneumática da suspensão', '—', 'NÃO existe no SDK → N/D'],
  ['Cor do caminhão', '—', 'NÃO existe no SDK'],
];

/** Resultado no formato de relatório de teste. */
export function CheckMark({ ok }: { ok: boolean | null }) {
  if (ok === true) return <span className="tp-check text-ok">[ OK ]</span>;
  if (ok === false) return <span className="tp-check text-crit">[FALHA]</span>;
  return <span className="tp-check text-dim">[ -- ]</span>;
}

const STATE_LABEL: Record<string, string> = {
  connected: 'Conectado',
  demo: 'DEMO (simulador)',
  'game-not-running': 'Jogo fechado',
  'plugin-missing': 'Plugin ausente',
  'waiting-sdk': 'Aguardando SDK',
  incompatible: 'Incompatível',
  stale: 'Sem atualização',
};

export function Diagnostics() {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const socket = useStore((s) => s.socket);
  const version = useStore((s) => s.serverVersion);
  const load = () => {
    setLoading(true);
    api
      .diagnostics()
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <div className="grid grid-cols-1 gap-px bg-line lg:grid-cols-12">
      <div className="lg:col-span-12">
        <PageHeader title="Diagnóstico" code="08">
          <button onClick={load} className="tp-btn" disabled={loading}>
            {loading ? 'Verificando…' : 'Verificar novamente'}
          </button>
        </PageHeader>
      </div>
      <Card title="Verificação do SDK e da conexão" code="D-01" className="lg:col-span-7" pad={false}>
        {!report ? (
          <p className="p-3 text-sm text-muted">Verificando…</p>
        ) : (
          <ul data-testid="checks">
            {report.checks.map((c, i) => (
              <li key={c.id} className="grid grid-cols-[28px_64px_1fr] items-start gap-x-2 border-b border-line px-3 py-2 last:border-b-0">
                <span className="digits text-[11px] leading-5 text-dim">{String(i + 1).padStart(2, '0')}</span>
                <span className="leading-5">
                  <CheckMark ok={c.ok} />
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] leading-5">{c.label}</div>
                  <div className="break-all text-[11px] leading-4 text-muted">{c.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Estado" code="D-02" className="lg:col-span-5">
        {report ? (
          <>
            <Row label="Estado">{STATE_LABEL[report.connection.state] ?? report.connection.state}</Row>
            <Row label="Mensagem">
              <span className="font-sans whitespace-normal">{report.connection.message}</span>
            </Row>
            <Row label="WebSocket">{socket}</Row>
            <Row label="Servidor">{version ?? ND}</Row>
            <Row label="Processo do jogo">{report.gameProcess ?? ND}</Row>
            <Row label="Pasta do jogo">{report.gameInstallPath ?? ND}</Row>
            <Row label="Revisão do plugin">{report.pluginRevision ?? ND}</Row>
            <Row label="Versão telemetria do jogo (API)">{report.gameVersion ?? ND}</Row>
            <Row label="Versão do SDK de telemetria">{report.telemetryVersion ?? ND}</Row>
            <Row label="Tentativas de reconexão">{report.connection.reconnectAttempts}</Row>
            <Row label="Plataforma / Node">{`${report.platform} / ${report.nodeVersion}`}</Row>
          </>
        ) : (
          <p className="text-sm text-muted">Verificando…</p>
        )}
      </Card>
      <Card title="Instalação do plugin de telemetria" code="D-03" className="lg:col-span-12">
        <ol className="grid gap-3 text-[13px] leading-5">
          {[
            <>
              Execute <span className="tp-code">scripts\install-plugin.ps1</span> (baixa o scs-sdk-plugin V.1.12.1 oficial do GitHub) — ou baixe manualmente em github.com/RenCloud/scs-sdk-plugin/releases.
            </>,
            <>
              Copie <span className="tp-code">Win64\scs-telemetry.dll</span> para <span className="tp-code">…\Euro Truck Simulator 2\bin\win_x64\plugins\</span> (crie a pasta "plugins" se não existir).
            </>,
            <>Abra o jogo e aceite a mensagem "Advanced SDK features" (o jogo pergunta ao carregar plugins).</>,
            <>Volte aqui: o estado deve mudar para "Conectado".</>,
          ].map((step, i) => (
            <li key={i} className="grid grid-cols-[32px_1fr] gap-2">
              <span className="digits flex h-6 w-6 items-center justify-center border border-line-strong text-[12px] text-accent">{i + 1}</span>
              <span className="text-muted">{step}</span>
            </li>
          ))}
        </ol>
      </Card>
      <Card title="Canais do SDK utilizados" code="D-04" className="lg:col-span-12">
        <div className="overflow-x-auto border border-line">
          <table className="tp-table min-w-[640px]">
            <thead>
              <tr>
                <th>Informação</th>
                <th>Canal</th>
                <th>Disponibilidade</th>
              </tr>
            </thead>
            <tbody>
              {CHANNELS.map(([a, b, c]) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td className="digits text-muted">{b}</td>
                  <td className={c.startsWith('NÃO') || c.startsWith('Só') ? 'text-warn' : 'text-ok'}>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
