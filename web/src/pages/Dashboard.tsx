/**
 * Painel principal (DESIGN-SPEC §5.1). Grade "rack" de 12 colunas no desktop;
 * no celular, uma coluna por prioridade de quem dirige (faixa principal →
 * indicadores → combustível → motor → veículo → viagem/gráficos/ambiente).
 */
import { ChartLegend, TimeChart } from '../components/Charts';
import { Gauge } from '../components/Gauge';
import { LightingPanel, Telltale } from '../components/Telltales';
import { Badge, Card, Meter, Num, Odometer, Row, Stat, type Tone } from '../components/ui';
import { EnvironmentCard, NoDataNotice, SpeedLimitSign } from '../components/Widgets';
import { WiperIndicator } from '../components/WiperIndicator';
import { hasData } from '../hooks/useFrame';
import { ND, consumption, distance, duration, fixed, fuel, isNum, pressure, speed, temp } from '../lib/format';
import { useStore } from '../lib/telemetryStore';
import { VehicleView } from '../vehicles/VehicleView';
import { PaperworkModule } from '../docs/PaperworkModule';

const SHIFTER: Record<string, string> = { arcade: 'Arcade', automatic: 'Automático', manual: 'Manual', hshifter: 'Manual (H)' };

export function Dashboard() {
  const frame = useStore((s) => s.frame);
  const settings = useStore((s) => s.settings);
  const series = useStore((s) => s.series);
  if (!frame) return <NoDataNotice frame={null} />;
  const ok = hasData(frame);

  const sp = speed(frame.motion.speedKmh, settings);
  const maxGauge = settings.speedUnit === 'mph' ? 90 : 140;
  const limit = speed(frame.motion.speedLimitKmh, settings);
  const maxCfg = speed(settings.configuredMaxSpeedKmh, settings);
  const avg = speed(frame.trip.avgSpeedKmh, settings);
  const cruise = frame.motion.cruiseControlOn ? speed(frame.motion.cruiseControlKmh, settings) : null;
  const e = frame.engine;
  const rpmMax = e.rpmMax ?? 2500;
  const rpmScale = Math.ceil((rpmMax * 1.2) / 500) * 500;
  const fu = frame.fuel;
  const fuelTone: Tone = !isNum(fu.percent) ? 'off' : fu.percent <= settings.alerts.fuelPercent / 2 ? 'crit' : fu.percent <= settings.alerts.fuelPercent || fu.reserve ? 'warn' : 'ok';
  const fuelBadge = fuelTone === 'crit' ? 'Crítico' : fuelTone === 'warn' ? (fu.reserve ? 'Reserva' : 'Atenção') : fuelTone === 'ok' ? 'Normal' : ND;
  const water = temp(e.waterTempC, settings);
  const oil = temp(e.oilTempC, settings);
  const oilP = pressure(e.oilPressurePsi, settings);
  const air = pressure(e.airPressurePsi, settings);
  const cons = consumption(fu.avgConsumptionL100, settings);
  const tripCons = consumption(frame.trip.avgConsumptionL100, settings);
  const range = distance(fu.rangeKm, settings, 0);
  const unitD = distance(0, settings).unit;
  const unitF = fuel(0, settings).unit;
  const speedSeries = series.map((p) => ({ t: p.t, speed: speed(p.speed, settings).value, limit: speed(p.limit, settings).value }));
  const fuelSeries = series.map((p) => ({ t: p.t, fuel: fuel(p.fuel, settings, 1).value, cons: consumption(p.consumption, settings).value }));
  const over = frame.motion.overLimit;
  const tripKm = distance(frame.trip.distanceKm, settings, 1);

  const speedGauge = (
    <Gauge
      value={sp.value}
      max={maxGauge}
      marker={limit.value}
      ticks={7}
      label={(v) => String(Math.round(v))}
      zones={[{ from: maxCfg.value ?? maxGauge, to: maxGauge, color: 'var(--tp-warn)' }]}
      testId="speed-gauge"
      unit={sp.unit}
      sub={over ? `Limite ${limit.text} · acima` : limit.value !== null ? `Limite ${limit.text}` : undefined}
      subTone={over ? 'crit' : 'muted'}
      ariaLabel={`Velocidade: ${sp.text} ${sp.unit}; limite ${limit.text}`}
      center={
        <span className={`digits text-[15cqw] leading-none font-bold ${over ? 'text-crit' : 'text-text'}`} data-testid="speed-digital">
          {sp.text}
        </span>
      }
    />
  );
  const rpmGauge = (
    <Gauge
      value={e.rpm}
      max={rpmScale}
      ticks={rpmScale / 500}
      label={(v) => (v % 1000 === 0 ? String(v / 1000) : '')}
      zones={[{ from: rpmMax, to: rpmScale, color: 'var(--tp-crit)' }]}
      testId="rpm-gauge"
      unit="rpm"
      sub="×1000"
      ariaLabel={`Rotação: ${fixed(e.rpm, 0)} rpm`}
      center={
        <span className="digits text-[11cqw] leading-none text-text">
          <Num value={fixed(e.rpm, 0)} />
        </span>
      }
    />
  );

  const engineFoot = (
    <>
      <Telltale icon="engineBrake" label="Freio motor" on={e.engineBrake} color="amber" size="sm" />
      <Telltale icon="retarder" label="Retarder" on={e.retarderStep === null ? null : e.retarderStep > 0} color="amber" size="sm" detail={e.retarderStepCount ? `${e.retarderStep ?? 0}/${e.retarderStepCount}` : 'N/D'} />
      <Telltale icon="parkBrake" label="Freio estac." on={e.parkingBrake} color="red" size="sm" />
    </>
  );

  return (
    <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12">
      {!ok && (
        <div className="col-span-full">
          <NoDataNotice frame={frame} />
        </div>
      )}

      {/* ── Celular (xs): faixa principal ─────────────────────── */}
      <section className="col-span-full bg-panel sm:hidden" aria-label="Velocidade">
        <div className="grid grid-cols-[1fr_auto] items-center border-b border-line px-3.5 pt-3 pb-2.5">
          <div>
            <div className="tp-label">Velocidade</div>
            <div className={`digits flex items-baseline text-[64px] leading-[60px] font-bold ${over ? 'text-crit' : ''}`} data-testid="speed-digital-mobile">
              {sp.text}
              <span className="font-cond ml-1.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">{sp.unit}</span>
            </div>
          </div>
          <SpeedLimitSign kmh={frame.motion.speedLimitKmh} settings={settings} size={56} />
        </div>
        <div className="grid grid-cols-3 divide-x divide-line">
          <div className="px-3 py-2">
            <div className="tp-label">Marcha</div>
            <div className="digits text-[30px] leading-[34px] font-bold">{e.gearLabel}</div>
          </div>
          <div className="px-3 py-2">
            <div className="tp-label">RPM</div>
            <div className="digits text-[20px] leading-[34px]">
              <Num value={fixed(e.rpm, 0)} />
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="tp-label">Piloto</div>
            <div className={`digits text-[20px] leading-[34px] ${cruise ? 'text-accent' : 'text-dim'}`}>{cruise ? cruise.text : 'desl.'}</div>
          </div>
        </div>
      </section>
      <div className="col-span-full sm:hidden">
        <LightingPanel lights={frame.lights} compact cols="grid-cols-6" />
      </div>

      {/* ── A · Cluster (sm+) ───────────────────────────────── */}
      <Card
        title="Instrumentos"
        code="P-01"
        pad={false}
        className="hidden sm:col-span-2 sm:block md:col-span-6 lg:col-span-8"
        action={cruise ? <Badge tone="accent">Piloto {cruise.text} {cruise.unit}</Badge> : undefined}
      >
        <div className="border-b border-line">
          <LightingPanel lights={frame.lights} compact cols="grid-cols-6 md:grid-cols-12" />
        </div>
        <div className="grid grid-cols-2 items-center md:grid-cols-[1fr_200px_1fr]">
          <div className="px-1.5 py-2.5">{speedGauge}</div>
          <div className="order-last col-span-2 flex flex-col items-center gap-3 border-t border-line py-3 md:order-none md:col-span-1 md:h-full md:justify-center md:border-x md:border-t-0">
            <div className="flex items-center gap-6 md:flex-col md:gap-3">
              <div className="text-center">
                <div className="tp-label">Marcha</div>
                <div className="digits -mt-1 text-[56px] leading-[56px] font-bold" data-testid="gear">
                  {e.gearLabel}
                </div>
              </div>
              <SpeedLimitSign kmh={frame.motion.speedLimitKmh} settings={settings} />
            </div>
            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2.5 px-4">
              <Stat label="Média trip" value={avg.text} unit={avg.unit} />
              <Stat label="Máx. config." value={maxCfg.text} unit={maxCfg.unit} />
            </div>
          </div>
          <div className="px-1.5 py-2.5">{rpmGauge}</div>
        </div>
        <div className="grid grid-cols-3 border-t border-line md:grid-cols-[repeat(3,64px)_1fr_1fr_1fr]">
          <div className="col-span-3 grid grid-cols-3 gap-px bg-line md:contents">{engineFoot}</div>
          <Stat className="border-t border-line px-3 py-2 md:border-t-0 md:border-l" label="RPM máx." value={fixed(e.rpmMax, 0)} />
          <Stat className="border-t border-l border-line px-3 py-2 md:border-t-0" label="Marcha (real)" value={e.gear === null ? ND : String(e.gear)} unit={e.forwardGears ? `${e.forwardGears}F / ${e.reverseGears}R` : undefined} />
          <div className="border-t border-l border-line px-3 py-2 md:border-t-0">
            <div className="tp-label">Câmbio</div>
            <div className={`font-cond text-sm leading-5 font-semibold uppercase tracking-[0.06em] ${e.shifterType ? '' : 'tp-nd'}`}>{e.shifterType ? SHIFTER[e.shifterType] ?? e.shifterType : ND}</div>
          </div>
        </div>
      </Card>

      {/* Combustível */}
      <Card
        title="Combustível"
        code="P-02"
        className="col-span-full sm:col-span-1 md:col-span-3 lg:col-span-4"
        action={<Badge tone={fuelTone} pulse={fuelTone === 'warn' || fuelTone === 'crit'}>{fuelBadge}</Badge>}
      >
        <div className="mb-2.5 flex items-end justify-between gap-2">
          <Stat big label="Tanque" value={fixed(fu.percent, 0)} unit="%" tone={fuelTone === 'ok' ? 'neutral' : fuelTone} />
          <div className="text-right">
            <Stat label="Disponível" value={fuel(fu.liters, settings).text} unit={`/ ${fuel(fu.capacityLiters, settings).text} ${unitF}`} />
            {fu.capacitySource && <div className="tp-label !text-[10px] !text-dim">{fu.capacitySource === 'manual' ? 'capacidade manual' : 'capacidade do jogo'}</div>}
          </div>
        </div>
        <Meter value={fu.percent} max={100} tone={fuelTone === 'off' ? 'off' : fuelTone === 'ok' ? 'ok' : fuelTone} segments={20} markers={fu.warningFactor ? [fu.warningFactor * 100] : []} ticks={false} />
        <div className="digits mt-0.5 flex justify-between text-[10px] text-dim">
          <span>0</span>
          <span>¼</span>
          <span>½</span>
          <span>¾</span>
          <span>1</span>
        </div>
        <div className="mt-3">
          <Row label="Autonomia">{range.value === null ? ND : `${range.text} ${unitD}`}</Row>
          <Row label="Consumo médio (jogo)">{cons.value === null ? ND : `${cons.text} ${cons.unit}`}</Row>
          <Row label="Consumo do trip">{tripCons.value === null ? ND : `${tripCons.text} ${tripCons.unit}`}</Row>
          <Row label="AdBlue">{fu.adblueLiters === null ? ND : `${fuel(fu.adblueLiters, settings).text} ${unitF}`}</Row>
        </div>
      </Card>

      {/* Celular em paisagem / tablet: mostradores ficam no cluster; no xs o motor vem antes do veículo */}
      {/* ── B · Motor ─────────────────────────────────────── */}
      <Card
        title="Motor"
        code="P-04"
        className="col-span-full sm:col-span-1 md:col-span-3 lg:order-4 lg:col-span-4"
        action={<Badge tone={e.engineOn ? 'ok' : 'off'}>{e.engineOn === null ? ND : e.engineOn ? 'Ligado' : 'Desligado'}</Badge>}
      >
        <div className="grid gap-3">
          <Meter label="Temp. motor (água)" right={`${water.text} ${water.unit}`} value={e.waterTempC} max={130} tone={isNum(e.waterTempC) && e.waterTempC >= settings.alerts.waterTempC ? 'crit' : 'ok'} markers={e.thresholds.waterTempC ? [e.thresholds.waterTempC] : []} />
          <Meter label="Temp. óleo" right={`${oil.text} ${oil.unit}`} value={e.oilTempC} max={150} tone={isNum(e.oilTempC) && e.oilTempC >= settings.alerts.oilTempC ? 'crit' : 'ok'} />
          <Meter label="Pressão do óleo" right={`${oilP.text} ${oilP.unit}`} value={e.oilPressurePsi} max={100} tone={e.warnings.oilPressure && e.engineOn ? 'crit' : 'accent'} markers={e.thresholds.oilPressurePsi ? [e.thresholds.oilPressurePsi] : []} />
          <Meter label="Ar dos freios" right={`${air.text} ${air.unit}`} value={e.airPressurePsi} max={160} tone={e.warnings.airPressureEmergency ? 'crit' : e.warnings.airPressure ? 'warn' : 'accent'} markers={e.thresholds.airPressurePsi ? [e.thresholds.airPressurePsi] : []} />
          <Meter label="Bateria" right={`${fixed(e.batteryVoltage, 1)} V`} value={e.batteryVoltage} max={30} tone={e.warnings.batteryVoltage && e.engineOn ? 'warn' : 'ok'} markers={e.thresholds.batteryVoltage ? [e.thresholds.batteryVoltage] : []} />
        </div>
      </Card>

      {/* Veículo */}
      <Card title="Veículo" code="P-03" className="col-span-full md:col-span-6 lg:order-3 lg:col-span-8">
        <VehicleView frame={frame} exaggeration={settings.suspensionExaggeration} withFront />
      </Card>

      {/* ── C · Gráfico + viagem ─────────────────────────── */}
      <Card
        title="Velocidade × limite"
        code="P-05"
        className="col-span-full md:col-span-6 lg:order-5 lg:col-span-8"
        action={
          <span className="hidden sm:block">
            <ChartLegend
              items={[
                { name: 'Velocidade', color: 'var(--tp-accent)' },
                { name: 'Limite', color: 'var(--tp-crit)', dashed: true },
              ]}
            />
          </span>
        }
      >
        <TimeChart
            data={speedSeries}
            series={[
              { key: 'speed', name: 'Velocidade', color: 'var(--tp-accent)', area: true },
              { key: 'limit', name: 'Limite', color: 'var(--tp-crit)', dashed: true, step: true },
            ]}
            unit={sp.unit}
            domain={[0, 'auto']}
            height={190}
            testId="speed-chart"
          />
      </Card>
      <Card title="Viagem" code="P-06" className="col-span-full sm:col-span-1 md:col-span-3 lg:order-6 lg:col-span-4">
        <div className="tp-label">Trip</div>
        <div className="mt-0.5 mb-2.5">
          <Odometer value={tripKm.value} intDigits={4} decimals={1} unit={unitD} />
        </div>
        <Row label="Tempo dirigindo">{duration(frame.trip.drivingTimeS)}</Row>
        <Row label="Odômetro (jogo)">{frame.motion.odometerKm === null ? ND : `${distance(frame.motion.odometerKm, settings, 1).text} ${unitD}`}</Row>
        <Row label="Sessão">{`${distance(frame.trip.sessionDistanceKm, settings).text} ${unitD}`}</Row>
        <Row label="Combustível usado">{`${fuel(frame.trip.fuelUsedL, settings, 1).text} ${unitF}`}</Row>
        <Row label="Vel. máxima">{`${speed(frame.trip.maxSpeedKmh, settings).text} ${sp.unit}`}</Row>
        {frame.job.onJob && (
          <>
            <Row label="Entrega">
              <span className="font-sans">{frame.job.cargo ?? ND}</span>
            </Row>
            <Row label="Destino">
              <span className="font-sans">{[frame.job.destinationCity, frame.job.destinationCompany].filter(Boolean).join(' · ') || ND}</span>
            </Row>
            <Row label="Rota restante">{frame.job.routeDistanceKm !== null ? `${distance(frame.job.routeDistanceKm, settings, 0).text} ${unitD}` : ND}</Row>
          </>
        )}
      </Card>

      {/* ── D ──────────────────────────────────────────────── */}
      <EnvironmentCard env={frame.environment} frame={frame} code="P-07" className="col-span-full sm:col-span-1 md:col-span-3 lg:order-7 lg:col-span-5" />
      <Card title="Limpadores" code="P-08" className="col-span-full sm:col-span-1 md:col-span-3 lg:order-8 lg:col-span-3" bodyClass="flex h-[calc(100%-32px)] items-center justify-center">
        <WiperIndicator wipers={frame.wipers} />
      </Card>
      <Card
        title="Consumo"
        code="P-09"
        className="col-span-full md:col-span-6 lg:order-9 lg:col-span-4"
        action={<ChartLegend items={[{ name: `Média ${cons.unit}`, color: 'var(--tp-accent-2)' }]} />}
      >
        <TimeChart data={fuelSeries} series={[{ key: 'cons', name: 'Consumo médio', color: 'var(--tp-accent-2)' }]} unit={cons.unit} height={170} testId="consumption-chart" />
      </Card>
      <PaperworkModule className="col-span-full md:col-span-6 lg:order-10 lg:col-span-8" />
      <Card title="Combustível na viagem" code="P-10" className="col-span-full md:col-span-6 lg:order-11 lg:col-span-4">
        <TimeChart data={fuelSeries} series={[{ key: 'fuel', name: 'Combustível', color: 'var(--tp-ok)', area: true }]} unit={unitF} height={150} testId="fuel-chart" />
      </Card>
    </div>
  );
}
