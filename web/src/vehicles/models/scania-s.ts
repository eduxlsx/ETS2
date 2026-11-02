import type { VehicleDefinition } from '../types';

/** Scania S: cabine de piso plano, mais alta, para-brisa maior e faróis com DRL. */
const model: VehicleDefinition = {
  key: 'scania-s',
  label: 'Scania S',
  brand: 'Scania',
  paint: '#1f3b63',
  defaultWheelbase: 3.7,
  side: {
    cabLength: 2.3, roofHeight: 3.98, windshieldBottom: 2.2, windshieldRake: 0.28, roofFrontRadius: 0.2,
    roofStyle: 'flat', noseBulge: 0.04, sunVisor: true,
    sideWindow: { bottom: 2.25, top: 3.0, length: 0.42 }, headlight: { y: 0.98, h: 0.16 }, doorStyle: 'straight',
  },
  front: {
    roofInset: 0, roofY: 22,
    windshield: { top: 66, bottom: 188, insetTop: 14, insetBottom: 10, radius: 6 },
    grille: { top: 200, bottom: 294, inset: 64, style: 'horizontal-bars', bars: 7, radius: 0, logoBand: 'paint' },
    headlight: { y: 300, w: 66, h: 24, inset: 30, shape: 'scania-s' },
    bumper: { top: 296, bottom: 362 },
    logo: { text: 'SCANIA', y: 213, size: 10 },
    sunVisor: true,
    signature: 'M 14 1.5 H 60 V 4.1 H 16.6 V 21 H 14 Z',
  },
};
export default model;
