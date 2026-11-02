/**
 * Páginas do app (navegação). Para adicionar uma página nova — por exemplo
 * "Documentos" — basta incluir uma entrada aqui e o caso correspondente em
 * `renderPage` (App.tsx): o trilho numerado, os atalhos Alt+N, a barra
 * inferior e a folha "Mais" do celular são gerados a partir desta lista.
 */
import {
  Activity,
  Container,
  FileText,
  Gauge,
  History,
  Route,
  Settings,
  Truck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export interface PageDef {
  id: string;
  label: string;
  /** Rótulo curto para a barra inferior do celular / trilho compacto. */
  short?: string;
  icon: LucideIcon;
  /** 'main' = operação; 'system' = configurações/diagnóstico (separados por um fio no trilho). */
  group: 'main' | 'system' | 'docs';
  /** No celular: na barra inferior ('bar') ou dentro da folha "Mais" ('more'). */
  mobile: 'bar' | 'more';
}

export const PAGES: PageDef[] = [
  { id: 'painel', label: 'Painel', icon: Gauge, group: 'main', mobile: 'bar' },
  { id: 'caminhao', label: 'Caminhão', icon: Truck, group: 'main', mobile: 'bar' },
  { id: 'viagem', label: 'Viagem', icon: Route, group: 'main', mobile: 'bar' },
  { id: 'reboque', label: 'Reboque', icon: Container, group: 'main', mobile: 'bar' },
  { id: 'manutencao', label: 'Manutenção', short: 'Manut.', icon: Wrench, group: 'main', mobile: 'more' },
  { id: 'historico', label: 'Histórico', icon: History, group: 'main', mobile: 'more' },
  { id: 'config', label: 'Configurações', short: 'Config.', icon: Settings, group: 'system', mobile: 'more' },
  { id: 'diagnostico', label: 'Diagnóstico', short: 'Diagn.', icon: Activity, group: 'system', mobile: 'more' },
  // 09 — documentos simulados (DOCUMENTOS-SPEC): bloco próprio no fim do trilho
  { id: 'documentos', label: 'Documentos', short: 'Docs', icon: FileText, group: 'docs', mobile: 'more' },
];

export type PageId = string;

/** Número de ordem exibido no trilho ("01"…). */
export function pageNumber(id: PageId): string {
  const i = PAGES.findIndex((p) => p.id === id);
  return String(i + 1).padStart(2, '0');
}
