import { Badge, Card, Limitation, Meter, PageHeader, Row, Stat, wearTone } from '../components/ui';
import { ND, distance, fixed, pct } from '../lib/format';
import { useStore } from '../lib/telemetryStore';
import { TrailerView } from '../vehicles/trailers/TrailerView';
import { getTrailerDrawing } from '../vehicles/trailers';
import { trailerLabel } from '../vehicles/VehicleView';
import { SuspensionPanel } from './TruckPage';

export function TrailerPage() {
  const frame = useStore((s) => s.frame);
  const settings = useStore((s) => s.settings);
  const series = useStore((s) => s.series);
  if (!frame) return null;
  const tr = frame.trailer;
  const w = frame.wear;
  const limit = settings.alerts.wearPercent;
  const type = getTrailerDrawing(tr.modelKey).type;
  const source = tr.modelSource ?? (settings.trailerModel === 'auto' ? 'auto' : 'manual');
  const marks = [limit / 100, Math.min(1, (limit * 2) / 100)];
  return (
    <div className="grid grid-cols-1 gap-px bg-line lg:grid-cols-12">
      <div className="lg:col-span-12">
        <PageHeader title="Reboque" code="04" />
      </div>
      <Card
        title="Reboque / implemento"
        code="R-01"
        className="lg:col-span-12"
        action={<Badge tone={tr.attached ? 'ok' : 'off'}>{tr.attached === null ? ND : tr.attached ? 'Engatado' : 'Desengatado'}</Badge>}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-cond text-[15px] font-semibold tracking-[0.04em]">{trailerLabel(type)}</span>
          <Badge tone={source === 'auto' ? 'ok' : source === 'manual' ? 'accent' : 'warn'}>{source === 'auto' ? 'Auto' : source === 'manual' ? 'Manual' : 'Aproximado'}</Badge>
          {tr.bodyType && <span className="digits text-[11px] text-dim">body_type: {tr.bodyType}</span>}
        </div>
        <div className={tr.attached ? '' : 'opacity-40'}>
          <TrailerView modelKey={tr.modelKey} lights={frame.lights} className="block h-auto max-h-[300px] w-full" />
        </div>
        {!tr.attached && <p className="mt-1 text-xs text-dim">Nenhum reboque engatado — o desenho mostra o último tipo identificado.</p>}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Peso da carga" value={tr.cargoMassKg === null ? ND : fixed(tr.cargoMassKg / 1000, 1)} unit="t" />
          <Stat label="Distância com este reboque" value={distance(tr.localDistanceKm, settings).text} unit={distance(0, settings).unit} hint="calculada localmente" />
          <Stat label="Reboques no conjunto" value={String(tr.count)} />
          <Stat label="Rodas" value={tr.wheelCount === null ? null : String(tr.wheelCount)} />
        </div>
        {source === 'fallback' && <Limitation>O tipo de carroceria não foi reconhecido pelos identificadores do SDK; o desenho de baú é uma aproximação. Escolha o tipo em Configurações › Veículo.</Limitation>}
      </Card>
      <Card title="Identificação" code="R-02" className="lg:col-span-6">
        <Row label="Nome">{tr.name ?? ND}</Row>
        <Row label="Marca">{tr.brand ?? ND}</Row>
        <Row label="ID">{tr.id ?? ND}</Row>
        <Row label="Carroceria (body_type)">{tr.bodyType ?? ND}</Row>
        <Row label="Acessório da carga">{tr.cargoAccessoryId ?? ND}</Row>
        <Row label="Tipo de engate">{tr.chainType ?? ND}</Row>
        <Row label="Placa">{tr.licensePlate ?? ND}</Row>
        <Row label="Carga">
          <span className="font-sans">{tr.cargoName ?? ND}</span>
        </Row>
        <Row label="Carregado">{tr.cargoLoaded === null ? ND : tr.cargoLoaded ? 'sim' : 'não'}</Row>
      </Card>
      <Card title="Desgaste do reboque" code="R-03" className="lg:col-span-6">
        <div className="grid gap-3">
          <Meter label="Chassi" right={pct(w.trailerChassis, 1)} value={w.trailerChassis} tone={wearTone(w.trailerChassis, limit)} markers={marks} />
          <Meter label="Rodas" right={pct(w.trailerWheels, 1)} value={w.trailerWheels} tone={wearTone(w.trailerWheels, limit)} markers={marks} />
          <Meter label="Carroceria" right={pct(w.trailerBody, 1)} value={w.trailerBody} tone={wearTone(w.trailerBody, limit)} markers={marks} />
          <Meter label="Dano à carga" right={pct(w.cargo, 1)} value={w.cargo} tone={wearTone(w.cargo, limit)} markers={marks} />
        </div>
        <Limitation>O SDK não possui odômetro de reboque: a distância é somada pelo TRUCKPULSE enquanto o reboque está engatado e fica salva por reboque (id + placa).</Limitation>
      </Card>
      <Card title="Suspensão do reboque" code="R-04" className="lg:col-span-12">
        <SuspensionPanel s={frame.suspension} series={series} only="trailer" />
      </Card>
    </div>
  );
}
