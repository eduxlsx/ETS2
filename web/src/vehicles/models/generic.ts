import type { VehicleDefinition } from '../types';

/** Silhueta genérica, usada quando o modelo não pôde ser identificado. Não representa nenhum fabricante. */
const model: VehicleDefinition = {
  key: 'generic',
  label: 'Genérico (modelo não identificado)',
  brand: '—',
  paint: '#6b7280',
  defaultWheelbase: 3.7,
  side: {
    cabLength: 2.3, roofHeight: 3.7, windshieldBottom: 2.05, windshieldRake: 0.3, roofFrontRadius: 0.2,
    roofStyle: 'flat', noseBulge: 0.05, sunVisor: false,
    sideWindow: { bottom: 2.1, top: 2.85, length: 0.4 }, headlight: { y: 1.0, h: 0.2 }, doorStyle: 'straight',
  },
  front: {
    roofInset: 0, roofY: 42,
    windshield: { top: 86, bottom: 194, insetTop: 14, insetBottom: 10, radius: 8 },
    grille: { top: 208, bottom: 290, inset: 68, style: 'horizontal-bars', bars: 5, radius: 2 },
    headlight: { y: 300, w: 64, h: 26, inset: 30, shape: 'generic' },
    bumper: { top: 296, bottom: 362 },
    logo: { text: '', y: 0, size: 0 },
    sunVisor: false,
  },
};
export default model;
