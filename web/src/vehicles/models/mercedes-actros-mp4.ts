import type { VehicleDefinition } from '../types';

/** Mercedes-Benz Actros MP4 (2011+): faróis grandes com "sobrancelha", grade com barras largas. */
const model: VehicleDefinition = {
  key: 'mercedes-actros-mp4',
  label: 'Mercedes-Benz Actros MP4',
  brand: 'Mercedes-Benz',
  paint: '#3b3f46',
  defaultWheelbase: 3.7,
  side: {
    cabLength: 2.3, roofHeight: 3.9, windshieldBottom: 2.1, windshieldRake: 0.33, roofFrontRadius: 0.22,
    roofStyle: 'flat', noseBulge: 0.09, sunVisor: false,
    sideWindow: { bottom: 2.15, top: 2.95, length: 0.4 }, headlight: { y: 1.12, h: 0.24 }, doorStyle: 'curved',
  },
  front: {
    roofInset: 0, roofY: 32,
    windshield: { top: 76, bottom: 190, insetTop: 14, insetBottom: 10, radius: 6 },
    grille: { top: 204, bottom: 284, inset: 58, style: 'wide-bars', bars: 3, radius: 4, emblem: 'disc' },
    headlight: { y: 290, w: 70, h: 32, inset: 28, shape: 'actros-mp4' },
    bumper: { top: 292, bottom: 362 },
    logo: { text: '', y: 0, size: 0 },
    sunVisor: false,
    signature: 'M 4 9 Q 30 -2 66 5 V 8.5 Q 30 1.5 4 12.5 Z M 52 9 Q 60 9.5 66 11 V 14 Q 60 12.5 52 12 Z',
  },
};
export default model;
