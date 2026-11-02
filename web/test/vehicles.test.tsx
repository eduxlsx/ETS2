import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { WheelData } from '../../shared/types';
import { TRAILER_KEYS, VEHICLE_MODELS } from '../../shared/vehicles';
import { TRAILER_DRAWINGS } from '../src/vehicles/trailers';
import { getVehicle, VEHICLES } from '../src/vehicles/registry';
import { TruckFront } from '../src/vehicles/TruckFront';
import { groupAxles, TruckSide } from '../src/vehicles/TruckSide';
import { emptyFrame, lightsAll } from './fixtures';

const lamp = (c: HTMLElement, name: string) => Array.from(c.querySelectorAll(`[data-lamp="${name}"]`));
const allOn = (els: Element[]) => els.length > 0 && els.every((e) => e.classList.contains('on'));
const allOff = (els: Element[]) => els.length > 0 && els.every((e) => !e.classList.contains('on'));

describe('registro de modelos', () => {
  it('tem um arquivo de definição para cada modelo do catálogo compartilhado', () => {
    expect(VEHICLES.map((v) => v.key).sort()).toEqual(VEHICLE_MODELS.map((m) => m.key).sort());
  });
  it('chave desconhecida cai no genérico', () => {
    expect(getVehicle('nao-existe').key).toBe('generic');
  });
});

describe.each(VEHICLES.map((v) => [v.key, v] as const))('modelo %s', (key, vehicle) => {
  const frame = emptyFrame();

  it('vista frontal: luzes apagadas', () => {
    const { container } = render(<TruckFront vehicle={vehicle} lights={lightsAll(false)} wipers={{ on: false, stage: null }} />);
    expect(container.querySelector('[data-testid="truck-front"]')).toHaveAttribute('data-model', key);
    for (const l of ['lowBeam', 'highBeam', 'parking', 'auxFront', 'auxRoof', 'beacon', 'blinker-left', 'blinker-right', 'clearance']) {
      expect(allOff(lamp(container, l))).toBe(true);
    }
  });

  it('vista frontal: luzes acesas', () => {
    const { container } = render(<TruckFront vehicle={vehicle} lights={lightsAll(true)} wipers={{ on: true, stage: null }} />);
    for (const l of ['lowBeam', 'highBeam', 'parking', 'auxFront', 'auxRoof', 'beacon', 'blinker-left', 'blinker-right', 'clearance']) {
      expect(allOn(lamp(container, l))).toBe(true);
    }
    expect(allOn(lamp(container, 'wipers'))).toBe(true);
  });

  it('vista frontal: seta esquerda do caminhão aparece à direita de quem olha', () => {
    const { container } = render(<TruckFront vehicle={vehicle} lights={{ ...lightsAll(false), blinkerLeftOn: true }} />);
    const left = lamp(container, 'blinker-left');
    expect(allOn(left)).toBe(true);
    expect(allOff(lamp(container, 'blinker-right'))).toBe(true);
    expect(left[0].closest('g')?.getAttribute('transform')).toContain('scale(-1 1)');
  });

  it('vista lateral: lanternas, freio, ré, pisca e giroflex', () => {
    const lights = { ...lightsAll(false), brake: true, reverse: true, blinkerLeftOn: true, beacon: true, parking: true };
    const { container } = render(<TruckSide vehicle={vehicle} lights={lights} suspension={frame.suspension} trailer={{ attached: false, modelKey: 'box' }} />);
    expect(container.querySelector('[data-testid="truck-side"]')).toHaveAttribute('data-model', key);
    for (const l of ['brake', 'reverse', 'blinker-left-front', 'blinker-left-side', 'blinker-left-rear', 'beacon', 'tail', 'parking']) {
      expect(allOn(lamp(container, l))).toBe(true);
    }
    expect(allOff(lamp(container, 'lowBeam'))).toBe(true);
    expect(container.querySelector('[data-testid="trailer-side"]')).toBeNull();
  });

  it.each(TRAILER_KEYS)('vista lateral com reboque %s', (t) => {
    const { container } = render(<TruckSide vehicle={vehicle} lights={lightsAll(false)} suspension={frame.suspension} trailer={{ attached: true, modelKey: t }} />);
    expect(container.querySelector('[data-testid="trailer-side"]')).toHaveAttribute('data-type', t);
    expect(container.querySelectorAll('[data-testid^="trailer-axle-"]')).toHaveLength(3);
  });
});

describe('suspensão e eixos', () => {
  const wheel = (index: number, z: number, defl: number, x = -1): WheelData => ({
    index, position: { x, y: 0.5, z }, radius: 0.52, suspDeflection: defl, onGround: true, lift: 0, liftable: false, powered: false, steerable: false, substance: null,
  });

  it('agrupa rodas por eixo usando a posição real', () => {
    const groups = groupAxles([wheel(0, -1.5, 0.01), wheel(1, -1.5, 0.03, 1), wheel(2, 2.1, 0.02), wheel(3, 3.4, 0.04)]);
    expect(groups.map((g) => g.z)).toEqual([-1.5, 2.1, 3.4]);
    expect(groups[0].defl).toBeCloseTo(0.02);
  });

  it('desenha um eixo por grupo de rodas do SDK', () => {
    const f = emptyFrame();
    f.suspension.truckWheels = [wheel(0, -1.5, 0), wheel(1, 2.1, 0), wheel(2, 3.4, 0), wheel(3, 4.7, 0)];
    const { container } = render(<TruckSide vehicle={getVehicle('volvo-fh5')} lights={lightsAll(false)} suspension={f.suspension} trailer={{ attached: false, modelKey: 'box' }} />);
    expect(container.querySelectorAll('[data-testid^="truck-axle-"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-part="shock"]')).toHaveLength(4);
  });

  it('mostra a deflexão real (mm) sob cada roda', () => {
    const f = emptyFrame();
    f.suspension.truckWheels = [wheel(0, -1.5, -0.017), wheel(1, 2.1, 0.042)];
    const { container } = render(<TruckSide vehicle={getVehicle('scania-r')} lights={lightsAll(false)} suspension={f.suspension} trailer={{ attached: false, modelKey: 'box' }} />);
    const labels = Array.from(container.querySelectorAll('[data-part="shock"] text')).map((t) => t.textContent);
    expect(labels).toEqual(['-17', '42']);
  });
});

describe('catálogo de reboques', () => {
  it('há um desenho para cada tipo do catálogo compartilhado', () => {
    expect(Object.keys(TRAILER_DRAWINGS).sort()).toEqual([...TRAILER_KEYS].sort());
  });

  it.each(TRAILER_KEYS)('reboque %s: lanternas, freio, ré, pisca e marcadores seguem as luzes', (t) => {
    const f = emptyFrame();
    const on = { ...lightsAll(false), parking: true, brake: true, reverse: true, blinkerLeftOn: true };
    const { container } = render(<TruckSide vehicle={getVehicle('generic')} lights={on} suspension={f.suspension} trailer={{ attached: true, modelKey: t }} />);
    const tr = container.querySelector('[data-testid="trailer-side"]') as HTMLElement;
    for (const l of ['tail', 'brake', 'reverse', 'blinker-left-rear', 'side-marker']) expect(allOn(lamp(tr, l))).toBe(true);
    const { container: c2 } = render(<TruckSide vehicle={getVehicle('generic')} lights={lightsAll(false)} suspension={f.suspension} trailer={{ attached: true, modelKey: t }} />);
    const tr2 = c2.querySelector('[data-testid="trailer-side"]') as HTMLElement;
    for (const l of ['tail', 'brake', 'reverse', 'blinker-left-rear', 'side-marker']) expect(allOff(lamp(tr2, l))).toBe(true);
  });

  it('usa a posição real dos eixos do reboque (2 eixos → 2 rodas desenhadas)', () => {
    const f = emptyFrame();
    const w = (index: number, z: number): WheelData => ({ index, position: { x: -1, y: 0.5, z }, radius: 0.5, suspDeflection: 0.02, onGround: true, lift: 0, liftable: false, powered: false, steerable: false, substance: null });
    f.suspension.trailerWheels = [w(0, 7.7), w(1, 9.0)];
    const { container } = render(<TruckSide vehicle={getVehicle('generic')} lights={lightsAll(false)} suspension={f.suspension} trailer={{ attached: true, modelKey: 'reefer' }} />);
    expect(container.querySelectorAll('[data-testid^="trailer-axle-"]')).toHaveLength(2);
  });

  it('tipo desconhecido cai no baú', () => {
    const f = emptyFrame();
    const { container } = render(<TruckSide vehicle={getVehicle('generic')} lights={lightsAll(false)} suspension={f.suspension} trailer={{ attached: true, modelKey: 'xyz' }} />);
    expect(container.querySelector('[data-testid="trailer-side"]')).toHaveAttribute('data-type', 'box');
  });
});

describe('eixos do cavalo', () => {
  it('6x2: eixo auxiliar erguido aparece com contorno tracejado', () => {
    const f = emptyFrame();
    const w = (index: number, z: number, lift = 0, powered = false): WheelData => ({ index, position: { x: -1, y: 0.5, z }, radius: 0.52, suspDeflection: 0, onGround: true, lift, liftable: lift > 0, powered, steerable: false, substance: null });
    f.suspension.truckWheels = [w(0, -1.9), w(1, 1.7, 0, true), w(2, 3.05, 1)];
    const { container } = render(<TruckSide vehicle={getVehicle('scania-r')} lights={lightsAll(false)} suspension={f.suspension} trailer={{ attached: false, modelKey: 'box' }} />);
    expect(container.querySelectorAll('[data-testid^="truck-axle-"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-part="lift-ghost"]')).toHaveLength(1);
  });
});
