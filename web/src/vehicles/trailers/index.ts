/** Catálogo de desenhos de reboque (um arquivo por tipo, ver DESIGN-SPEC §9). */
import type { TrailerModelKey } from '../../../../shared/vehicles';
import box from './box';
import bulk from './bulk';
import carTransporter from './car_transporter';
import container from './container';
import curtain from './curtain';
import flatbed from './flatbed';
import livestock from './livestock';
import log from './log';
import lowbed from './lowbed';
import reefer from './reefer';
import tanker from './tanker';
import tipper from './tipper';
import type { TrailerDrawing } from './common';

export const TRAILER_DRAWINGS: Record<TrailerModelKey, TrailerDrawing> = {
  box,
  curtain,
  reefer,
  tanker,
  flatbed,
  container,
  lowbed,
  log,
  bulk,
  tipper,
  car_transporter: carTransporter,
  livestock,
};

export function getTrailerDrawing(key: string | null | undefined): TrailerDrawing {
  return (key && (TRAILER_DRAWINGS as Record<string, TrailerDrawing>)[key]) || box;
}

export type { TrailerDrawing, TrailerLamps } from './common';
