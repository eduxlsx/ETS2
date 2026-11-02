import type { TelemetryFrame } from '../../../shared/types';
import { useStore } from '../lib/telemetryStore';

/** true quando o frame traz dados de verdade (jogo conectado ou DEMO). */
export function hasData(f: TelemetryFrame | null): boolean {
  return !!f && (f.connection.state === 'connected' || f.connection.state === 'stale' || f.connection.state === 'demo');
}

export function useFrameState() {
  const frame = useStore((s) => s.frame);
  const settings = useStore((s) => s.settings);
  return { frame, settings, live: hasData(frame) };
}
