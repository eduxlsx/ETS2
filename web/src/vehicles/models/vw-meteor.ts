import type { VehicleDefinition } from '../types';

/** Volkswagen Meteor: cabine alta, grade de barras largas, faróis retangulares. */
const model: VehicleDefinition = {
  key: 'vw-meteor',
  label: 'Volkswagen Meteor',
  brand: 'Volkswagen',
  paint: '#f2f2f0',
  defaultWheelbase: 3.6,
  side: {
    cabLength: 2.25, roofHeight: 3.78, windshieldBottom: 2.05, windshieldRake: 0.3, roofFrontRadius: 0.2,
    roofStyle: 'stepped', noseBulge: 0.08, sunVisor: true,
    sideWindow: { bottom: 2.1, top: 2.85, length: 0.42 }, headlight: { y: 1.05, h: 0.22 }, doorStyle: 'straight',
  },
  front: {
    roofInset: 0, roofY: 30,
    windshield: { top: 78, bottom: 192, insetTop: 14, insetBottom: 10, radius: 6 },
    grille: { top: 204, bottom: 290, inset: 62, style: 'wide-bars', bars: 4, radius: 2, emblem: 'disc' },
    headlight: { y: 298, w: 70, h: 26, inset: 28, shape: 'meteor' },
    bumper: { top: 296, bottom: 362 },
    logo: { text: '', y: 0, size: 0 },
    sunVisor: true,
  },
  notes: 'O Meteor não é nativo do ETS2; é identificado pelo id do mod (ex.: vehicle.volkswagen.meteor).',
};
export default model;
