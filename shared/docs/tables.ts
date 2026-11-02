/**
 * Tabelas SIMULADAS usadas nos documentos fictícios (DOCUMENTOS-SPEC §1.2):
 * carga → NCM/descrição/preço por kg, empresas/endereços, países (UF), nomes
 * fictícios de concessionárias, postos e órgãos, e o enquadramento das multas.
 * Valores plausíveis, mas inventados — o SDK não fornece nada disso.
 */
import { digits, hashInt } from './ids.js';

export interface CargoTax {
  ncm: string;
  /** Descrição do produto no DANFE. */
  desc: string;
  /** Preço simulado da mercadoria (R$/kg). */
  priceKg: number;
  /** Espécie dos volumes. */
  species: string;
}

const T = (ncm: string, desc: string, priceKg: number, species = 'PALETES'): CargoTax => ({ ncm, desc, priceKg, species });

/** Tabela por `cargo_id` do ETS2 (e dos fretes do DEMO). */
export const CARGO_TAX: Record<string, CargoTax> = {
  dryfruit: T('0813.40.90', 'FRUTAS SECAS DIVERSAS, EMBALADAS EM CAIXAS', 9.8),
  electronics: T('8528.72.00', 'APARELHOS ELETRÔNICOS DE CONSUMO', 85),
  frozen_meat: T('0202.30.00', 'CARNE BOVINA DESOSSADA, CONGELADA', 32, 'CAIXAS'),
  frozen: T('0202.30.00', 'PRODUTOS CONGELADOS', 24, 'CAIXAS'),
  meat: T('0201.30.00', 'CARNE BOVINA RESFRIADA', 30, 'CAIXAS'),
  paper_rolls: T('4802.56.10', 'PAPEL EM BOBINAS', 6.2, 'BOBINAS'),
  paper: T('4802.56.10', 'PAPEL EM BOBINAS', 6.2, 'BOBINAS'),
  diesel: T('2710.19.21', 'ÓLEO DIESEL S10 (GRANEL)', 5.1, 'GRANEL'),
  fuel: T('2710.12.59', 'COMBUSTÍVEL LÍQUIDO (GRANEL)', 5.4, 'GRANEL'),
  petrol: T('2710.12.59', 'GASOLINA (GRANEL)', 5.6, 'GRANEL'),
  steel_beams: T('7216.33.00', 'PERFIS DE AÇO EM H', 7.4, 'FEIXES'),
  coffee_container: T('0901.11.10', 'CAFÉ CRU EM GRÃO, ACONDICIONADO EM CONTÊINER', 18, 'CONTÊINER'),
  coffee: T('0901.11.10', 'CAFÉ CRU EM GRÃO', 18, 'SACAS'),
  excavator: T('8429.52.12', 'ESCAVADEIRA HIDRÁULICA SOBRE ESTEIRAS', 26, 'UNIDADE'),
  logs: T('4403.12.00', 'MADEIRA EM TORAS (EUCALIPTO)', 0.45, 'TORAS'),
  cement: T('2523.29.10', 'CIMENTO PORTLAND A GRANEL', 0.7, 'GRANEL'),
  gravel: T('2517.10.00', 'PEDRA BRITADA', 0.09, 'GRANEL'),
  cars: T('8703.23.10', 'AUTOMÓVEIS DE PASSAGEIROS, 0 KM', 95, 'UNIDADES'),
  cattle: T('0102.29.90', 'BOVINOS VIVOS PARA ABATE', 16, 'CABEÇAS'),
  apples: T('0808.10.00', 'MAÇÃS FRESCAS', 5.5, 'CAIXAS'),
  beverages: T('2202.10.00', 'BEBIDAS NÃO ALCOÓLICAS', 4.2),
  chemicals: T('3824.99.89', 'PRODUTOS QUÍMICOS DIVERSOS (ADR)', 12, 'TAMBORES'),
  furniture: T('9403.60.00', 'MÓVEIS DE MADEIRA', 22, 'VOLUMES'),
  machinery: T('8479.89.99', 'MÁQUINAS E EQUIPAMENTOS', 40, 'VOLUMES'),
  medicines: T('3004.90.99', 'MEDICAMENTOS', 260, 'CAIXAS'),
  milk: T('0401.20.10', 'LEITE CRU (GRANEL)', 2.4, 'GRANEL'),
  potatoes: T('0701.90.00', 'BATATAS FRESCAS', 2.1, 'SACOS'),
  tires: T('4011.20.90', 'PNEUS NOVOS PARA CAMINHÃO', 18, 'UNIDADES'),
  wood: T('4407.11.00', 'MADEIRA SERRADA', 2.8, 'FEIXES'),
};

/** Regras por palavra-chave quando o cargo_id não está na tabela. */
const CARGO_RULES: [RegExp, string][] = [
  [/fruit|fruta/, 'dryfruit'],
  [/frozen|congel|ice/, 'frozen'],
  [/meat|carne|pork|chicken|fish/, 'meat'],
  [/electr|tv|computer|phone/, 'electronics'],
  [/diesel/, 'diesel'],
  [/fuel|gasoline|petrol|kerosene/, 'fuel'],
  [/steel|beam|pipe|metal|aço/, 'steel_beams'],
  [/coffee|café/, 'coffee'],
  [/excavat|dozer|crane|loader|tractor/, 'excavator'],
  [/log|timber|tora/, 'logs'],
  [/wood|lumber|plank/, 'wood'],
  [/cement|cimento|concrete/, 'cement'],
  [/gravel|sand|stone|brita|coal/, 'gravel'],
  [/car|vehicle|auto/, 'cars'],
  [/cattle|cow|pig|sheep|gado|animal/, 'cattle'],
  [/apple/, 'apples'],
  [/beer|drink|beverage|water|juice/, 'beverages'],
  [/chem|acid|ammon|adr/, 'chemicals'],
  [/furnit/, 'furniture'],
  [/machin|engine/, 'machinery'],
  [/medic|pharm|vaccin/, 'medicines'],
  [/milk|leite/, 'milk'],
  [/potato/, 'potatoes'],
  [/tire|tyre|pneu/, 'tires'],
  [/paper|papel/, 'paper'],
];

export const CARGO_FALLBACK: CargoTax = T('9999.99.99', 'MERCADORIA DIVERSA', 5);

export function cargoTax(cargoId: string | null | undefined, cargoName?: string | null): CargoTax & { key: string | null } {
  const id = (cargoId ?? '').toLowerCase();
  if (id && CARGO_TAX[id]) return { ...CARGO_TAX[id], key: id };
  const hay = `${id} ${(cargoName ?? '').toLowerCase()}`;
  for (const [re, key] of CARGO_RULES) if (re.test(hay)) return { ...CARGO_TAX[key], key };
  return { ...CARGO_FALLBACK, key: null };
}

/* ───────────── países / UF ───────────── */

/** Sigla (2 letras) pelo país da placa ou pela cidade. */
const COUNTRY_CODE: Record<string, string> = {
  france: 'FR', germany: 'DE', poland: 'PL', italy: 'IT', spain: 'ES', portugal: 'PT', uk: 'GB', 'united kingdom': 'GB',
  netherlands: 'NL', belgium: 'BE', luxembourg: 'LU', austria: 'AT', switzerland: 'CH', czech: 'CZ', 'czech republic': 'CZ',
  slovakia: 'SK', hungary: 'HU', denmark: 'DK', sweden: 'SE', norway: 'NO', finland: 'FI', estonia: 'EE', latvia: 'LV',
  lithuania: 'LT', russia: 'RU', romania: 'RO', bulgaria: 'BG', turkey: 'TR', greece: 'GR', brazil: 'BR', brasil: 'BR',
  croatia: 'HR', serbia: 'RS', slovenia: 'SI', 'bosnia': 'BA', montenegro: 'ME', albania: 'AL', 'north macedonia': 'MK', ireland: 'IE',
};

/** Cidades comuns do ETS2 (e do DEMO) → país. */
const CITY_COUNTRY: Record<string, string> = {
  calais: 'FR', paris: 'FR', lyon: 'FR', lille: 'FR', reims: 'FR', strasbourg: 'FR', dijon: 'FR', marseille: 'FR', bordeaux: 'FR', toulouse: 'FR', nantes: 'FR', metz: 'FR',
  berlin: 'DE', hamburg: 'DE', munchen: 'DE', 'münchen': 'DE', frankfurt: 'DE', koln: 'DE', 'köln': 'DE', dortmund: 'DE', bremen: 'DE', hannover: 'DE', leipzig: 'DE', dresden: 'DE', stuttgart: 'DE', nurnberg: 'DE',
  rotterdam: 'NL', amsterdam: 'NL', groningen: 'NL', brussel: 'BE', bruxelles: 'BE', liege: 'BE', luxembourg: 'LU',
  london: 'GB', dover: 'GB', manchester: 'GB', liverpool: 'GB', birmingham: 'GB', glasgow: 'GB', edinburgh: 'GB', cardiff: 'GB', felixstowe: 'GB',
  wien: 'AT', salzburg: 'AT', graz: 'AT', linz: 'AT', zurich: 'CH', 'zürich': 'CH', bern: 'CH', geneve: 'CH', basel: 'CH',
  praha: 'CZ', brno: 'CZ', ostrava: 'CZ', bratislava: 'SK', budapest: 'HU', warszawa: 'PL', krakow: 'PL', 'kraków': 'PL', gdansk: 'PL', poznan: 'PL', wroclaw: 'PL',
  milano: 'IT', torino: 'IT', roma: 'IT', venezia: 'IT', bologna: 'IT', napoli: 'IT', verona: 'IT', madrid: 'ES', barcelona: 'ES', valencia: 'ES', sevilla: 'ES', lisboa: 'PT', porto: 'PT',
  kobenhavn: 'DK', 'københavn': 'DK', aarhus: 'DK', stockholm: 'SE', 'göteborg': 'SE', goteborg: 'SE', malmo: 'SE', 'malmö': 'SE', oslo: 'NO', bergen: 'NO', helsinki: 'FI', tallinn: 'EE', riga: 'LV', vilnius: 'LT',
  istanbul: 'TR', bucuresti: 'RO', sofia: 'BG', athens: 'GR',
  // DEMO (Brasil)
  curitiba: 'PR', 'são paulo': 'SP', chapecó: 'SC', santos: 'SP', 'telêmaco borba': 'PR', joinville: 'SC', paulínia: 'SP', 'ribeirão preto': 'SP',
  ipatinga: 'MG', 'belo horizonte': 'MG', varginha: 'MG', sorocaba: 'SP', goiânia: 'GO', 'três lagoas': 'MS', 'mogi guaçu': 'SP',
  'itaú de minas': 'MG', campinas: 'SP', mairiporã: 'SP', guarulhos: 'SP', 'são bernardo do campo': 'SP', 'rio de janeiro': 'RJ',
  barretos: 'SP', 'presidente prudente': 'SP', niterói: 'RJ',
};

export function countryCode(name: string | null | undefined): string {
  const k = (name ?? '').trim().toLowerCase();
  if (!k) return 'EX';
  if (k.length === 2) return k.toUpperCase();
  return COUNTRY_CODE[k] ?? 'EX';
}

export function cityUf(city: string | null | undefined, cityId?: string | null): string {
  const a = (city ?? '').trim().toLowerCase();
  const b = (cityId ?? '').trim().toLowerCase();
  return CITY_COUNTRY[a] ?? CITY_COUNTRY[b] ?? 'EX';
}

/* ───────────── empresas / endereços ───────────── */

const STREETS = ['Rua da Logística', 'Avenida Industrial', 'Rodovia de Acesso', 'Rua dos Armazéns', 'Avenida do Porto', 'Estrada do Distrito Industrial', 'Rua das Docas', 'Avenida dos Transportes'];
const DISTRICTS = ['Distrito Industrial', 'Zona Portuária', 'Centro Logístico', 'Polo Empresarial', 'Parque Industrial', 'Área de Armazéns'];

export interface Address {
  street: string;
  district: string;
  cep: string;
  phone: string;
}

/** Endereço fictício estável por empresa + cidade. */
export function companyAddress(company: string, city: string): Address {
  const seed = `${company}|${city}`;
  const n = 100 + hashInt('nº:' + seed, 4800);
  const cep = digits('cep:' + seed, 8);
  const ph = digits('fone:' + seed, 10);
  return {
    street: `${STREETS[hashInt('rua:' + seed, STREETS.length)]}, ${n}`,
    district: DISTRICTS[hashInt('bairro:' + seed, DISTRICTS.length)],
    cep: `${cep.slice(0, 5)}-${cep.slice(5)}`,
    phone: `(${ph.slice(0, 2)}) ${ph.slice(2, 6)}-${ph.slice(6)}`,
  };
}

export const emitterName = (company: string) => `${company} Logística`.toUpperCase();
export const receiverName = (company: string) => `${company} Distribuição`.toUpperCase();

const TOLL_OPERATORS = ['Rodovias do Norte S.A.', 'Via Expressa Concessionária', 'Autoestradas Unidas S.A.', 'Corredor Rodoviário S.A.', 'Rota das Serras S.A.'];
const FUEL_STATIONS = ['Posto Estrela da Rodovia Ltda', 'Auto Posto Caminhoneiro Ltda', 'Posto Trevo Diesel Ltda', 'Posto Parada Certa Ltda', 'Rede Frota Combustíveis Ltda'];
const FERRY_OPERATORS = ['Travessia Atlântica (fictícia)', 'Balsas do Canal S.A. (fictícia)', 'Nordic Ferry (fictícia)'];
const TRAIN_OPERATORS = ['Ferrovia Transcanal (fictícia)', 'Rodotrem Expresso (fictício)'];
const AGENCIES = ['Polícia Rodoviária (órgão fictício)', 'Departamento de Trânsito (órgão fictício)', 'Agência de Fiscalização Rodoviária (fictícia)'];
const RECEIVERS = ['J. Almeida', 'M. Ferreira', 'R. Souza', 'A. Lima', 'C. Rocha', 'P. Martins', 'L. Barbosa', 'F. Costa'];
const AGENTS = ['Sd. Ramires', 'Sd. Nogueira', 'Cb. Antunes', 'Ag. Pires', 'Ag. Valente'];

const pickOf = <T,>(list: T[], seed: string) => list[hashInt(seed, list.length)];
export const tollOperator = (seed: string) => pickOf(TOLL_OPERATORS, 'toll:' + seed);
export const fuelStation = (seed: string) => pickOf(FUEL_STATIONS, 'posto:' + seed);
export const ferryOperator = (seed: string) => pickOf(FERRY_OPERATORS, 'ferry:' + seed);
export const trainOperator = (seed: string) => pickOf(TRAIN_OPERATORS, 'train:' + seed);
export const agency = (seed: string) => pickOf(AGENCIES, 'ag:' + seed);
export const receiverPerson = (seed: string) => pickOf(RECEIVERS, 'rec:' + seed);
export const agentName = (seed: string) => pickOf(AGENTS, 'agt:' + seed);
export const dockNumber = (seed: string) => 1 + hashInt('doca:' + seed, 12);

/** Categoria de pedágio pelo nº de eixos do conjunto (tabela simulada). */
export function tollCategory(axles: number): string {
  const n = Math.max(2, Math.min(9, Math.round(axles) || 2));
  const cat = n <= 2 ? 3 : n === 3 ? 4 : n === 4 ? 6 : n === 5 ? 7 : n === 6 ? 8 : 9;
  return `${cat} · ${n} EIXOS`;
}

/* ───────────── multas (fineOffence → CTB, simulado) ───────────── */

export interface Offence {
  art: string;
  desc: string;
  severity: 'LEVE' | 'MÉDIA' | 'GRAVE' | 'GRAVÍSSIMA';
}

export const OFFENCES: Record<string, Offence> = {
  speeding: { art: '218, I', desc: 'Transitar em velocidade superior à máxima permitida', severity: 'MÉDIA' },
  speeding_camera: { art: '218, I', desc: 'Velocidade superior à máxima permitida (radar)', severity: 'MÉDIA' },
  red_signal: { art: '208', desc: 'Avançar o sinal vermelho do semáforo', severity: 'GRAVÍSSIMA' },
  wrong_way: { art: '186, II', desc: 'Transitar pela contramão de direção', severity: 'GRAVÍSSIMA' },
  no_lights: { art: '250, I, b', desc: 'Deixar de manter acesas as luzes do veículo', severity: 'MÉDIA' },
  crash: { art: '169', desc: 'Dirigir sem atenção ou sem os cuidados indispensáveis à segurança', severity: 'LEVE' },
  avoid_sleeping: { art: '67-C', desc: 'Descumprir o tempo de direção e descanso do motorista', severity: 'GRAVE' },
  avoid_weighing: { art: '209', desc: 'Evadir-se para não efetuar a pesagem obrigatória', severity: 'GRAVE' },
  avoid_inspection: { art: '209', desc: 'Deixar de adentrar às áreas de fiscalização', severity: 'GRAVE' },
  illegal_border_crossing: { art: '209', desc: 'Transpor bloqueio de fiscalização', severity: 'GRAVE' },
  illegal_trailer: { art: '231, V', desc: 'Transitar com reboque em desacordo com a autorização', severity: 'GRAVE' },
  hard_shoulder_violation: { art: '193', desc: 'Transitar pelo acostamento', severity: 'GRAVÍSSIMA' },
  damaged_vehicle_usage: { art: '230, XVIII', desc: 'Conduzir veículo em mau estado de conservação', severity: 'GRAVE' },
  generic: { art: '—', desc: 'Infração de trânsito', severity: 'MÉDIA' },
};

export function offence(code: string | null | undefined): Offence & { code: string } {
  const c = (code ?? '').toLowerCase();
  return { ...(OFFENCES[c] ?? OFFENCES.generic), code: c || 'generic' };
}
