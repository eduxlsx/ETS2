/**
 * Registro de modelos. Cada arquivo em ./models é independente; para adicionar
 * um caminhão novo basta criar o arquivo, incluí-lo aqui e adicionar uma regra
 * de identificação em shared/vehicles.ts.
 */
import type { VehicleDefinition } from './types';
import scaniaR from './models/scania-r';
import scaniaS from './models/scania-s';
import volvoFh3 from './models/volvo-fh3';
import volvoFh4 from './models/volvo-fh4';
import volvoFh5 from './models/volvo-fh5';
import actros from './models/mercedes-actros';
import actrosMp4 from './models/mercedes-actros-mp4';
import meteor from './models/vw-meteor';
import dafXf from './models/daf-xf';
import dafXg from './models/daf-xg';
import generic from './models/generic';

export const VEHICLES: VehicleDefinition[] = [scaniaR, scaniaS, volvoFh3, volvoFh4, volvoFh5, actros, actrosMp4, meteor, dafXf, dafXg, generic];

const byKey = new Map(VEHICLES.map((v) => [v.key, v]));

export function getVehicle(key: string | null | undefined): VehicleDefinition {
  return (key && byKey.get(key)) || generic;
}
