import { useEffect, useState } from 'react';
import { DutyMeters, DutyTimeline } from '../docs/Duty';
import { LedgerModule } from '../docs/PaperworkModule';
import { Checklist } from '../docs/Checklist';
import { DOC_KIND, STATUS_LABEL } from '../docs/DocView';
import type { TripDocSummary, JobRecord } from '../../../shared/types';
import { ChartLegend, TimeChart } from '../components/Charts';
import { Card, Meter, Odometer, PageHeader, Row, Stat } from '../components/ui';
import { api } from '../lib/api';
import { ND, consumption, dateTime, distance, duration, fuel, isNum, speed } from '../lib/format';
import { useStore } from '../lib/telemetryStore';

export function TripPage() {
  const frame = useStore((s) => s.frame);
  const settings = useStore((s) => s.settings);
  const series = useStore((s) => s.series);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const docRev = useStore((s) => s.docRev);
  const dutyLive = useStore((s) => s.duty);
  const [duty, setDuty] = useState<Awaited<ReturnType<typeof api.duty>> | null>(null);
  const [cur, setCur] = useState<{ job: JobRecord | null; docs: TripDocSummary[] } | null>(null);
  useEffect(() => {
    const load = () => api.duty().then(setDuty).catch(() => {});
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [frame?.source]);
  useEffect(() => {
    api.currentJob().then(setCur).catch(() => setCur(null));
  }, [docRev, frame?.source]);
  if (!frame) return null;
  const t = frame.trip;
  const job = frame.job;
  const d = (km: number | null, digits = 1) => distance(km, settings, digits);
  const unitD = d(0).unit;

  const reset = async () => {
    setBusy(true);
    try {
      await api.resetTrip();
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  const consSeries = series.map((p) => ({ t: p.t, trip: consumption(p.tripConsumption, settings).value, game: consumption(p.consumption, settings).value }));
  const done = isNum(job.plannedDistanceKm) && isNum(job.routeDistanceKm) && job.plannedDistanceKm > 0 ? Math.max(0, job.plannedDistanceKm - job.routeDistanceKm) : null;

  return (
    <div className="grid grid-cols-1 gap-px bg-line lg:grid-cols-12">
      <div className="lg:col-span-12">
        <PageHeader title="Viagem" code="03" />
      </div>
      <Card
        title="Trip atual"
        code="V-01"
        className="lg:col-span-12"
        action={
          confirm ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted">Zerar o trip? (o odômetro do jogo não muda)</span>
              <button onClick={reset} disabled={busy} className="tp-btn !border-crit !bg-crit !text-accent-ink">
                Zerar
              </button>
              <button onClick={() => setConfirm(false)} className="tp-btn">
                Cancelar
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirm(true)} className="tp-btn" data-testid="trip-reset">
              Zerar trip
            </button>
          )
        }
      >
        <div className="grid gap-5 xl:grid-cols-[auto_1fr] xl:items-end">
          <div>
            <div className="tp-label mb-1">Distância</div>
            <Odometer value={d(t.distanceKm, 2).value} intDigits={5} decimals={1} unit={unitD} size="lg" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Tempo dirigindo" value={duration(t.drivingTimeS)} hint={`desde ${dateTime(t.startedAt)}`} />
            <Stat label="Velocidade média" value={speed(t.avgSpeedKmh, settings).text} unit={speed(0, settings).unit} />
            <Stat label="Velocidade máxima" value={speed(t.maxSpeedKmh, settings).text} unit={speed(0, settings).unit} />
            <Stat label="Combustível usado" value={fuel(t.fuelUsedL, settings, 1).text} unit={fuel(0, settings).unit} />
            <Stat label="Consumo médio" value={consumption(t.avgConsumptionL100, settings).text} unit={consumption(0, settings).unit} />
          </div>
        </div>
        <p className="mt-3 text-[11px] text-dim">
          {t.persisted ? 'Salvo automaticamente no banco SQLite a cada 5 s.' : 'Modo DEMO: este trip é temporário e não é salvo.'} O trip soma a
          variação do odômetro real do jogo e é independente dele.
        </p>
      </Card>

      <Card title="Quilometragem" code="V-02" className="lg:col-span-6">
        <Row label="Odômetro real do caminhão">{frame.motion.odometerKm !== null ? `${d(frame.motion.odometerKm, 1).text} ${unitD}` : ND}</Row>
        <Row label="Trip">{`${d(t.distanceKm, 2).text} ${unitD}`}</Row>
        <Row label="Distância na sessão">{`${d(t.sessionDistanceKm, 2).text} ${unitD}`}</Row>
        <Row label="Tempo dirigindo na sessão">{duration(t.sessionDrivingTimeS)}</Row>
        <Row label="Sessão iniciada">{t.sessionStartedAt ? dateTime(t.sessionStartedAt) : ND}</Row>
        <Row label="Tempo decorrido do trip">{duration(t.elapsedS)}</Row>
        <Row label="Escala do mapa (jogo)">{frame.game.timeScale ? `${frame.game.timeScale.toFixed(1).replace('.', ',')}×` : ND}</Row>
        <p className="mt-2 text-[11px] text-dim">
          Distâncias em km do jogo: o mapa do ETS2 é comprimido, então o odômetro avança cerca de "escala"× mais rápido que a velocidade real. A
          velocidade média usa a velocidade real (canal truck.speed).
        </p>
      </Card>
      <Card title="Entrega atual" code="V-03" className="lg:col-span-6">
        <Row label="Em entrega">{job.onJob === null ? ND : job.onJob ? 'sim' : 'não'}</Row>
        <Row label="Carga">
          <span className="font-sans">{job.cargo ?? ND}</span>
        </Row>
        <Row label="Origem">
          <span className="font-sans">{[job.sourceCity, job.sourceCompany].filter(Boolean).join(' · ') || ND}</span>
        </Row>
        <Row label="Destino">
          <span className="font-sans">{[job.destinationCity, job.destinationCompany].filter(Boolean).join(' · ') || ND}</span>
        </Row>
        <Row label="Distância planejada">{job.plannedDistanceKm !== null ? `${d(job.plannedDistanceKm, 0).text} ${unitD}` : ND}</Row>
        <Row label="Rota restante (GPS)">{job.routeDistanceKm !== null ? `${d(job.routeDistanceKm, 1).text} ${unitD}` : ND}</Row>
        <Row label="Tempo de rota (GPS)">{duration(job.routeTimeS)}</Row>
        {done !== null && (
          <div className="mt-3">
            <Meter label="Rota percorrida" right={`${d(done, 0).text} / ${d(job.plannedDistanceKm, 0).text} ${unitD}`} value={done} max={job.plannedDistanceKm ?? 1} tone="accent" />
          </div>
        )}
      </Card>

      <Card title="Jornada do motorista" code="V-05" className="lg:col-span-6">
        <DutyMeters s={dutyLive ?? duty?.summary ?? frame.duty ?? null} />
        {duty && (
          <div className="mt-3">
            <div className="tp-label mb-1">Linha do tempo · dia do jogo</div>
            <DutyTimeline day={duty.day} segments={duty.segments} />
          </div>
        )}
      </Card>
      <LedgerModule className="lg:col-span-6" />
      <Card title="Documentos da viagem" code="V-07" className="lg:col-span-6" action={<a className="tp-btn" href="#/documentos">Abrir pasta</a>}>
        {!cur?.docs.length ? (
          <p className="text-[13px] text-dim">Nenhum documento no frete atual.</p>
        ) : (
          <ul>
            {cur.docs.map((d) => (
              <li key={d.id} className="flex min-h-9 items-center gap-2 border-b border-line text-[13px] last:border-b-0">
                <span className="digits w-12 shrink-0 text-[11px] text-dim">{DOC_KIND[d.type]?.k}</span>
                <span className="min-w-0 flex-1 truncate">{d.title}</span>
                <span className="tp-label">{STATUS_LABEL[d.status] ?? d.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Checklist pré-viagem" code="V-08" className="lg:col-span-6">
        <Checklist frame={frame} jobId={cur?.job?.id ?? null} initial={cur?.job?.checklist ?? null} />
      </Card>

      <Card
        title="Consumo durante a viagem"
        code="V-04"
        className="lg:col-span-12"
        action={
          <ChartLegend
            items={[
              { name: 'Trip', color: 'var(--tp-accent)' },
              { name: 'Médio (jogo)', color: 'var(--tp-accent-2)', dashed: true },
            ]}
          />
        }
      >
        <TimeChart
          data={consSeries}
          series={[
            { key: 'trip', name: 'Consumo do trip', color: 'var(--tp-accent)' },
            { key: 'game', name: 'Consumo médio (jogo)', color: 'var(--tp-accent-2)', dashed: true },
          ]}
          unit={consumption(0, settings).unit}
          height={220}
          testId="trip-consumption-chart"
        />
      </Card>
    </div>
  );
}
