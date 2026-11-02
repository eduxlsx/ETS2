import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TimeChart } from '../components/Charts';
import { Card, Num, PageHeader, Segmented, Stat } from '../components/ui';
import { api } from '../lib/api';
import { ND, consumption, dateTime, distance, duration, fixed, fuel, speed } from '../lib/format';
import { useStore } from '../lib/telemetryStore';

type Kind = 'trips' | 'sessions' | 'trucks' | 'trailers';
const TABS: { id: Kind; label: string }[] = [
  { id: 'trips', label: 'Viagens (trips)' },
  { id: 'sessions', label: 'Sessões' },
  { id: 'trucks', label: 'Caminhões usados' },
  { id: 'trailers', label: 'Reboques' },
];

export function History() {
  const settings = useStore((s) => s.settings);
  const [tab, setTab] = useState<Kind>('trips');
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [summary, setSummary] = useState<Record<string, number | null> | null>(null);
  const [samples, setSamples] = useState<Record<string, any>[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.history(tab, 300).then(setRows).catch((e) => setError(String(e)));
  }, [tab]);
  useEffect(() => {
    api.summary().then(setSummary).catch(() => {});
    api.samples(Date.now() - 24 * 3600_000).then((s) => setSamples(s.map((r) => ({ ...r, t: r.ts })))).catch(() => {});
  }, []);

  const d = (km: number | null | undefined) => `${distance(km ?? null, settings).text} ${distance(0, settings).unit}`;
  const sessionsChart = tab === 'sessions' ? [...rows].reverse().map((r) => ({ name: `#${r.id}`, km: distance(r.distance_km, settings).value })) : [];

  return (
    <div className="grid grid-cols-1 gap-px bg-line xl:grid-cols-2">
      <div className="xl:col-span-2">
        <PageHeader title="Histórico" code="06" />
      </div>
      <Card title="Resumo geral (dados reais)" code="H-01" className="xl:col-span-2">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="Distância total" value={summary ? distance(summary.totalDistanceKm, settings, 0).text : ND} unit={distance(0, settings).unit} tone="accent" />
          <Stat label="Tempo total dirigindo" value={summary ? duration(summary.totalDrivingS) : ND} />
          <Stat label="Combustível total" value={summary ? fuel(summary.totalFuelUsedL, settings).text : ND} unit={fuel(0, settings).unit} />
          <Stat label="Consumo médio" value={summary ? consumption(summary.avgConsumptionL100, settings).text : ND} unit={consumption(0, settings).unit} />
          <Stat label="Maior velocidade" value={summary ? speed(summary.maxSpeedKmh, settings).text : ND} unit={speed(0, settings).unit} />
          <Stat label="Sessões / caminhões" value={summary ? `${summary.sessions} / ${summary.trucks}` : ND} />
        </div>
      </Card>

        <Card title="Velocidade — últimas 24 h" code="H-02">
          <TimeChart data={samples.map((s) => ({ t: s.t, v: speed(s.speed_kmh, settings).value }))} series={[{ key: 'v', name: 'Velocidade', color: 'var(--tp-accent)', area: true }]} unit={speed(0, settings).unit} emptyText="Sem amostras nas últimas 24 h." />
        </Card>
        <Card title="Combustível — últimas 24 h" code="H-03">
          <TimeChart data={samples.map((s) => ({ t: s.t, f: fuel(s.fuel_l, settings, 1).value }))} series={[{ key: 'f', name: 'Combustível', color: 'var(--tp-ok)', area: true }]} unit={fuel(0, settings).unit} emptyText="Sem amostras nas últimas 24 h." />
        </Card>

      <Card
        title="Registros"
        code="H-04"
        className="xl:col-span-2"
        action={
          <div className="flex gap-2">
            {(['csv', 'json'] as const).map((f) => (
              <a key={f} href={api.exportUrl(tab, f)} className="tp-btn" download>
                Exportar {f.toUpperCase()}
              </a>
            ))}
          </div>
        }
      >
        <div className="mb-3 overflow-x-auto">
          <Segmented value={tab} onChange={setTab} options={TABS.map((t) => [t.id, t.label] as [Kind, string])} />
        </div>
        {error && <p className="text-xs text-crit">{error}</p>}
        {tab === 'sessions' && sessionsChart.length > 1 && (
          <div className="mb-4 h-40">
            <ResponsiveContainer>
              <BarChart data={sessionsChart} margin={{ left: -18 }}>
                <CartesianGrid stroke="var(--tp-line)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--tp-line-strong)" tick={{ fill: 'var(--tp-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                <YAxis stroke="var(--tp-line)" axisLine={false} tickLine={false} tick={{ fill: 'var(--tp-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                <Tooltip cursor={{ fill: 'var(--tp-panel-2)' }} contentStyle={{ background: 'var(--tp-panel-2)', border: '1px solid var(--tp-line-strong)', borderRadius: 0, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                <Bar dataKey="km" name="Distância" fill="var(--tp-accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="max-h-[520px] overflow-auto border border-line">
          <table className="tp-table min-w-[640px]">
            <thead>
              {tab === 'trips' || tab === 'sessions' ? (
                <tr>
                  <th>#</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th className="num">Distância</th>
                  <th className="num">Tempo</th>
                  <th className="num">Combustível</th>
                  <th className="num">Consumo</th>
                  <th className="num">Vel. máx</th>
                  <th>Caminhão</th>
                </tr>
              ) : (
                <tr>
                  <th>Identificador</th>
                  <th>Nome</th>
                  <th>Primeiro uso</th>
                  <th>Último uso</th>
                  <th className="num">Distância</th>
                </tr>
              )}
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="tp-hatch !h-16 text-center text-dim">Nenhum registro ainda.</td>
                </tr>
              )}
              {rows.map((r, i) =>
                tab === 'trips' || tab === 'sessions' ? (
                  <tr key={i}>
                    <td className="digits">{r.id}{r.is_current ? ' •' : ''}</td>
                    <td className="digits"><Num value={dateTime(r.started_at)} /></td>
                    <td className="digits">{r.ended_at ? <Num value={dateTime(r.ended_at)} /> : r.is_current ? 'atual' : '—'}</td>
                    <td className="num"><Num value={d(r.distance_km)} /></td>
                    <td className="num">{duration(r.driving_s)}</td>
                    <td className="num"><Num value={fuel(r.fuel_used_l, settings, 1).text} /></td>
                    <td className="num"><Num value={consumption(r.avg_consumption_l100, settings).text} /></td>
                    <td className="num">{fixed(speed(r.max_speed_kmh, settings).value, 0)}</td>
                    <td className="max-w-[200px] truncate text-muted">{r.truck_name ?? '—'}</td>
                  </tr>
                ) : (
                  <tr key={i}>
                    <td className="digits text-muted">{r.truck_key ?? r.trailer_key}</td>
                    <td>{[r.brand, r.name].filter(Boolean).join(' ') || '—'}</td>
                    <td className="digits"><Num value={dateTime(r.first_seen)} /></td>
                    <td className="digits"><Num value={dateTime(r.last_seen)} /></td>
                    <td className="num"><Num value={d(r.distance_km)} /></td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
