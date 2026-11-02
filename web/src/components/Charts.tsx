import { svgNum } from './ui';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const tick = { fill: 'var(--tp-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' };
const yAxis = { stroke: 'var(--tp-line)', tick, tickLine: false, axisLine: false } as const;
const xAxis = { stroke: 'var(--tp-line-strong)', tick, tickLine: { stroke: 'var(--tp-line-strong)' }, tickSize: 3, axisLine: { stroke: 'var(--tp-line-strong)' } } as const;
const tooltipStyle = {
  contentStyle: { background: 'var(--tp-panel-2)', border: '1px solid var(--tp-line-strong)', borderRadius: 0, fontSize: 12, fontFamily: 'var(--font-mono)', padding: '4px 8px' },
  labelStyle: { color: 'var(--tp-muted)' },
  itemStyle: { padding: 0 },
  cursor: { stroke: 'var(--tp-line-strong)', strokeWidth: 1 },
};
/** Legenda compacta para o cabeçalho do painel (substitui a legenda do Recharts). */
export function ChartLegend({ items }: { items: { name: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex gap-3.5">
      {items.map((i) => (
        <span key={i.name} className="font-cond flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
          <i className="w-3.5" style={{ borderTop: `2px ${i.dashed ? 'dashed' : 'solid'} ${i.color}` }} />
          {i.name}
        </span>
      ))}
    </div>
  );
}

/** Marcação do eixo de tempo em mono com separadores colados (tspan dx). */
function TimeTick(props: any) {
  const { x, y, payload } = props;
  return (
    <text x={x} y={y + 10} textAnchor="middle" fill="var(--tp-dim)" fontSize={10} style={{ fontFamily: 'var(--font-mono)' }}>
      {svgNum(timeFmt(Number(payload.value)), 10)}
    </text>
  );
}

const timeFmt = (t: number) => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export interface SeriesDef {
  key: string;
  name: string;
  color: string;
  dashed?: boolean;
  area?: boolean;
  step?: boolean;
}

/** Gráfico de linhas/área no tempo. `data` precisa ter a chave `t` (ms). */
export function TimeChart({
  data,
  series,
  height = 180,
  unit,
  domain,
  emptyText = 'Sem dados ainda — os gráficos são preenchidos enquanto o jogo envia telemetria.',
  testId,
}: {
  data: Record<string, any>[];
  series: SeriesDef[];
  height?: number;
  unit?: string;
  domain?: [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax'];
  emptyText?: string;
  testId?: string;
}) {
  if (data.length < 2) {
    return (
      <div className="tp-hatch flex items-center justify-center border border-line text-center text-xs text-dim" style={{ height }} data-testid={testId}>
        <span className="px-4">{emptyText}</span>
      </div>
    );
  }
  const anyArea = series.some((s) => s.area);
  const Chart = anyArea ? AreaChart : LineChart;
  return (
    <div style={{ height }} data-testid={testId}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="var(--tp-line)" vertical={false} />
          <XAxis dataKey="t" {...xAxis} tick={<TimeTick />} minTickGap={50} type="number" domain={['dataMin', 'dataMax']} scale="time" />
          <YAxis {...yAxis} domain={domain ?? ['auto', 'auto']} width={40} tickFormatter={(v: number) => (Number.isInteger(v) ? String(v) : v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }))} />
          <Tooltip {...tooltipStyle} labelFormatter={(t) => timeFmt(Number(t))} formatter={(v: any) => (typeof v === 'number' ? `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ''}` : v)} />
          {series.map((s) =>
            anyArea ? (
              <Area
                key={s.key}
                type={s.step ? 'stepAfter' : 'monotone'}
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={1.5}
                strokeDasharray={s.dashed ? '4 3' : undefined}
                fill={s.area ? s.color : 'none'}
                fillOpacity={s.area ? 0.1 : 0}
                isAnimationActive={false}
                connectNulls={false}
                dot={false}
              />
            ) : (
              <Line
                key={s.key}
                type={s.step ? 'stepAfter' : 'monotone'}
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={1.5}
                strokeDasharray={s.dashed ? '4 3' : undefined}
                isAnimationActive={false}
                dot={false}
                connectNulls={false}
              />
            ),
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
