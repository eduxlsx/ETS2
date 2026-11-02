/**
 * Definição vetorial de um modelo de caminhão.
 *
 * Cada modelo vive em `models/<chave>.ts` e descreve, em METROS (vista lateral)
 * e em uma caixa de 300×400 (vista frontal), as formas que o diferenciam:
 * perfil da cabine, inclinação do para-brisa, grade, formato dos faróis etc.
 * O renderizador compõe chassi, rodas, reboque e a camada de luzes por cima.
 *
 * São representações estilizadas para identificação visual — não são
 * reproduções oficiais dos fabricantes.
 */

export type GrilleStyle = 'vertical-bars' | 'horizontal-bars' | 'diagonal' | 'mesh' | 'wide-bars';
export type HeadlightShape =
  | 'scania-r'
  | 'scania-s'
  | 'volvo-fh3'
  | 'volvo-fh4'
  | 'volvo-fh5'
  | 'actros'
  | 'actros-mp4'
  | 'meteor'
  | 'daf-xf'
  | 'daf-xg'
  | 'generic';

export interface SideProfile {
  /** Comprimento da cabine (m), da frente do para-choque até a parede traseira. */
  cabLength: number;
  /** Altura do teto (m, a partir do solo). */
  roofHeight: number;
  /** Altura do piso da cabine / base do para-brisa (m). */
  windshieldBottom: number;
  /** Recuo horizontal do topo do para-brisa em relação à base (m). */
  windshieldRake: number;
  /** Raio do arredondamento frontal do teto (m). */
  roofFrontRadius: number;
  /** Teto com spoiler/elevação traseira. */
  roofStyle: 'flat' | 'rounded' | 'stepped';
  /** Projeção da parte inferior frontal (m) – nariz. */
  noseBulge: number;
  sunVisor: boolean;
  /** Faixa de vidro lateral (m): [base, topo] e comprimento relativo da janela. */
  sideWindow: { bottom: number; top: number; length: number };
  /** Farol visto de lado: altura do centro (m) e altura (m). */
  headlight: { y: number; h: number };
  /** Linha de caráter/porta extra (path em coordenadas relativas 0..1 da cabine). */
  doorStyle: 'straight' | 'curved';
}

/**
 * Vista frontal na caixa 300×410 (96 px = 1 m, solo em y = 400, eixo em x = 150),
 * igual a docs/design/trucks/front-master.svg.
 */
export interface FrontProfile {
  /** Recuo lateral do teto (px) – mantido por compatibilidade. */
  roofInset: number;
  /** y do teto (px). */
  roofY: number;
  /** Para-brisa: y do topo e da base; `radius` = raio dos cantos. */
  windshield: { top: number; bottom: number; insetTop: number; insetBottom: number; radius: number };
  /**
   * Grade: `inset` = x da borda esquerda no topo; `insetBottom` = x na base (trapézio);
   * `emblem` = aro ou disco central; `logoBand` = faixa com o texto do logotipo no topo da grade.
   */
  grille: {
    top: number;
    bottom: number;
    inset: number;
    insetBottom?: number;
    style: GrilleStyle;
    bars: number;
    radius: number;
    emblem?: 'ring' | 'disc' | 'none';
    logoBand?: 'paint' | 'metal';
  };
  /** Farol: `y` = topo do conjunto; `inset` = x da borda externa (lado esquerdo de quem olha). */
  headlight: { y: number; w: number; h: number; inset: number; shape: HeadlightShape };
  bumper: { top: number; bottom: number };
  logo: { text: string; y: number; size: number };
  sunVisor: boolean;
  /** Assinatura de DRL (path local do farol) que acende com a lanterna (classe `parking`). */
  signature?: string;
  /** Detalhes extras (paths absolutos na caixa 300×410). */
  extras?: string[];
}

export interface VehicleDefinition {
  key: string;
  label: string;
  brand: string;
  /** Cor padrão da pintura (o SDK não informa a cor do caminhão). */
  paint: string;
  /** Distância entre eixos padrão (m), usada quando o SDK não fornece posições das rodas. */
  defaultWheelbase: number;
  side: SideProfile;
  front: FrontProfile;
  notes?: string;
}
