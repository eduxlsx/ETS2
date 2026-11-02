import type { VehicleDefinition } from '../types';

/** Mercedes-Benz Actros (MP3 e nova geração): cabine alta, faróis estreitos, grade de lamelas. */
const model: VehicleDefinition = {
  key: 'mercedes-actros',
  label: 'Mercedes-Benz Actros',
  brand: 'Mercedes-Benz',
  paint: '#e6e8eb',
  defaultWheelbase: 3.7,
  side: {
    cabLength: 2.3, roofHeight: 3.88, windshieldBottom: 2.1, windshieldRake: 0.3, roofFrontRadius: 0.18,
    roofStyle: 'flat', noseBulge: 0.05, sunVisor: false,
    sideWindow: { bottom: 2.15, top: 2.95, length: 0.4 }, headlight: { y: 1.1, h: 0.18 }, doorStyle: 'straight',
  },
  front: {
    roofInset: 0, roofY: 32,
    windshield: { top: 76, bottom: 190, insetTop: 14, insetBottom: 10, radius: 6 },
    grille: { top: 204, bottom: 284, inset: 58, style: 'horizontal-bars', bars: 4, radius: 4, emblem: 'disc' },
    headlight: { y: 292, w: 70, h: 32, inset: 28, shape: 'actros' },
    bumper: { top: 292, bottom: 362 },
    logo: { text: '', y: 0, size: 0 },
    sunVisor: false,
  },
};
export default model;
