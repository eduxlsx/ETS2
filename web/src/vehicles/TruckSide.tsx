/**
 * Vista lateral (lado ESQUERDO do conjunto, frente para a direita).
 * Portada de docs/design/trucks/side-4x2.svg / side-6x2.svg (100 px = 1 m).
 *
 * Coordenadas "de referência" (iguais às dos SVGs mestres): x = 680 − 100·m
 * (m medido a partir do para-choque), y = 400 − 100·h (h = altura do solo).
 * Tudo é desenhado dentro de um <g translate(OX 0)>, então os números dos
 * SVGs podem ser copiados literalmente.
 *
 * - Eixos posicionados pelas posições reais das rodas (truck.wheel.position),
 *   quando o SDK as fornece; senão usa a distância entre eixos padrão do modelo.
 * - Suspensão: a altura do chassi em cada eixo usa a deflexão real
 *   (wheel.susp.deflection), multiplicada pelo fator de exagero configurado.
 *   Não usamos coordenadas do mundo do caminhão como "altura da suspensão".
 * - Luzes: estados reais, lente apagada + camada acesa. Desta vista só se vê o pisca ESQUERDO.
 */
import { useId, useRef, type CSSProperties } from 'react';
import type { LightsData, SuspensionData, TrailerData, WheelData } from '../../../shared/types';
import { getTrailerDrawing } from './trailers';
import type { VehicleDefinition } from './types';

const FRONT_OVERHANG = 1.45;
const NOMINAL_CHASSIS = 1.1; // topo da longarina (m)
const BEAM_SPACE = 140; // px à frente do para-choque para os feixes
const TRAILER_LEN = 13.6;

const MAX_VISUAL = 0.22; // deslocamento visual máximo (m)
const BASELINE_ALPHA = 0.03; // média móvel (~2–3 s a 20 Hz)

const refX = (m: number) => 680 - 100 * m;

interface Axle {
  x: number; // metros a partir da frente do conjunto (0 = para-choque)
  defl: number; // m (valor real)
  vis?: number; // deslocamento visual (m) = (defl - base) × exagero, limitado
  radius: number;
  lift: number;
  powered?: boolean | null;
  localX?: number; // reboque: x no desenho local
}

export function groupAxles(wheels: WheelData[]): { z: number; defl: number | null; radius: number; lift: number; powered: boolean | null }[] {
  const groups = new Map<number, WheelData[]>();
  for (const w of wheels) {
    if (!w.position) continue;
    const key = Math.round(w.position.z * 10) / 10;
    groups.set(key, [...(groups.get(key) ?? []), w]);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([z, ws]) => {
      const defls = ws.map((w) => w.suspDeflection).filter((d): d is number => d !== null);
      const pw = ws.map((w) => w.powered).filter((p): p is boolean => p !== null);
      return {
        z,
        defl: defls.length ? defls.reduce((a, b) => a + b, 0) / defls.length : null,
        radius: ws[0].radius ?? 0.52,
        lift: Math.max(...ws.map((w) => w.lift ?? 0)),
        powered: pw.length ? pw.some(Boolean) : null,
      };
    });
}

function lampCls(base: string, on: boolean | null | undefined, extra = '') {
  return `${base} tp-lamp${on ? ' on' : ''}${extra ? ' ' + extra : ''}`;
}

/** Roda dianteira (aro 22,5", 10 furos, cubo com tampa cônica). Centro em 0,0, r = 52. */
function FrontWheel() {
  const holes = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
  return (
    <>
      <circle r="52" className="t-rubber t-out" />
      <circle r="51.2" fill="none" stroke="#fff" strokeOpacity=".07" strokeWidth="2.4" strokeDasharray="3.4 2.2" />
      <circle r="45" fill="none" stroke="#fff" strokeOpacity=".05" />
      <circle r="38" fill="none" stroke="#000" strokeOpacity=".5" />
      <circle r="30" className="t-metal-dk" />
      <circle r="28.5" className="t-metal" />
      <circle r="24.5" className="t-metal-dk" opacity=".55" />
      <g className="t-rubber">
        {holes.map((a) => (
          <circle key={a} cx={(20.5 * Math.cos((a * Math.PI) / 180)).toFixed(2)} cy={(20.5 * Math.sin((a * Math.PI) / 180)).toFixed(2)} r="2.8" />
        ))}
      </g>
      <circle r="14.5" className="t-metal-lt" />
      <g className="t-metal-dk">
        {holes.map((a) => (
          <circle key={a} cx={(11 * Math.cos(((a + 18) * Math.PI) / 180)).toFixed(2)} cy={(11 * Math.sin(((a + 18) * Math.PI) / 180)).toFixed(2)} r="1.5" />
        ))}
      </g>
      <circle r="7" className="t-metal-dk" />
      <circle r="3.2" className="t-metal-lt" />
      <path d="M -23 -14 A 27 27 0 0 1 -6 -26" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="2" />
    </>
  );
}

/** Roda traseira de tração (rodado duplo: prato fundo + cubo de redução). */
function DriveWheel() {
  const holes = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
  return (
    <>
      <circle r="52" className="t-rubber t-out" />
      <circle r="51.2" fill="none" stroke="#fff" strokeOpacity=".07" strokeWidth="2.4" strokeDasharray="3.4 2.2" />
      <circle r="45" fill="none" stroke="#fff" strokeOpacity=".05" />
      <circle r="38" fill="none" stroke="#000" strokeOpacity=".5" />
      <circle r="30" className="t-metal-dk" />
      <circle r="28.5" className="t-metal" />
      <circle r="26" className="t-metal-dk" opacity=".75" />
      <circle r="26" fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="2" />
      <g className="t-rubber">
        {holes.map((a) => (
          <circle key={a} cx={(21.5 * Math.cos((a * Math.PI) / 180)).toFixed(2)} cy={(21.5 * Math.sin((a * Math.PI) / 180)).toFixed(2)} r="2.6" />
        ))}
      </g>
      <circle r="16.5" className="t-metal" />
      <circle r="16.5" fill="none" stroke="#000" strokeOpacity=".4" />
      <g className="t-metal-lt">
        {holes.map((a) => (
          <circle key={a} cx={(13 * Math.cos(((a + 18) * Math.PI) / 180)).toFixed(2)} cy={(13 * Math.sin(((a + 18) * Math.PI) / 180)).toFixed(2)} r="1.8" />
        ))}
      </g>
      <circle r="9" className="t-metal-dk" />
      <circle r="9" fill="none" stroke="#fff" strokeOpacity=".18" />
      <circle r="4" className="t-ink" />
      <path d="M -24 -15 A 28 28 0 0 1 -7 -27" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="2" />
    </>
  );
}

export function TruckSide({
  vehicle,
  lights,
  suspension,
  trailer,
  exaggeration = 8,
  showSuspension = true,
  showLabels = true,
  className = '',
}: {
  vehicle: VehicleDefinition;
  lights: LightsData;
  suspension: SuspensionData;
  trailer: Pick<TrailerData, 'attached' | 'modelKey'>;
  exaggeration?: number;
  showSuspension?: boolean;
  showLabels?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const sp = vehicle.side;
  // linha de base por eixo: o desenho exagera só a VARIAÇÃO da deflexão,
  // assim offsets estáticos (carga, assentamento) não deformam o conjunto.
  const baselines = useRef(new Map<string, number>());

  // ── Eixos do cavalo ────────────────────────────────────────
  const truckGroups = groupAxles(suspension.truckWheels);
  let axles: Axle[];
  if (truckGroups.length >= 2) {
    const zFront = truckGroups[0].z - FRONT_OVERHANG;
    axles = truckGroups.map((g) => ({ x: g.z - zFront, defl: g.defl ?? 0, radius: g.radius, lift: g.lift, powered: g.powered }));
  } else {
    axles = [
      { x: FRONT_OVERHANG, defl: 0, radius: 0.52, lift: 0, powered: false },
      { x: FRONT_OVERHANG + vehicle.defaultWheelbase, defl: 0, radius: 0.52, lift: 0, powered: true },
    ];
  }
  const rear = axles.slice(1);
  // tipo de cada eixo traseiro: com informação de tração do SDK, usa-a; senão o 1º traseiro é o de tração
  const anyPowered = rear.some((a) => a.powered === true);
  const isDrive = (a: Axle, i: number) => (anyPowered ? a.powered === true : i === 1);
  const driveAxles = rear.filter((a) => isDrive(a, axles.indexOf(a)));
  const firstRear = rear[0];
  const rearCenter = (driveAxles.length ? driveAxles : rear).reduce((a, b) => a + b.x, 0) / (driveAxles.length || rear.length);
  const lastAxle = axles[axles.length - 1];
  const chassisEnd = lastAxle.x + 1.11;

  // ── Reboque ───────────────────────────────────────────────
  const hasTrailer = trailer.attached === true;
  const drawing = getTrailerDrawing(trailer.modelKey);
  const kingpin = rearCenter - 0.25;
  const trailerFront = kingpin - 1.25;
  const trailerRear = trailerFront + TRAILER_LEN;
  let trailerAxles: Axle[] = [];
  if (hasTrailer) {
    const tg = groupAxles(suspension.trailerWheels);
    const ref = drawing.axles;
    const lastRef = ref[ref.length - 1].refX;
    if (tg.length) {
      const zLast = tg[tg.length - 1].z;
      trailerAxles = tg.map((g) => {
        const localX = lastRef + 100 * (zLast - g.z);
        return { x: trailerFront + (1400 - localX) / 100, localX, defl: g.defl ?? 0, radius: g.radius, lift: g.lift };
      });
    } else {
      trailerAxles = ref.map((r) => ({ x: trailerFront + (1400 - r.refX) / 100, localX: r.refX, defl: 0, radius: 0.5 * r.scale, lift: 0 }));
    }
  }

  // ── Suspensão → altura do chassi ───────────────────────────
  const ex = showSuspension ? exaggeration : 0;
  const applyVisual = (list: Axle[], prefix: string) =>
    list.forEach((a, i) => {
      const key = `${prefix}${i}`;
      const prev = baselines.current.get(key);
      const base = prev === undefined ? a.defl : prev + (a.defl - prev) * BASELINE_ALPHA;
      baselines.current.set(key, base);
      a.vis = Math.max(-MAX_VISUAL, Math.min(MAX_VISUAL, (a.defl - base) * ex));
    });
  applyVisual(axles, 't');
  applyVisual(trailerAxles, 'r');
  const chassisAt = (a: Axle) => NOMINAL_CHASSIS - (a.vis ?? 0);
  const hFront = chassisAt(axles[0]);
  const hRear = rear.reduce((acc, a) => acc + chassisAt(a), 0) / rear.length;
  const rearAvgX = rear.reduce((a, b) => a + b.x, 0) / rear.length;
  const slope = (hRear - hFront) / (rearAvgX - axles[0].x || 1);
  const chassisH = (x: number) => hFront + (x - axles[0].x) * slope;
  const dyAt = (x: number) => -(chassisH(x) - NOMINAL_CHASSIS) * 100; // deslocamento vertical (px) de peças presas ao chassi
  const cabLift = hFront - NOMINAL_CHASSIS; // a cabine acompanha o eixo dianteiro
  const cabDy = -cabLift * 100;

  // ── Cena ───────────────────────────────────────────────────
  const sceneLen = Math.max(chassisEnd + 0.1, hasTrailer ? trailerRear + 0.05 : 0) + 0.1;
  const OX = 10 - refX(sceneLen);
  const W = Math.round(OX + 680 + BEAM_SPACE);
  const labelSize = Math.max(9, Math.round(W / 95));
  const top = -34;
  const bottom = 400 + (showLabels && showSuspension ? labelSize + 10 : 8);

  // ── Perfil da cabine por modelo ────────────────────────────
  const ry = 400 - 100 * sp.roofHeight; // y do teto (referência 25 = 3,75 m)
  const dy = ry - 25; // deslocamento das peças do teto
  const wsB = 400 - 100 * Math.min(2.3, Math.max(1.9, sp.windshieldBottom + 0.05));
  const rake = Math.round(Math.max(18, Math.min(40, sp.windshieldRake * 85)));
  const wsTopX = 670 - rake;
  const roofRear =
    sp.roofStyle === 'stepped'
      ? `L 540 ${ry} L 532 ${ry + 9} L 466 ${ry + 9} Q 450 ${ry + 9} 450 ${ry + 24}`
      : sp.roofStyle === 'flat'
        ? `L 456 ${ry - 1} L 450 ${ry + 6}`
        : `L 466 ${ry - 1} Q 450 ${ry - 1} 450 ${ry + 15}`;
  const shell = `M 680 288 L 675 200 L 670 ${wsB} L ${wsTopX} ${ry + 33} Q ${wsTopX - 4} ${ry + 3} 612 ${ry + 1} ${roofRear} L 452 280 L 680 280 Z`;
  const hlDy = Math.round((0.99 - sp.headlight.y) * 100);

  const low = !!lights.lowBeam;
  const high = !!lights.highBeam;
  const aux = lights.auxFront ?? 0;
  const roof = lights.auxRoof ?? 0;
  const tailStyle: CSSProperties | undefined = lights.parking && !lights.brake ? { opacity: 0.55 } : undefined;

  // ── Reboque: transformação do desenho local ────────────────
  const dxB = refX(trailerFront) - 1400;
  const dyKing = 265 + dyAt(kingpin) - 272;
  const tVis = trailerAxles.length ? trailerAxles.reduce((a, b) => a + (b.vis ?? 0), 0) / trailerAxles.length : 0;
  const dyAxle = -7 + tVis * 100;
  const axC = trailerAxles.length ? trailerAxles.reduce((a, b) => a + (b.localX ?? 0), 0) / trailerAxles.length : 300;
  const sinT = Math.max(-0.05, Math.min(0.05, (dyAxle - dyKing) / (axC - 1275 || -1)));
  const theta = (Math.asin(sinT) * 180) / Math.PI;
  const u = (id: string) => `${uid}-${id}`;
  const L = { parking: !!lights.parking, brake: !!lights.brake, blinkerLeftOn: !!lights.blinkerLeftOn, reverse: !!lights.reverse };

  // ── Peças ──────────────────────────────────────────────────
  const wheel = (a: Axle, i: number) => {
    const lifted = a.lift > 0.5 ? 22 : 0;
    const k = a.radius / 0.52;
    const cx = refX(a.x);
    const cy = 400 - a.radius * 100 - lifted;
    const drive = i > 0 && isDrive(a, i);
    return (
      <g key={`t${i}`}>
        {!lifted && <ellipse cx={cx} cy={400} rx={48 * k} ry={3} className="t-ink" opacity=".5" />}
        {lifted > 0 && <circle cx={cx} cy={400 - a.radius * 100} r={a.radius * 100} fill="none" stroke="var(--tp-dim)" strokeDasharray="4 3" data-part="lift-ghost" />}
        <g transform={`translate(${cx.toFixed(1)} ${cy.toFixed(1)})${k !== 1 ? ` scale(${k.toFixed(3)})` : ''}`} data-testid={`truck-axle-${i}`}>
          {drive ? <DriveWheel /> : <FrontWheel />}
        </g>
      </g>
    );
  };

  const shock = (x: number, wheelTopY: number, chassisBottomY: number, defl: number, key: string) => (
    <g key={key} data-part="shock">
      <line x1={refX(x) - 8} y1={wheelTopY} x2={refX(x) - 8} y2={chassisBottomY} className="t-susp" />
      {showLabels && (
        <text x={refX(x)} y={400 + labelSize + 4} textAnchor="middle" className="t-susp-tx" fontSize={labelSize}>
          {(defl * 1000).toFixed(0)}
        </text>
      )}
    </g>
  );

  // tanques: posicionados à frente do 1º eixo traseiro
  const tankRear = firstRear.x - 0.67;
  const tankFront = Math.max(2.45, sp.cabLength + 0.12);
  const fuelLen = Math.max(0, tankRear - 0.68 - tankFront);
  const tankDy = dyAt((tankRear + tankFront) / 2);
  const tr = refX(tankRear); // x de referência da borda traseira (242 no 4x2)
  const fuelX = refX(tankRear - 0.68);
  const fuelW = fuelLen * 100;

  const railStart = 2.24;
  const rs = refX(railStart);
  const re = refX(chassisEnd);
  const railPath = `M ${rs} ${290 + dyAt(railStart)} L ${re} ${290 + dyAt(chassisEnd)} L ${re} ${318 + dyAt(chassisEnd)} L ${rs} ${318 + dyAt(railStart)} Z`;

  // feixes (ponto de origem no farol)
  const hy = 301 + hlDy + cabDy;
  const bx = 681;
  const bEnd = 680 + BEAM_SPACE;
  const ay = 334 + cabDy;
  const roofY = 18 + dy + cabDy;

  return (
    <svg
      viewBox={`0 ${top} ${W} ${bottom - top}`}
      className={className}
      role="img"
      aria-label={`${vehicle.label} — vista lateral`}
      data-testid="truck-side"
      data-model={vehicle.key}
      style={{ '--truck-paint': vehicle.paint } as CSSProperties}
    >
      {hasTrailer && <defs>{<drawing.Defs u={u} />}</defs>}
      <g transform={`translate(${OX.toFixed(1)} 0)`}>
        {/* solo + régua métrica (1 m) */}
        <line x1={refX(sceneLen) - 10} y1={400} x2={bEnd} y2={400} className="t-ground" />
        {Array.from({ length: Math.floor(sceneLen) + 2 }, (_, i) => (
          <line key={i} x1={refX(i)} y1={400.5} x2={refX(i)} y2={404} className="t-ruler" />
        ))}

        {/* ===== FEIXES (atrás de tudo). Faixas planas sobrepostas, sem gradiente ===== */}
        <g className={`tp-beam${low && !high ? ' on' : ''}`} data-lamp="beam-low">
          <path className="t-beam" opacity=".08" d={`M ${bx} ${hy - 2} L ${bEnd} ${380} L ${bEnd} 400 L ${bx} ${hy + 8} Z`} />
          <path className="t-beam" opacity=".12" d={`M ${bx} ${hy} L ${bEnd} ${390} L ${bEnd} 400 L ${bx} ${hy + 6} Z`} />
        </g>
        <g className={`tp-beam${high ? ' on' : ''}`} data-lamp="beam-high">
          <path className="t-beam" opacity=".07" d={`M ${bx} ${hy - 4} L ${bEnd} ${hy - 40} L ${bEnd} 398 L ${bx} ${hy + 9} Z`} />
          <path className="t-beam" opacity=".11" d={`M ${bx} ${hy - 1} L ${bEnd} ${hy - 14} L ${bEnd} ${hy + 50} L ${bx} ${hy + 6} Z`} />
        </g>
        <g className={`tp-beam${aux === 2 ? ' on' : aux === 1 ? ' dim' : ''}`} data-lamp="beam-aux">
          <path className="t-beam" opacity=".10" d={`M ${bx} ${ay - 3} L ${bEnd} 394 L ${bEnd} 400 L ${bx} ${ay + 4} Z`} />
        </g>
        <g className={`tp-beam${roof === 2 ? ' on' : roof === 1 ? ' dim' : ''}`} data-lamp="beam-roof">
          <path className="t-beam" opacity=".06" d={`M 628 ${roofY - 2} L ${bEnd} ${roofY + 30} L ${bEnd} ${roofY + 250} L 628 ${roofY + 5} Z`} />
          <path className="t-beam" opacity=".09" d={`M 628 ${roofY} L ${bEnd} ${roofY + 50} L ${bEnd} ${roofY + 140} L 628 ${roofY + 3} Z`} />
        </g>

        {/* ===== REBOQUE ===== */}
        {hasTrailer && (
          <g data-testid="trailer-side" data-type={drawing.type}>
            <g transform={`translate(${dxB.toFixed(1)} ${dyKing.toFixed(1)}) rotate(${theta.toFixed(3)} 1275 272)`}>
              <drawing.Body L={L} u={u} />
            </g>
            {trailerAxles.map((a, i) => {
              const k = Math.min(i, drawing.Axle.length - 1);
              const Content = drawing.Axle[k];
              const lifted = a.lift > 0.5 ? 22 : 0;
              return (
                <g key={i} data-testid={`trailer-axle-${i}`} transform={`translate(${(dxB + (a.localX ?? 0) - drawing.axles[k].refX).toFixed(1)} ${-lifted})`}>
                  <Content />
                </g>
              );
            })}
            <g transform={`translate(${dxB.toFixed(1)} ${dyKing.toFixed(1)}) rotate(${theta.toFixed(3)} 1275 272)`}>
              <drawing.Post L={L} u={u} />
            </g>
          </g>
        )}

        {/* ===== CHASSI TRASEIRO ===== */}
        <g data-part="chassis">
          <path d={railPath} className="t-chassis t-out" />
          <line x1={rs} y1={290.5 + dyAt(railStart)} x2={re} y2={290.5 + dyAt(chassisEnd)} className="t-seam-hi" strokeOpacity=".08" />
          <line x1={rs} y1={317.5 + dyAt(railStart)} x2={re} y2={317.5 + dyAt(chassisEnd)} className="t-seam" />
          <g className="t-ink" opacity=".6">
            {[chassisEnd - 0.32, chassisEnd - 0.48, firstRear.x - 0.87, firstRear.x - 1.35].map((m, i) => (
              <circle key={i} cx={refX(m)} cy={304 + dyAt(m)} r="1.6" />
            ))}
          </g>
          <rect x={re - 4} y={288 + dyAt(chassisEnd)} width="8" height="34" className="t-chassis" />
        </g>

        {/* pórtico atrás da cabine + mangueiras (vermelha = emergência, amarela = serviço, preta = elétrica) */}
        <g data-part="gantry" transform={`translate(0 ${dyAt(2.5).toFixed(1)})`}>
          <rect x="430" y={96 + dy} width="5" height={194 - dy} className="t-chassis" />
          <rect x="422" y={104 + dy} width="16" height="6" className="t-chassis" />
          <g transform={`translate(0 ${dy})`}>
            <path className="t-air-red" d="M 426 110 C 404 124 398 150 412 168 C 426 186 400 200 408 222 C 414 240 430 232 432 212" />
            <path className="t-air-yel" d="M 430 110 C 412 128 410 152 420 170 C 432 190 410 206 418 226 C 424 242 436 230 434 214" />
            <path className="t-air-blk" d="M 434 110 C 422 132 424 156 428 176 C 434 198 420 214 426 232" />
            <rect x="426" y="206" width="12" height="10" className="t-plastic" />
          </g>
          <rect x="330" y="284" width="102" height="6" className="t-metal-dk" />
          <line x1="332" y1="287" x2="430" y2="287" stroke="#000" strokeOpacity=".35" strokeDasharray="4 3" />
        </g>

        {/* quinta-roda (pino-rei 0,25 m à frente do centro do conjunto de tração) */}
        <g data-part="fifth-wheel" transform={`translate(${(refX(kingpin) - 200).toFixed(1)} ${dyAt(kingpin).toFixed(1)})`}>
          <path d="M 164 278 L 236 278 L 230 290 L 170 290 Z" className="t-chassis" />
          <path d="M 146 272 L 154 265 L 246 265 L 254 272 L 254 278 L 146 278 Z" className="t-metal-dk" />
          <line x1="154" y1="265.5" x2="246" y2="265.5" className="t-seam-hi" strokeOpacity=".35" />
          <path d="M 200 265 L 200 278" className="t-seam" />
          <line x1="236" y1="275" x2="260" y2="284" stroke="var(--truck-metal)" strokeWidth="2" strokeLinecap="square" />
        </g>

        {/* caixa de baterias, AdBlue, tanque de combustível */}
        <g data-part="tanks" transform={`translate(0 ${tankDy.toFixed(1)})`}>
          <rect x={tr} y="298" width="40" height="44" rx="1" className="t-plastic" />
          <line x1={tr} y1="305" x2={tr + 40} y2="305" className="t-seam" />
          <rect x={tr + 6} y="309" width="6" height="3" className="t-metal-dk" />
          <rect x={tr + 28} y="309" width="6" height="3" className="t-metal-dk" />
          <rect x={tr + 46} y="302" width="16" height="40" rx="4" className="t-plastic-2" />
          <rect x={tr + 50} y="298" width="8" height="5" rx="1" className="t-adblue" />
          {fuelW >= 50 && (
            <g>
              <rect x={fuelX} y="294" width={fuelW} height="56" rx="10" className="t-metal" />
              <rect x={fuelX + 4} y="297" width={fuelW - 8} height="7" rx="3.5" className="t-hi" opacity=".22" />
              <path d={`M ${fuelX} 336 L ${fuelX + fuelW} 336 L ${fuelX + fuelW} 340 Q ${fuelX + fuelW} 350 ${fuelX + fuelW - 10} 350 L ${fuelX + 10} 350 Q ${fuelX} 350 ${fuelX} 340 Z`} className="t-shade" />
              <line x1={fuelX + 2} y1="322" x2={fuelX + fuelW - 2} y2="322" className="t-seam" strokeOpacity=".18" />
              <rect x={fuelX + 18} y="292" width="6" height="60" className="t-metal-dk" />
              <rect x={fuelX + fuelW - 24} y="292" width="6" height="60" className="t-metal-dk" />
              <rect x={fuelX + fuelW - 14} y="289" width="10" height="6" rx="1" className="t-metal-dk" />
            </g>
          )}
        </g>

        {/* ===== RODAS ===== */}
        {axles.map((a, i) => wheel(a, i))}

        {/* para-lamas traseiros (ponte entre eixos em tandem) + para-barro */}
        {rear.map((a, i) => {
          const d = refX(a.x) - 175;
          const fdy = dyAt(a.x);
          const next = rear[i + 1];
          return (
            <g key={`f${i}`} transform={`translate(${d.toFixed(1)} ${fdy.toFixed(1)})`}>
              <path d="M 113 352 L 113 344 A 62 62 0 0 1 237 344 L 237 352 L 231 352 L 231 346 A 56 56 0 0 0 119 346 L 119 352 Z" className="t-plastic" />
              {next && next.x - a.x < 1.8 && <rect x={113 - (next.x - a.x) * 100 + 124} y="300" width={Math.max(0, (next.x - a.x) * 100 - 124)} height="8" className="t-plastic" />}
            </g>
          );
        })}
        <g transform={`translate(${(refX(lastAxle.x) - 175).toFixed(1)} ${dyAt(lastAxle.x).toFixed(1)})`}>
          <rect x="104" y="350" width="8" height="42" className="t-rubber" />
          <rect x="104" y="350" width="8" height="5" className="t-plastic-2" />
        </g>

        {/* lanternas traseiras do cavalo */}
        <g data-part="tail" transform={`translate(${(re - 64).toFixed(1)} ${dyAt(chassisEnd).toFixed(1)})`}>
          <rect x="54" y="320" width="12" height="30" rx="1" className="t-plastic" />
          <rect x="56" y="322" width="8" height="6" className="t-lens-amber" />
          <rect x="56" y="322" width="8" height="6" className={lampCls('t-lit-amber', lights.blinkerLeftOn)} data-lamp="blinker-left-rear" />
          <rect x="56" y="329" width="8" height="6" className="t-lens-red" />
          <rect x="56" y="329" width="8" height="6" className={lampCls('t-lit-red', lights.parking || lights.brake)} style={tailStyle} data-lamp="tail" />
          <rect x="56" y="336" width="8" height="6" className="t-lens-red" />
          <rect x="56" y="336" width="8" height="6" className={lampCls('t-lit-red', lights.brake)} data-lamp="brake" />
          <rect x="56" y="343" width="8" height="5" className="t-lens-clear" />
          <rect x="56" y="343" width="8" height="5" className={lampCls('t-lit-white', lights.reverse)} data-lamp="reverse" />
        </g>

        {/* ===== CABINE ===== */}
        <g transform={`translate(0 ${cabDy.toFixed(1)})`}>
          <g data-part="cab">
            {/* colarinho / defletor lateral traseiro */}
            <path d={`M 450 ${44 + dy} L 440 ${54 + dy} L 440 270 L 452 280 Z`} className="t-paint" />
            <path d={`M 450 ${44 + dy} L 440 ${54 + dy} L 440 270 L 452 280 Z`} className="t-shade-2" />
            <rect x="446" y="280" width="14" height="12" className="t-chassis" />

            {/* casca pintada + camadas planas de sombreamento */}
            <path d={shell} className="t-paint" />
            <path d="M 640 50 Q 638 31 612 30 L 466 28 Q 455 28 454 38 L 454 46 Q 455 36 466 36 L 612 38 Q 632 39 637 56 Z" className="t-hi" transform={`translate(${26 - rake} ${dy})`} />
            <path d="M 452 229 L 676.6 229 L 679.5 280 L 452 280 Z" className="t-shade" />
            <path d="M 680 288 L 675 200 L 669 200 L 674 288 Z" className="t-shade-2" />
            <line x1="452" y1="227.5" x2="676" y2="227.5" className="t-seam-hi" />
            <line x1="452" y1="229" x2="676" y2="229" className="t-seam" />
            <line x1="451" y1={96 + dy} x2="532" y2={96 + dy} className="t-seam" />
            {sp.roofStyle === 'stepped' && <line x1="452" y1={ry + 10} x2="532" y2={ry + 10} className="t-seam-hi" />}
            {/* coluna A: vedação + lâmina do para-brisa */}
            <path d={`M 671 ${wsB} L ${wsTopX + 1} ${ry + 33} L ${wsTopX - 2} ${ry + 35} L 667 ${wsB} Z`} className="t-glass" />
            <line x1="670" y1={wsB} x2={wsTopX} y2={ry + 33} stroke="#000" strokeOpacity=".5" strokeWidth="1.5" />

            {/* porta e janela com recorte inferior (visão do meio-fio) */}
            <path d="M 650 96 L 661 188 L 663 272 Q 663 276 659 276 L 536 276 Q 532 276 532 272 L 532 104 Q 532 96 540 96 Z" className="t-seam" />
            {sp.doorStyle === 'curved' && <path d="M 534 214 Q 600 204 662 214" className="t-seam" />}
            <clipPath id={`${uid}-win`}>
              <path d="M 548 184 L 627 184 L 652 196 L 638 106 L 556 104 Q 548 104 548 112 Z" />
            </clipPath>
            <path d="M 548 184 L 627 184 L 652 196 L 638 106 L 556 104 Q 548 104 548 112 Z" className="t-glass" />
            <g clipPath={`url(#${uid}-win)`}>
              <path d="M 596 100 L 618 100 L 586 200 L 564 200 Z" className="t-glass-hi" />
              <path d="M 626 100 L 632 100 L 600 200 L 594 200 Z" className="t-glass-hi" />
              <rect x="560" y="150" width="34" height="40" className="t-ink" opacity=".35" />
            </g>
            <path d="M 548 184 L 627 184 L 652 196 L 638 106 L 556 104 Q 548 104 548 112 Z" fill="none" stroke="#000" strokeOpacity=".7" strokeWidth="2.5" strokeLinejoin="round" />
            <rect x="548" y="204" width="16" height="4" rx="1" className="t-plastic" />
            <rect x="524" y="150" width="4" height="104" rx="2" className="t-plastic" />
            {/* tomada de ar lateral */}
            <rect x="470" y="116" width="50" height="40" className="t-seam" />
            <g className="t-ink" opacity=".45">
              {[120, 127, 134, 141, 148].map((y) => (
                <rect key={y} x="473" y={y} width="44" height="3" />
              ))}
            </g>
            {/* bagageiro lateral */}
            <rect x="462" y="238" width="58" height="34" rx="2" className="t-seam" />
            <rect x="508" y="252" width="8" height="3" className="t-plastic" />

            {/* para-sol */}
            {sp.sunVisor && <path d={`M ${wsTopX + 2} ${ry + 19} L ${wsTopX + 23} ${ry + 27} L ${wsTopX + 23} ${ry + 31} L ${wsTopX + 1} ${ry + 29} Z`} className="t-plastic" />}

            {/* para-lama dianteiro + caixa de degraus (plástico) */}
            <path d="M 606 280 L 606 352 L 597 352 L 597 348 A 62 62 0 0 0 473 348 L 473 352 L 452 352 L 452 280 Z" className="t-plastic" />
            <path d="M 593 348 A 58 58 0 0 0 477 348" fill="none" stroke="#000" strokeOpacity=".55" strokeWidth="4" />
            <rect x="452" y="290" width="21" height="62" className="t-ink" opacity=".45" />
            <g className="t-metal-dk">
              <rect x="454" y="296" width="18" height="4" />
              <rect x="454" y="320" width="18" height="4" />
              <rect x="454" y="344" width="18" height="4" />
            </g>
            {[296.5, 320.5, 344.5].map((y) => (
              <line key={y} x1="454" y1={y} x2="472" y2={y} className="t-seam-hi" strokeOpacity=".35" />
            ))}
            <rect x="456" y="352" width="12" height="36" className="t-rubber" />

            {/* para-choque */}
            <path d="M 680 288 L 680 344 Q 680 356 670 358 L 606 358 L 606 288 Z" className="t-plastic-2" />
            <line x1="606" y1="288.5" x2="680" y2="288.5" className="t-seam-hi" />
            <rect x="610" y="357" width="68" height="5" className="t-plastic" />
            <line x1="606" y1="322" x2="660" y2="322" className="t-seam" />

            {/* espelhos (principal + grande-angular) */}
            <line x1="662" y1="112" x2="676" y2="108" stroke="var(--truck-plastic)" strokeWidth="3" />
            <line x1="664" y1="186" x2="676" y2="190" stroke="var(--truck-plastic)" strokeWidth="3" />
            <rect x="670" y="92" width="14" height="62" rx="3" className="t-plastic" />
            <rect x="672" y="95" width="3" height="56" className="t-hi" opacity=".1" />
            <rect x="671" y="160" width="12" height="30" rx="3" className="t-plastic" />

            {/* barra de teto */}
            <g data-part="roof-bar" transform={`translate(0 ${dy})`}>
              <rect x="562" y="22" width="3" height="5" className="t-plastic" />
              <rect x="616" y="22" width="3" height="5" className="t-plastic" />
              <rect x="556" y="14" width="70" height="9" rx="1" className="t-plastic" />
              <rect x="621" y="15" width="6" height="7" className="t-lens-clear" />
              <rect x="621" y="15" width="6" height="7" className={lampCls('t-lit-white', roof > 0)} style={roof === 1 ? { opacity: 0.55 } : undefined} data-lamp="auxRoof" />
            </g>
          </g>

          {/* ===== LUZES DA CABINE ===== */}
          <g transform={`translate(0 ${hlDy})`}>
            <path d="M 680 293 L 680 309 L 664 309 Q 660 309 660 305 L 660 296 Q 660 293 664 293 Z" className="t-lens-clear" />
            <rect x="664" y="297" width="15" height="11" className={lampCls('t-lit-xenon', low || high)} data-lamp="lowBeam" />
            <rect x="662" y="294" width="17" height="2.4" className={lampCls('t-lit-white', lights.parking)} data-lamp="parking" />
            <rect x="674" y="310" width="6" height="6" className="t-lens-amber" />
            <rect x="674" y="310" width="6" height="6" className={lampCls('t-lit-amber', lights.blinkerLeftOn)} data-lamp="blinker-left-front" />
          </g>
          {/* repetidor lateral (cat. 6) */}
          <rect x="588" y="284" width="10" height="4" rx="1" className="t-lens-amber" />
          <rect x="588" y="284" width="10" height="4" rx="1" className={lampCls('t-lit-amber', lights.blinkerLeftOn)} data-lamp="blinker-left-side" />
          {/* auxiliar dianteiro / neblina (SDK: auxFront) */}
          <rect x="668" y="330" width="12" height="8" rx="1" className="t-lens-clear" />
          <rect x="669" y="331" width="11" height="6" className={lampCls('t-lit-white', aux > 0)} style={aux === 1 ? { opacity: 0.55 } : undefined} data-lamp="auxFront">
            <title>Aux. dianteiro / neblina</title>
          </rect>
          <g transform={`translate(0 ${dy})`}>
            {/* gabarito do teto (lateral, âmbar) */}
            <rect x="606" y="27" width="7" height="4" rx="1" className="t-lens-amber" />
            <rect x="606" y="27" width="7" height="4" rx="1" className={lampCls('t-lit-amber', lights.parking)} data-lamp="clearance" />
            {/* giroflex */}
            <rect x="468" y="18" width="18" height="6" className="t-plastic" />
            <path d="M 470 18 Q 470 8 477 8 Q 484 8 484 18 Z" className="t-lens-amber" />
            <path d="M 470 18 Q 470 8 477 8 Q 484 8 484 18 Z" className={lampCls('t-lit-amber', lights.beacon, 'tp-beacon')} data-lamp="beacon" />
          </g>
        </g>

        {/* ===== SUSPENSÃO (dado real, mm) ===== */}
        {showSuspension &&
          axles.map((a, i) => {
            const lifted = a.lift > 0.5 ? 22 : 0;
            return shock(a.x, 400 - a.radius * 100 + 15 - lifted, 318 + dyAt(a.x), a.defl, `st${i}`);
          })}
        {showSuspension &&
          hasTrailer &&
          trailerAxles.map((a, i) => {
            const lifted = a.lift > 0.5 ? 22 : 0;
            return shock(a.x, 400 - a.radius * 100 + 15 - lifted, 400 - a.radius * 100 - 48 + (a.vis ?? 0) * 100, a.defl, `sr${i}`);
          })}
      </g>
    </svg>
  );
}
