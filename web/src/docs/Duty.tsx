import type { DutySegment, DutySummary } from '../../../shared/types';
import { fmtGameDate } from '../../../shared/docs/build';
import { Meter, Row } from '../components/ui';
import './docs.css';

export const hm = (min: number | null | undefined) => {
  if (min === null || min === undefined) return 'N/D';
  const neg = min < 0;
  const m = Math.abs(Math.round(min));
  return `${neg ? '−' : ''}${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
};

const STATE_PT: Record<string, string> = { driving: 'Direção', work: 'Outros trabalhos', idle: 'Parado', rest: 'Descanso' };

export function DutyMeters({ s }: { s: DutySummary | null }) {
  if (!s) return <p className="text-sm text-muted">Sem dados da jornada ainda — ela é calculada pelo relógio do jogo enquanto há telemetria.</p>;
  const L = s.limits;
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="tp-label">Estado atual</span>
        <span className="font-cond text-sm font-semibold uppercase tracking-[0.06em]">{STATE_PT[s.state]}</span>
      </div>
      <Meter
        label="Direção contínua (máx. 5 h 30)"
        right={hm(s.continuousDrivingMin)}
        value={s.continuousDrivingMin}
        max={L.continuousMin * 1.2}
        tone={s.continuousDrivingMin > L.continuousMin ? 'crit' : s.continuousDrivingMin >= 300 ? 'warn' : 'accent'}
        markers={[300, L.continuousMin]}
      />
      <Meter
        label="Direção no dia (8 h + 2 h extras)"
        right={hm(s.dailyDrivingMin)}
        value={s.dailyDrivingMin}
        max={(L.dailyMin + L.dailyExtraMin) * 1.1}
        tone={s.dailyDrivingMin > L.dailyMin + L.dailyExtraMin ? 'crit' : s.dailyDrivingMin > L.dailyMin ? 'warn' : 'accent'}
        markers={[L.dailyMin, L.dailyMin + L.dailyExtraMin]}
      />
      <Meter label="Interjornada (descanso de 11 h)" right={hm(s.lastLongRestMin)} value={s.lastLongRestMin} max={L.interjornadaMin * 1.1} tone={s.lastLongRestMin >= L.interjornadaMin ? 'ok' : 'off'} markers={[L.interjornadaMin]} />
      <div className="grid gap-0">
        <Row label="Descanso do jogo (restStop)">{s.gameRestStopMin === null ? 'N/D' : s.gameRestStopMin < 0 ? 'AGORA' : `em ${hm(s.gameRestStopMin)}`}</Row>
        <Row label="Pausa (regra simulada)">{s.continuousDrivingMin > L.continuousMin ? 'AGORA' : `em ${hm(L.continuousMin - s.continuousDrivingMin)}`}</Row>
      </div>
      <p className="text-[11px] leading-4 text-dim">
        São dois relógios diferentes: o jogo tem a própria regra de sono (restStop). A jornada da Lei 13.103 é SIMULADA a partir do relógio do jogo — direção acima de 2 km/h com motor ligado; descanso com motor desligado ou freio de estacionamento por 15 min ou mais.
      </p>
    </div>
  );
}

/** Linha do tempo de 24 h (quartos de hora). */
export function DutyTimeline({ day, segments }: { day: number; segments: DutySegment[] }) {
  const start = day * 1440;
  const cells = Array.from({ length: 96 }, (_, i) => {
    const t = start + i * 15 + 7;
    const seg = segments.find((s) => s.startGameMin <= t && (s.endGameMin ?? Infinity) > t);
    return seg?.state ?? '';
  });
  return (
    <div>
      <div className="tl" role="img" aria-label="Linha do tempo da jornada (24 h)">
        {cells.map((c, i) => (
          <i key={i} className={c} />
        ))}
      </div>
      <div className="digits mt-0.5 flex justify-between text-[10px] text-dim">
        {[0, 6, 12, 18, 24].map((h) => (
          <span key={h}>{String(h).padStart(2, '0')}h</span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {[
          ['driving', 'Direção', 'var(--tp-accent)'],
          ['work', 'Outros trabalhos', 'var(--tp-accent-2)'],
          ['idle', 'Parado', 'var(--tp-panel-2)'],
          ['rest', 'Descanso', 'transparent'],
        ].map(([k, l, c]) => (
          <span key={k} className="font-cond flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
            <i className="h-3 w-3 border border-line-strong" style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Disco de tacógrafo de 24 h (papel). */
export function TachoDisc({ day, segments, speed, driver, plate, gameMin }: { day: number; segments: DutySegment[]; speed: { gameMin: number; kmh: number }[]; driver: string; plate: string; gameMin: number | null }) {
  const cx = 150;
  const cy = 150;
  const P = (r: number, h: number) => {
    const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const arcP = (r: number, h0: number, h1: number) => {
    const [x0, y0] = P(r, h0);
    const [x1, y1] = P(r, Math.min(h1, h0 + 23.999));
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${h1 - h0 > 12 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };
  const start = day * 1440;
  const ticks = [];
  for (let m = 0; m < 24 * 12; m++) {
    const h = m / 12;
    const maj = m % 12 === 0;
    const [x0, y0] = P(142, h);
    const [x1, y1] = P(maj ? 128 : 136, h);
    ticks.push(<line key={`t${m}`} x1={x0.toFixed(1)} y1={y0.toFixed(1)} x2={x1.toFixed(1)} y2={y1.toFixed(1)} stroke="#16161a" strokeWidth={maj ? 1.2 : 0.5} />);
    if (maj) {
      const [tx, ty] = P(118, h);
      ticks.push(
        <text key={`l${m}`} x={tx.toFixed(1)} y={ty.toFixed(1)} fontFamily="Arimo,Arial" fontSize="9" textAnchor="middle" dominantBaseline="central" fill="#16161a">
          {h}
        </text>,
      );
    }
  }
  let d = '';
  for (const s of speed) {
    const h = (s.gameMin - start) / 60;
    if (h < 0 || h > 24) continue;
    const [x, y] = P(70 + Math.min(120, s.kmh) * 0.3, h);
    d += (d ? ' L ' : 'M ') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  const nowH = gameMin !== null && gameMin >= start && gameMin < start + 1440 ? (gameMin - start) / 60 : null;
  const km = segments.reduce((a, s) => a + (s.km || 0), 0);
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label="Disco de tacógrafo de 24 horas" className="mx-auto block w-full max-w-[300px]" data-testid="tacho-disc">
      <circle cx="150" cy="150" r="146" fill="#f3f0e6" />
      <circle cx="150" cy="150" r="146" fill="none" stroke="#16161a" strokeWidth="1.5" />
      {ticks}
      {[40, 80, 120].map((v) => (
        <circle key={v} cx="150" cy="150" r={70 + v * 0.3} fill="none" stroke="#9c958a" strokeWidth=".5" strokeDasharray="2 2" />
      ))}
      {d && <path d={d} fill="none" stroke="#1f3f9a" strokeWidth=".9" />}
      {segments.map((s, i) => {
        const h0 = Math.max(0, (s.startGameMin - start) / 60);
        const h1 = Math.min(24, ((s.endGameMin ?? gameMin ?? s.startGameMin) - start) / 60);
        if (h1 <= h0) return null;
        return <path key={i} d={arcP(58, h0, h1)} fill="none" stroke="#16161a" strokeWidth={s.state === 'driving' ? 7 : s.state === 'work' ? 4 : 1} />;
      })}
      <circle cx="150" cy="150" r="44" fill="#fbfaf6" stroke="#16161a" />
      <text x="150" y="134" textAnchor="middle" fontFamily="Arimo,Arial" fontWeight="700" fontSize="10" fill="#16161a">
        {driver.toUpperCase().slice(0, 18)}
      </text>
      <text x="150" y="148" textAnchor="middle" fontFamily="Courier Prime,monospace" fontSize="10" fill="#16161a">
        {plate}
      </text>
      <text x="150" y="162" textAnchor="middle" fontFamily="Courier Prime,monospace" fontSize="9" fill="#16161a">
        {fmtGameDate(start).slice(0, 5)} · {km.toFixed(0)} km
      </text>
      {nowH !== null &&
        (() => {
          const [nx, ny] = P(146, nowH);
          return <line x1="150" y1="150" x2={nx.toFixed(1)} y2={ny.toFixed(1)} stroke="var(--tp-accent)" strokeWidth="2" />;
        })()}
      <circle cx="150" cy="150" r="4" fill="#16161a" />
    </svg>
  );
}
