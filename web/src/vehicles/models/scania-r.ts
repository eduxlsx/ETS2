import type { VehicleDefinition } from '../types';

/** Scania R (série R 2009/2016): grade alta com barras horizontais, faróis no para-choque. */
const model: VehicleDefinition = {
  key: 'scania-r',
  label: 'Scania R',
  brand: 'Scania',
  paint: '#c9ced6',
  defaultWheelbase: 3.6,
  side: {
    cabLength: 2.3, roofHeight: 3.75, windshieldBottom: 2.05, windshieldRake: 0.32, roofFrontRadius: 0.22,
    roofStyle: 'rounded', noseBulge: 0.06, sunVisor: true,
    sideWindow: { bottom: 2.1, top: 2.85, length: 0.42 }, headlight: { y: 0.95, h: 0.18 }, doorStyle: 'straight',
  },
  front: {
    roofInset: 0, roofY: 38,
    windshield: { top: 82, bottom: 194, insetTop: 14, insetBottom: 10, radius: 6 },
    grille: { top: 206, bottom: 294, inset: 64, style: 'horizontal-bars', bars: 6, radius: 0, logoBand: 'paint' },
    headlight: { y: 300, w: 66, h: 24, inset: 30, shape: 'scania-r' },
    bumper: { top: 296, bottom: 362 },
    logo: { text: 'SCANIA', y: 219, size: 10 },
    sunVisor: true,
  },
};
export default model;
