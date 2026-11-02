import type { SuspensionData, WheelData } from '../../../shared/types';
import { TimeChart } from '../components/Charts';
import { LightingPanel } from '../components/Telltales';
import { Badge, Card, Limitation, Meter, Num, PageHeader, Row, Stat } from '../components/ui';
import { WiperIndicator } from '../components/WiperIndicator';
import { ND, fixed, yesNo } from '../lib/format';
import { useStore } from '../lib/telemetryStore';
import { groupAxles } from '../vehicles/TruckSide';
import { VehicleView } from '../vehicles/VehicleView';

const mm = (m: number | null) => (m === null ? ND : `${fixed(m * 1000, 1)} mm`);

function WheelTable({ wheels, title }: { wheels: WheelData[]; title: string }) {
  if (!wheels.length) return <p className="text-xs text-dim">{title}: sem rodas reportadas pelo SDK.</p>;
  return (
    <div className="min-w-0">
      <div className="tp-label mb-1.5">{title}</div>
      <div className="overflow-x-auto border border-line">
        <table className="tp-table">
          <thead>
            <tr>
              <th>#</th>
              <th className="num">Posição Z</th>
              <th className="num">Deflexão</th>
              <th className="num">No chão</th>
              <th className="num">Elevada</th>
              <th className="num">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {wheels.map((w) => (
              <tr key={w.index}>
                <td className="digits">
                  {w.index}
                  {w.position ? (w.position.x < 0 ? ' E' : ' D') : ''}
                </td>
                <td className="num">
                  <Num value={w.position ? `${fixed(w.position.z, 2)} m` : ND} />
                </td>
                <td className="num">
                  <Num value={mm(w.suspDeflection)} />
                </td>
                <td className="num">{yesNo(w.onGround, 'sim', 'não')}</td>
                <td className="num">{w.liftable ? `${fixed((w.lift ?? 0) * 100, 0)}%` : '—'}</td>
                <td className="num !font-sans text-muted">{[w.steerable && 'direcional', w.powered && 'tração'].filter(Boolean).join(', ') || 'livre'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Escalas de deflexão por eixo (±60 mm, marcador no zero). */
function AxleMeters({ wheels, prefix }: { wheels: WheelData[]; prefix: string }) {
  const groups = groupAxles(wheels);
  if (!groups.length) return null;
  return (
    <div className="grid gap-2.5">
      {groups.map((g, i) => (
        <Meter
          key={i}
          label={`${prefix} ${i + 1}${g.lift > 0.5 ? ' (erguido)' : ''}`}
          right={g.defl === null ? ND : `${fixed(g.defl * 1000, 1)} mm`}
          value={g.defl === null ? null : g.defl * 1000 + 60}
          max={120}
          tone="accent"
          markers={[60]}
        />
      ))}
    </div>
  );
}

export function SuspensionPanel({ s, series, only }: { s: SuspensionData; series: { t: number; rearSusp: number | null; trailerSusp: number | null }[]; only?: 'truck' | 'trailer' }) {
  const data = series.map((p) => ({ t: p.t, rear: p.rearSusp === null ? null : p.rearSusp * 1000, trailer: p.trailerSusp === null ? null : p.trailerSusp * 1000 }));
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Traseira do cavalo" value={s.truckRearAvgDeflection === null ? ND : fixed(s.truckRearAvgDeflection * 1000, 1)} unit="mm" hint="deflexão média" />
        <Stat label="Oscilação traseira" value={fixed(s.truckRearOscillationMm, 1)} unit="mm" hint="desvio padrão ~2 s" />
        <Stat label="Suspensão do reboque" value={s.trailerAvgDeflection === null ? ND : fixed(s.trailerAvgDeflection * 1000, 1)} unit="mm" ndReason="Sem reboque engatado ou sem rodas reportadas" />
        <Stat label="Oscilação reboque" value={fixed(s.trailerOscillationMm, 1)} unit="mm" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone={s.liftAxle ? 'accent' : 'off'}>Eixo elevável cavalo: {s.liftAxle === null ? ND : s.liftAxle ? 'elevado' : 'abaixado'}</Badge>
        <Badge tone={s.trailerLiftAxle ? 'accent' : 'off'}>Eixo elevável reboque: {s.trailerLiftAxle === null ? ND : s.trailerLiftAxle ? 'elevado' : 'abaixado'}</Badge>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="grid content-start gap-4">
          {only !== 'trailer' && <AxleMeters wheels={s.truckWheels} prefix="Eixo do cavalo" />}
          {only !== 'truck' && <AxleMeters wheels={s.trailerWheels} prefix="Eixo do reboque" />}
        </div>
        <TimeChart
          data={data}
          series={[
            ...(only !== 'trailer' ? [{ key: 'rear', name: 'Traseira cavalo', color: 'var(--tp-accent)' }] : []),
            ...(only !== 'truck' ? [{ key: 'trailer', name: 'Reboque', color: 'var(--tp-muted)' }] : []),
          ]}
          unit="mm"
          height={180}
          testId="suspension-chart"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {only !== 'trailer' && <WheelTable wheels={s.truckWheels} title="Rodas do cavalo" />}
        {only !== 'truck' && <WheelTable wheels={s.trailerWheels} title="Rodas do reboque" />}
      </div>
      <Limitation>
        Valores do canal <code>wheel.susp.deflection</code> do SDK: deslocamento vertical real de cada roda em relação
        ao seu eixo (m). Isto <b>não</b> é a posição do caminhão no mundo. A "elevação" pneumática da suspensão
        (subir/baixar o chassi pelo comando do jogo) não é exposta pelo SDK; quando estiver, a interface está
        preparada para exibi-la. Carga por eixo e indicadores de estabilidade também não existem no SDK.
      </Limitation>
    </div>
  );
}

export function TruckPage() {
  const frame = useStore((s) => s.frame);
  const settings = useStore((s) => s.settings);
  const series = useStore((s) => s.series);
  if (!frame) return null;
  const t = frame.truck;
  return (
    <div className="grid grid-cols-1 gap-px bg-line lg:grid-cols-12">
      <div className="lg:col-span-12">
        <PageHeader title="Caminhão" code="02" />
      </div>
      <Card title="Caminhão 2D" code="C-01" className="lg:col-span-8 lg:row-span-2">
        <VehicleView frame={frame} exaggeration={settings.suspensionExaggeration} />
      </Card>
      <Card title="Identificação" code="C-02" className="lg:col-span-4">
        <div className="mb-3 inline-flex items-stretch border border-line-strong">
          <span className="tp-label flex items-center bg-panel-2 px-2">ID</span>
          <span className="digits px-2.5 py-1 text-[13px]">{t.id ?? ND}</span>
        </div>
        <Row label="Marca">{t.brand ?? ND}</Row>
        <Row label="Modelo">{t.name ?? ND}</Row>
        <Row label="Placa">{t.licensePlate ? `${t.licensePlate} (${t.licensePlateCountry ?? '—'})` : ND}</Row>
        <Row label="Modelo 2D">{t.modelKey}</Row>
        <Row label="Seleção">
          <span className="font-sans">{settings.vehicleMode === 'auto' ? 'automática' : 'manual'}</span>
        </Row>
      </Card>
      <Card title="Limpadores" code="C-03" className="lg:col-span-4" bodyClass="flex justify-center">
        <WiperIndicator wipers={frame.wipers} />
      </Card>
      <Card title="Iluminação" code="C-04" className="lg:col-span-12" pad={false}>
        <LightingPanel lights={frame.lights} />
        <p className="px-3 py-2.5 text-[11px] leading-[15px] text-dim">
          O pisca usa o canal real <code>light.lblinker/rblinker</code> (lâmpada acesa no instante), portanto pisca no
          mesmo ritmo do jogo. Luz de ré e de freio só aparecem na vista lateral/traseira. O giroflex só tem estado
          ligado/desligado no SDK; a rotação é apenas visual.
        </p>
      </Card>
      <Card title="Suspensão e eixos" code="C-05" className="lg:col-span-12">
        <SuspensionPanel s={frame.suspension} series={series} only="truck" />
      </Card>
    </div>
  );
}
