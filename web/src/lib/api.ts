import type { DataSource, DiagnosticsReport, DutySegment, DutySummary, JobRecord, LedgerEntry, PaperworkSummary, Settings, SignatureStroke, TripDoc, TripDocSummary, TripSnapshot, VehicleModelInfo } from '../../../shared/types';

/** GET /api/network — endereços para abrir o painel de outro dispositivo da rede local. */
export interface NetworkInfo {
  host: string;
  port: number;
  lanEnabled: boolean;
  urls: string[];
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  settings: () => req<Settings>('/api/settings'),
  saveSettings: (patch: Partial<Settings>) => req<Settings>('/api/settings', { method: 'PUT', body: JSON.stringify(patch) }),
  setMode: (mode: DataSource) => req<{ mode: DataSource }>('/api/mode', { method: 'POST', body: JSON.stringify({ mode }) }),
  resetTrip: () => req<TripSnapshot>('/api/trip/reset', { method: 'POST' }),
  vehicles: () => req<VehicleModelInfo[]>('/api/vehicles'),
  diagnostics: () => req<DiagnosticsReport>('/api/diagnostics'),
  summary: () => req<Record<string, number | null>>('/api/history/summary'),
  history: (kind: string, limit = 200) => req<Record<string, any>[]>(`/api/history/${kind}?limit=${limit}`),
  samples: (sinceMs: number) => req<Record<string, any>[]>(`/api/history/samples?since=${sinceMs}`),
  network: () => req<NetworkInfo>('/api/network'),
  jobs: (limit = 50, offset = 0) => req<JobRecord[]>(`/api/jobs?limit=${limit}&offset=${offset}`),
  currentJob: () => req<{ job: JobRecord | null; docs: TripDocSummary[]; paperwork: PaperworkSummary | null; source: DataSource }>('/api/jobs/current'),
  docs: (q: { job?: number; type?: string } = {}) =>
    req<TripDocSummary[]>(`/api/docs?${new URLSearchParams(Object.entries(q).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()}`),
  doc: (id: number) => req<TripDoc>(`/api/docs/${id}`),
  sign: (id: number, strokes: SignatureStroke[]) => req<TripDoc>(`/api/docs/${id}/sign`, { method: 'POST', body: JSON.stringify({ strokes }) }),
  ledger: (job?: number) => req<{ entries: LedgerEntry[]; totals: { incomeEur: number; expenseEur: number; resultEur: number }; source: DataSource }>(`/api/ledger${job ? `?job=${job}` : ''}`),
  duty: (day?: number) => req<{ day: number; summary: DutySummary | null; segments: DutySegment[]; speed: { gameMin: number; kmh: number }[]; source: DataSource }>(`/api/duty${day !== undefined ? `?day=${day}` : ''}`),
  checklist: (jobId: number, items: Record<string, boolean>) => req<JobRecord>(`/api/checklist/${jobId}`, { method: 'POST', body: JSON.stringify({ items }) }),
  exportUrl: (kind: string, format: 'csv' | 'json') => `/api/export?kind=${kind}&format=${format}`,
};
