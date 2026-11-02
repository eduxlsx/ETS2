/**
 * Catálogo de modelos 2D e regras de identificação a partir dos identificadores
 * do SDK (truck.brand_id / truck.id / truck.name). As regras são regex sobre
 * o texto "brandId id name" em minúsculas e são avaliadas em ordem.
 */
import type { VehicleModelInfo } from './types.js';

export const VEHICLE_MODELS: VehicleModelInfo[] = [
  { key: 'scania-r', label: 'Scania R', brand: 'Scania' },
  { key: 'scania-s', label: 'Scania S', brand: 'Scania' },
  { key: 'volvo-fh3', label: 'Volvo FH (3ª geração)', brand: 'Volvo' },
  { key: 'volvo-fh4', label: 'Volvo FH (4ª geração)', brand: 'Volvo' },
  { key: 'volvo-fh5', label: 'Volvo FH (5ª geração)', brand: 'Volvo' },
  { key: 'mercedes-actros', label: 'Mercedes-Benz Actros', brand: 'Mercedes-Benz' },
  { key: 'mercedes-actros-mp4', label: 'Mercedes-Benz Actros MP4', brand: 'Mercedes-Benz' },
  { key: 'vw-meteor', label: 'Volkswagen Meteor', brand: 'Volkswagen' },
  { key: 'daf-xf', label: 'DAF XF', brand: 'DAF' },
  { key: 'daf-xg', label: 'DAF XG', brand: 'DAF' },
  { key: 'generic', label: 'Genérico (modelo não identificado)', brand: '—' },
];

export const VEHICLE_RULES: { pattern: RegExp; key: string }[] = [
  { pattern: /scania.*(\.s(_|\b)|\ss\b)/, key: 'scania-s' },
  { pattern: /scania/, key: 'scania-r' },
  { pattern: /volvo.*(fh16_2012|fh_2012|fh 2012|2012)/, key: 'volvo-fh4' },
  { pattern: /volvo.*(fh_?20(2\d|19)|fh5|2021|2024)/, key: 'volvo-fh5' },
  { pattern: /volvo.*fh16?\b|volvo.*\bfh16\b/, key: 'volvo-fh3' },
  { pattern: /mercedes.*(actros2014|actros_2014|mp4)/, key: 'mercedes-actros-mp4' },
  { pattern: /mercedes.*actros/, key: 'mercedes-actros' },
  { pattern: /meteor/, key: 'vw-meteor' },
  { pattern: /daf.*\bxg/, key: 'daf-xg' },
  { pattern: /daf.*(xf|2021|euro6)/, key: 'daf-xf' },
];

const BRAND_FALLBACK: Record<string, string> = {
  scania: 'scania-r',
  volvo: 'volvo-fh5',
  mercedes: 'mercedes-actros',
  daf: 'daf-xf',
  volkswagen: 'vw-meteor',
  vw: 'vw-meteor',
};

export function resolveVehicleModel(
  brandId: string | null,
  id: string | null,
  name: string | null,
): { key: string; exact: boolean } {
  const hay = [brandId, id, name].filter(Boolean).join(' ').toLowerCase();
  if (!hay) return { key: 'generic', exact: false };
  for (const rule of VEHICLE_RULES) {
    if (rule.pattern.test(hay)) return { key: rule.key, exact: true };
  }
  const brand = (brandId ?? '').toLowerCase();
  for (const [k, v] of Object.entries(BRAND_FALLBACK)) {
    if (brand.includes(k)) return { key: v, exact: false };
  }
  return { key: 'generic', exact: false };
}

export type TrailerModelKey =
  | 'box' | 'curtain' | 'reefer' | 'tanker' | 'flatbed'
  | 'container' | 'lowbed' | 'log' | 'bulk' | 'tipper' | 'car_transporter' | 'livestock';

/** Catálogo de reboques/carrocerias com rótulos em pt-BR (ordem de exibição). */
export const TRAILER_MODELS: { key: TrailerModelKey; label: string }[] = [
  { key: 'box', label: 'Baú seco' },
  { key: 'curtain', label: 'Sider / lonado' },
  { key: 'reefer', label: 'Frigorífico' },
  { key: 'tanker', label: 'Tanque' },
  { key: 'flatbed', label: 'Carga seca / prancha' },
  { key: 'container', label: 'Porta-contêiner' },
  { key: 'lowbed', label: 'Prancha rebaixada' },
  { key: 'log', label: 'Porta-toras' },
  { key: 'bulk', label: 'Graneleiro / silo' },
  { key: 'tipper', label: 'Basculante' },
  { key: 'car_transporter', label: 'Cegonha' },
  { key: 'livestock', label: 'Boiadeiro / gado' },
];

export const TRAILER_KEYS = TRAILER_MODELS.map((t) => t.key);

/**
 * Regras avaliadas EM ORDEM sobre "body_type id accessory" em minúsculas
 * (DESIGN-SPEC §9.1). A ordem importa: silo/cimento antes de tanque etc.
 */
export const TRAILER_RULES: { pattern: RegExp; key: TrailerModelKey }[] = [
  { pattern: /car_?trans|autotrans|car_carrier|vehicles?/, key: 'car_transporter' },
  { pattern: /livestock|cattle|animal|pig|sheep/, key: 'livestock' },
  { pattern: /container|cont_|\b(20|40|45)ft\b|intermodal/, key: 'container' },
  { pattern: /lowbed|lowloader|low_loader|lowboy|overweight|heavy|excavat|dozer/, key: 'lowbed' },
  { pattern: /\blog|timber|wood|trunk/, key: 'log' },
  { pattern: /silo|bulk|cement|powder|grain|pellet/, key: 'bulk' },
  { pattern: /tipper|dumper|dump|gravel|sand|coal|aggregate/, key: 'tipper' },
  { pattern: /reef|refrig|cool|frozen|chill|fridge/, key: 'reefer' },
  { pattern: /tank|fuel|chem|food_tank|gas|petrol|diesel|adr/, key: 'tanker' },
  { pattern: /curtain|cs_|curtainsider|tautliner/, key: 'curtain' },
  { pattern: /flat|platform|stake/, key: 'flatbed' },
  { pattern: /box|dry|van|moving|insul/, key: 'box' },
];

/** Tipo de carroceria a partir de trailer.body_type / id / cargo accessory. */
export function resolveTrailerModel(bodyType: string | null, id: string | null, accessory: string | null): TrailerModelKey | null {
  const hay = [bodyType, id, accessory].filter(Boolean).join(' ').toLowerCase();
  if (!hay) return null;
  for (const r of TRAILER_RULES) if (r.pattern.test(hay)) return r.key;
  return null;
}
