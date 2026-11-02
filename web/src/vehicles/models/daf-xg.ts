import type { VehicleDefinition } from '../types';

/** DAF XG / XG+ (2021+): cabine maior e mais alta, faróis finos, para-brisa amplo. */
const model: VehicleDefinition = {
  key: 'daf-xg',
  label: 'DAF XG',
  brand: 'DAF',
  paint: '#5a6470',
  defaultWheelbase: 3.9,
  side: {
    cabLength: 2.65, roofHeight: 4.02, windshieldBottom: 2.1, windshieldRake: 0.42, roofFrontRadius: 0.3,
    roofStyle: 'rounded', noseBulge: 0.12, sunVisor: false,
    sideWindow: { bottom: 2.15, top: 3.0, length: 0.36 }, headlight: { y: 1.08, h: 0.16 }, doorStyle: 'curved',
  },
  front: {
    roofInset: 0, roofY: 14,
    windshield: { top: 58, bottom: 196, insetTop: 14, insetBottom: 10, radius: 10 },
    grille: { top: 206, bottom: 290, inset: 62, insetBottom: 72, style: 'mesh', bars: 3, radius: 0, logoBand: 'metal' },
    headlight: { y: 296, w: 70, h: 18, inset: 30, shape: 'daf-xg' },
    bumper: { top: 296, bottom: 362 },
    logo: { text: 'DAF', y: 216, size: 10 },
    sunVisor: false,
  },
};
export default model;
