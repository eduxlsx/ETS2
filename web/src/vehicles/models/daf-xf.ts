import type { VehicleDefinition } from '../types';

/** DAF XF (105 / Euro 6): grade em colmeia, faróis angulares. */
const model: VehicleDefinition = {
  key: 'daf-xf',
  label: 'DAF XF',
  brand: 'DAF',
  paint: '#1e4fa3',
  defaultWheelbase: 3.8,
  side: {
    cabLength: 2.25, roofHeight: 3.85, windshieldBottom: 2.05, windshieldRake: 0.3, roofFrontRadius: 0.2,
    roofStyle: 'flat', noseBulge: 0.06, sunVisor: true,
    sideWindow: { bottom: 2.1, top: 2.9, length: 0.4 }, headlight: { y: 1.0, h: 0.2 }, doorStyle: 'straight',
  },
  front: {
    roofInset: 0, roofY: 34,
    windshield: { top: 78, bottom: 192, insetTop: 14, insetBottom: 10, radius: 8 },
    grille: { top: 204, bottom: 292, inset: 60, insetBottom: 72, style: 'mesh', bars: 0, radius: 0, logoBand: 'metal' },
    headlight: { y: 300, w: 70, h: 22, inset: 30, shape: 'daf-xf' },
    bumper: { top: 296, bottom: 362 },
    logo: { text: 'DAF', y: 214, size: 10 },
    sunVisor: true,
  },
};
export default model;
