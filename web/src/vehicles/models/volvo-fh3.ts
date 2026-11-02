import type { VehicleDefinition } from '../types';

/** Volvo FH (3ª geração, 2008–2012): faróis retangulares com recorte, grade com diagonal. */
const model: VehicleDefinition = {
  key: 'volvo-fh3',
  label: 'Volvo FH (3ª geração)',
  brand: 'Volvo',
  paint: '#7c1d1d',
  defaultWheelbase: 3.7,
  side: {
    cabLength: 2.25, roofHeight: 3.7, windshieldBottom: 2.0, windshieldRake: 0.38, roofFrontRadius: 0.28,
    roofStyle: 'rounded', noseBulge: 0.08, sunVisor: true,
    sideWindow: { bottom: 2.05, top: 2.8, length: 0.4 }, headlight: { y: 1.05, h: 0.22 }, doorStyle: 'curved',
  },
  front: {
    roofInset: 0, roofY: 40,
    windshield: { top: 84, bottom: 192, insetTop: 14, insetBottom: 10, radius: 6 },
    grille: { top: 204, bottom: 262, inset: 76, insetBottom: 86, style: 'diagonal', bars: 4, radius: 0 },
    headlight: { y: 250, w: 66, h: 34, inset: 34, shape: 'volvo-fh3' },
    bumper: { top: 290, bottom: 362 },
    logo: { text: 'VOLVO', y: 278, size: 10 },
    sunVisor: true,
  },
};
export default model;
