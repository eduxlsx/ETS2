/**
 * Cliente WebSocket + store da telemetria.
 *
 * - Reconecta automaticamente ao servidor (backoff até 5 s).
 * - Notifica a UI no máximo uma vez por quadro de animação.
 * - Mantém séries curtas (1 Hz) para os gráficos em tempo real. Ao trocar a
 *   origem dos dados (live ↔ demo) as séries são descartadas: dados simulados
 *   nunca aparecem misturados aos reais.
 */
import { useSyncExternalStore } from 'react';
import { DEFAULT_SETTINGS, type DataSource, type DispatchMessage, type DutySummary, type ServerMessage, type Settings, type TelemetryFrame, type TripDocSummary } from '../../../shared/types';

export interface SeriesPoint {
  t: number;
  speed: number | null;
  limit: number | null;
  rpm: number | null;
  fuel: number | null;
  consumption: number | null;
  tripConsumption: number | null;
  rearSusp: number | null;
  trailerSusp: number | null;
}

export interface StoreState {
  socket: 'connecting' | 'open' | 'closed';
  frame: TelemetryFrame | null;
  settings: Settings;
  mode: DataSource;
  series: SeriesPoint[];
  seriesSource: DataSource | null;
  serverVersion: string | null;
  /** Incrementa a cada documento criado/atualizado (as telas recarregam a lista). */
  docRev: number;
  lastDoc: TripDocSummary | null;
  /** Mensagens do despachante (mais recente primeiro). */
  dispatch: DispatchMessage[];
  duty: DutySummary | null;
  /** Pedido para abrir o canhoto de entrega (id do documento NF-e). */
  signRequest: number | null;
}

const MAX_POINTS = 900; // 15 min a 1 Hz

let state: StoreState = {
  socket: 'connecting',
  frame: null,
  settings: DEFAULT_SETTINGS,
  mode: 'live',
  series: [],
  seriesSource: null,
  serverVersion: null,
  docRev: 0,
  lastDoc: null,
  dispatch: [],
  duty: null,
  signRequest: null,
};

const listeners = new Set<() => void>();
let scheduled = false;
let lastSampleAt = 0;

function emit() {
  if (scheduled) return;
  scheduled = true;
  const run = () => {
    scheduled = false;
    listeners.forEach((l) => l());
  };
  if (typeof requestAnimationFrame === 'function' && typeof document !== 'undefined' && !document.hidden) requestAnimationFrame(run);
  else setTimeout(run, 50);
}

export function setState(patch: Partial<StoreState>) {
  state = { ...state, ...patch };
  emit();
}

export function getState(): StoreState {
  return state;
}

export function ingestFrame(frame: TelemetryFrame) {
  let series = state.series;
  let seriesSource = state.seriesSource;
  if (seriesSource !== frame.source) {
    if (seriesSource !== null) state = { ...state, dispatch: [], docRev: state.docRev + 1, lastDoc: null, duty: null };
    series = [];
    seriesSource = frame.source;
    lastSampleAt = 0;
  }
  const hasData = frame.connection.state === 'connected' || frame.connection.state === 'demo';
  if (hasData && !frame.game.paused && frame.timestamp - lastSampleAt >= 1000) {
    lastSampleAt = frame.timestamp;
    series = [
      ...series.slice(-(MAX_POINTS - 1)),
      {
        t: frame.timestamp,
        speed: frame.motion.speedKmh,
        limit: frame.motion.speedLimitKmh,
        rpm: frame.engine.rpm,
        fuel: frame.fuel.liters,
        consumption: frame.fuel.avgConsumptionL100,
        tripConsumption: frame.trip.avgConsumptionL100,
        rearSusp: frame.suspension.truckRearAvgDeflection,
        trailerSusp: frame.suspension.trailerAvgDeflection,
      },
    ];
  }
  state = { ...state, frame, mode: frame.source, series, seriesSource };
  emit();
}

let ws: WebSocket | null = null;
let retry = 0;
let started = false;

export function connect(url?: string) {
  if (started) return;
  started = true;
  const target = url ?? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  const open = () => {
    setState({ socket: 'connecting' });
    ws = new WebSocket(target);
    ws.onopen = () => {
      retry = 0;
      setState({ socket: 'open' });
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as ServerMessage;
        if (msg.type === 'frame') ingestFrame(msg.data);
        else if (msg.type === 'settings') setState({ settings: msg.data });
        else if (msg.type === 'hello') setState({ settings: msg.data.settings, mode: msg.data.mode, serverVersion: msg.data.version });
        else if (msg.type === 'doc') setState({ docRev: state.docRev + 1, lastDoc: msg.doc });
        else if (msg.type === 'dispatch') setState({ dispatch: [msg.message, ...state.dispatch].slice(0, 30) });
        else if (msg.type === 'duty') setState({ duty: msg.summary });
      } catch {
        /* mensagem inválida */
      }
    };
    ws.onclose = () => {
      setState({ socket: 'closed' });
      retry = Math.min(retry + 1, 10);
      setTimeout(open, Math.min(5000, 500 * retry));
    };
    ws.onerror = () => ws?.close();
  };
  open();
}

export function sendMode(mode: DataSource) {
  ws?.send(JSON.stringify({ type: 'setMode', mode }));
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: StoreState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

export const useFrame = () => useStore((s) => s.frame);
export const useSettings = () => useStore((s) => s.settings);
