import { Telltale } from '../components/Telltales';
import { Badge, Card, Limitation, Meter, Num, PageHeader, Stat, wearTone, type Tone } from '../components/ui';
import { ND, fixed, isNum, pct, temp } from '../lib/format';
import { useStore } from '../lib/telemetryStore';

const STATE_LABEL: Record<Tone, string> = { ok: 'OK', warn: 'Atenção', crit: 'Crítico', off: 'N/D', neutral: '—', accent: '—' };

export function Maintenance() {
  const frame = useStore((s) => s.frame);
  const settings = useStore((s) => s.settings);
  if (!frame) return null;
  const w = frame.wear;
  const e = frame.engine;
  const limit = settings.alerts.wearPercent;
  const items: [string, number | null][] = [
    ['Motor', w.engine],
    ['Transmissão', w.transmission],
    ['Chassi', w.chassis],
    ['Cabine', w.cabin],
    ['Rodas', w.wheels],
    ['Chassi do reboque', w.trailerChassis],
    ['Rodas do reboque', w.trailerWheels],
    ['Carroceria do reboque', w.trailerBody],
  ];
  const known = items.map(([, v]) => v).filter(isNum);
  const worst = known.length ? Math.max(...known) : null;
  const overall = worst === null ? null : 1 - worst;
  const overallTone = wearTone(worst, limit);
  const water = temp(e.waterTempC, settings);
  const marks = [limit / 100, Math.min(1, (limit * 2) / 100)];
  return (
    <div className="grid grid-cols-1 gap-px bg-line lg:grid-cols-12">
      <div className="lg:col-span-12">
        <PageHeader title="Manutenção" code="05" />
      </div>
      <Card title="Desgaste por componente" code="M-01" className="lg:col-span-7" pad={false}>
        <div className="flex items-end justify-between gap-3 border-b border-line px-3 py-3">
          <div>
            <div className="tp-label">Estado geral</div>
            <div className={`digits text-[34px] leading-[38px] ${overall === null ? 'tp-nd' : overallTone === 'ok' ? '' : overallTone === 'warn' ? 'text-warn' : 'text-crit'}`}>
              {overall === null ? ND : <Num value={fixed(overall * 100, 1)} />}
              {overall !== null && <span className="tp-unit">%</span>}
            </div>
            <div className="text-[11px] text-dim">100% menos o componente mais gasto</div>
          </div>
          <Badge tone={overallTone}>{STATE_LABEL[overallTone]}</Badge>
        </div>
        <div data-testid="wear-list">
          {items.map(([label, v]) => {
            const tone = wearTone(v, limit);
            return (
              <div key={label} className="grid min-h-11 grid-cols-[minmax(110px,1fr)_minmax(0,2fr)_64px_84px] items-center gap-3 border-b border-line px-3 last:border-b-0 max-sm:grid-cols-[1fr_56px_76px] max-sm:py-2">
                <span className="truncate text-[13px]">{label}</span>
                <div className="max-sm:col-span-3 max-sm:row-start-2">
                  <Meter value={v} tone={tone} markers={marks} />
                </div>
                <span className="digits text-right text-[13px]">
                  <Num value={pct(v, 1)} />
                </span>
                <span className="text-right">
                  <Badge tone={tone}>{STATE_LABEL[tone]}</Badge>
                </span>
              </div>
            );
          })}
        </div>
        <p className="px-3 pb-3 text-[11px] text-dim">
          Marcadores em {limit}% (atenção) e {Math.min(100, limit * 2)}% (crítico). Ajuste em Configurações.
        </p>
      </Card>
      <Card title="Estado geral" code="M-02" className="lg:col-span-5">
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Temperatura do motor" value={water.text} unit={water.unit} tone={isNum(e.waterTempC) && e.waterTempC >= settings.alerts.waterTempC ? 'crit' : 'neutral'} />
          <Stat label="Bateria" value={fixed(e.batteryVoltage, 1)} unit="V" tone={e.warnings.batteryVoltage && e.engineOn ? 'warn' : 'neutral'} hint={e.thresholds.batteryVoltage ? `alerta abaixo de ${fixed(e.thresholds.batteryVoltage, 1)} V` : undefined} />
          <Stat label="Temp. dos freios" value={temp(e.brakeTempC, settings).text} unit={temp(0, settings).unit} />
          <Stat label="Elétrica" value={e.electricOn === null ? null : e.electricOn ? 'Ligada' : 'Desligada'} />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-px bg-line">
          <Telltale icon="parkBrake" label="Freio estac." on={e.parkingBrake} color="red" />
          <Telltale icon="engineBrake" label="Freio motor" on={e.engineBrake} color="amber" />
          <Telltale icon="retarder" label="Retarder" on={e.retarderStep === null ? null : e.retarderStep > 0} color="amber" />
          <Telltale icon="cruise" label="Piloto" on={frame.motion.cruiseControlOn} color="green" />
        </div>
        <div className="mt-4 grid gap-px bg-line">
          {(
            [
              ['Pressão do óleo', e.warnings.oilPressure && e.engineOn],
              ['Temperatura da água', e.warnings.waterTemp],
              ['Tensão da bateria', e.warnings.batteryVoltage && e.engineOn],
              ['Pressão de ar', e.warnings.airPressure],
              ['Ar — emergência', e.warnings.airPressureEmergency],
              ['Combustível (reserva)', e.warnings.fuel],
              ['AdBlue', e.warnings.adblue],
            ] as [string, boolean | null][]
          ).map(([label, on]) => (
            <div key={label} className="flex min-h-9 items-center justify-between bg-panel px-2 text-[13px]">
              <span className={on ? 'text-crit' : 'text-muted'}>{label}</span>
              <span className={`tp-check ${on === null ? 'text-dim' : on ? 'text-crit' : 'text-ok'}`}>{on === null ? '[ -- ]' : on ? '[ALERTA]' : '[ OK ]'}</span>
            </div>
          ))}
        </div>
        <Limitation>Os alertas acima vêm diretamente dos sinais de aviso do jogo (ignorados com o motor desligado quando não fazem sentido).</Limitation>
      </Card>
    </div>
  );
}
