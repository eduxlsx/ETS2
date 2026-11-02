import type { VehicleDefinition } from '../types';

/** Volvo FH (5ª geração, 2020+): faróis com assinatura em "martelo", grade mais larga. */
const model: VehicleDefinition = {
  key: 'volvo-fh5',
  label: 'Volvo FH (5ª geração)',
  brand: 'Volvo',
  paint: '#2c4a3e',
  defaultWheelbase: 3.8,
  side: {
    cabLength: 2.3, roofHeight: 3.85, windshieldBottom: 2.05, windshieldRake: 0.34, roofFrontRadius: 0.24,
    roofStyle: 'stepped', noseBulge: 0.1, sunVisor: false,
    sideWindow: { bottom: 2.1, top: 2.9, length: 0.36 }, headlight: { y: 1.1, h: 0.24 }, doorStyle: 'curved',
  },
  front: {
    roofInset: 0, roofY: 28,
    windshield: { top: 72, bottom: 190, insetTop: 14, insetBottom: 10, radius: 10 },
    grille: { top: 204, bottom: 264, inset: 70, insetBottom: 82, style: 'diagonal', bars: 4, radius: 0, emblem: 'ring' },
    headlight: { y: 248, w: 68, h: 40, inset: 34, shape: 'volvo-fh5' },
    bumper: { top: 290, bottom: 362 },
    logo: { text: 'VOLVO', y: 278, size: 10 },
    sunVisor: false,
    signature: 'M 6 6 L 58 3 L 58 7 L 30 8.6 L 30 14 L 26 14 L 26 8.8 L 10 10 L 10 34 L 6 34 Z',
  },
};
export default model;
