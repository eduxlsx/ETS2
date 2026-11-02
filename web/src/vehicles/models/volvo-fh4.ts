import type { VehicleDefinition } from '../types';

/** Volvo FH (4ª geração, 2012–2020): faróis em "bumerangue", grade em degrau. */
const model: VehicleDefinition = {
  key: 'volvo-fh4',
  label: 'Volvo FH (4ª geração)',
  brand: 'Volvo',
  paint: '#d8dde4',
  defaultWheelbase: 3.7,
  side: {
    cabLength: 2.3, roofHeight: 3.8, windshieldBottom: 2.05, windshieldRake: 0.36, roofFrontRadius: 0.26,
    roofStyle: 'rounded', noseBulge: 0.1, sunVisor: false,
    sideWindow: { bottom: 2.1, top: 2.85, length: 0.38 }, headlight: { y: 1.1, h: 0.24 }, doorStyle: 'curved',
  },
  front: {
    roofInset: 0, roofY: 30,
    windshield: { top: 74, bottom: 190, insetTop: 14, insetBottom: 10, radius: 12 },
    grille: { top: 204, bottom: 262, inset: 76, insetBottom: 86, style: 'diagonal', bars: 4, radius: 0, emblem: 'ring' },
    headlight: { y: 248, w: 68, h: 40, inset: 34, shape: 'volvo-fh4' },
    bumper: { top: 290, bottom: 362 },
    logo: { text: 'VOLVO', y: 278, size: 10 },
    sunVisor: false,
  },
};
export default model;
