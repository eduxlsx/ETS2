import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import type { ClientMessage, ServerMessage, Settings, TelemetryFrame } from '../../../shared/types.js';
import { VEHICLE_MODELS } from '../../../shared/vehicles.js';
import { runDiagnostics } from '../engine/diagnostics.js';
import type { TelemetryEngine } from '../engine/telemetryEngine.js';
import { HistoryService, toCsv, type ReportKind } from '../managers/historyService.js';
import type { SettingsService } from '../managers/settingsService.js';
import { createLogger } from '../util/logger.js';
import { APP_VERSION, WEB_DIST } from '../util/paths.js';
import { isAutoStartEnabled, setAutoStart } from './autostart.js';
import { isLoopback, networkInfo } from './network.js';
import { sanitizeStrokes } from '../managers/documentManager.js';

const log = createLogger('http');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const REPORT_KINDS: ReportKind[] = ['trips', 'sessions', 'trucks', 'trailers', 'samples', 'jobs', 'documents', 'ledger'];

function json(res: http.ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body, (_k, v) => (typeof v === 'bigint' ? Number(v) : v));
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(data);
}

function readBody(req: http.IncomingMessage, limit = 64 * 1024): Promise<any> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('Corpo muito grande'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse, pathname: string) {
  if (!existsSync(WEB_DIST)) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Painel não compilado. Execute "npm run build" (ou scripts\\install.ps1).');
    return;
  }
  const safe = path.normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  let file = path.join(WEB_DIST, safe);
  if (!file.startsWith(WEB_DIST)) {
    res.writeHead(403).end();
    return;
  }
  if (!existsSync(file) || statSync(file).isDirectory()) file = path.join(WEB_DIST, 'index.html');
  const ext = path.extname(file);
  res.writeHead(200, {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  createReadStream(file).pipe(res);
}

export interface ServerDeps {
  engine: TelemetryEngine;
  settings: SettingsService;
  history: HistoryService;
}

export function createServer({ engine, settings, history }: ServerDeps) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const p = url.pathname;
    const method = req.method ?? 'GET';
    try {
      if (!p.startsWith('/api/')) return serveStatic(req, res, p);

      if (p === '/api/status' && method === 'GET') {
        return json(res, 200, { version: APP_VERSION, mode: engine.currentMode, connection: engine.connectionInfo });
      }
      if (p === '/api/frame' && method === 'GET') return json(res, 200, engine.lastFrame);
      if (p === '/api/network' && method === 'GET') return json(res, 200, networkInfo());
      if (p === '/api/settings' && method === 'GET') return json(res, 200, { ...settings.get(), autoStart: isAutoStartEnabled() });
      if (p === '/api/settings' && method === 'PUT') {
        const body = (await readBody(req)) as Partial<Settings>;
        // início automático mexe no registro do Windows: só pelo próprio PC
        if (typeof body.autoStart === 'boolean' && body.autoStart !== isAutoStartEnabled()) {
          if (!isLoopback(req.socket.remoteAddress)) return json(res, 403, { error: 'Início automático só pode ser alterado no próprio PC' });
          setAutoStart(body.autoStart);
        }
        const updated = settings.update(body);
        return json(res, 200, updated);
      }
      if (p === '/api/mode' && method === 'POST') {
        const body = await readBody(req);
        if (body.mode !== 'live' && body.mode !== 'demo') return json(res, 400, { error: 'mode deve ser live ou demo' });
        engine.setMode(body.mode);
        return json(res, 200, { mode: engine.currentMode });
      }
      if (p === '/api/trip/reset' && method === 'POST') return json(res, 200, engine.resetTrip());

      if (p.startsWith('/api/jobs') || p.startsWith('/api/docs') || p.startsWith('/api/ledger') || p.startsWith('/api/duty') || p.startsWith('/api/checklist')) {
        const docs = engine.documents;
        const store = docs.store;
        const int = (k: string) => {
          const v = url.searchParams.get(k);
          return v === null || v === '' || !Number.isFinite(Number(v)) ? undefined : Number(v);
        };
        if (p === '/api/jobs' && method === 'GET') return json(res, 200, store.listJobs(Math.min(200, int('limit') ?? 50), int('offset') ?? 0));
        if (p === '/api/jobs/current' && method === 'GET') {
          const job = docs.currentJob();
          return json(res, 200, { job, docs: job ? store.listDocs({ jobId: job.id }) : [], paperwork: docs.paperwork(), source: docs.source });
        }
        if (p === '/api/docs' && method === 'GET') {
          return json(res, 200, store.listDocs({ jobId: int('job'), type: url.searchParams.get('type') ?? undefined, from: int('from'), to: int('to'), limit: Math.min(1000, int('limit') ?? 500) }));
        }
        const one = p.match(/^\/api\/docs\/(\d+)$/);
        if (one && method === 'GET') {
          const d = store.getDoc(Number(one[1]));
          return d ? json(res, 200, d) : json(res, 404, { error: 'Documento não encontrado' });
        }
        const sign = p.match(/^\/api\/docs\/(\d+)\/sign$/);
        if (sign && method === 'POST') {
          const body = await readBody(req);
          const strokes = sanitizeStrokes(body.strokes);
          const r = docs.sign(Number(sign[1]), strokes, false);
          return 'error' in r ? json(res, 409, r) : json(res, 200, r);
        }
        if (p === '/api/ledger' && method === 'GET') {
          const job = int('job');
          const rows = store.listLedger(job);
          const income = rows.filter((r) => r.amountEur > 0).reduce((a, r) => a + r.amountEur, 0);
          const expense = rows.filter((r) => r.amountEur < 0).reduce((a, r) => a + r.amountEur, 0);
          return json(res, 200, { entries: rows, totals: { incomeEur: income, expenseEur: expense, resultEur: income + expense }, source: docs.source });
        }
        if (p === '/api/duty' && method === 'GET') {
          const duty = engine.dutyManager;
          const day = int('day') ?? (duty.summary ? Math.floor(duty.summary.gameMin / 1440) : 0);
          return json(res, 200, { day, summary: duty.summary, segments: duty.segments(day), speed: duty.speedSamples(day), source: docs.source });
        }
        const chk = p.match(/^\/api\/checklist\/(\d+)$/);
        if (chk && method === 'POST') {
          const body = await readBody(req);
          const job = docs.saveChecklist(Number(chk[1]), body.items ?? body);
          return job ? json(res, 200, job) : json(res, 404, { error: 'Frete não encontrado' });
        }
      }
      if (p === '/api/vehicles' && method === 'GET') return json(res, 200, VEHICLE_MODELS);
      if (p === '/api/diagnostics' && method === 'GET') return json(res, 200, await runDiagnostics(engine));
      if (p === '/api/history/summary' && method === 'GET') return json(res, 200, history.summary());
      if (p === '/api/history/samples' && method === 'GET') {
        const trip = url.searchParams.get('trip');
        const since = Number(url.searchParams.get('since') ?? Date.now() - 6 * 3600_000);
        return json(res, 200, history.samples(since, trip ? Number(trip) : undefined));
      }
      const hist = p.match(/^\/api\/history\/(\w+)$/);
      if (hist && method === 'GET') {
        const kind = hist[1] as ReportKind;
        if (!REPORT_KINDS.includes(kind)) return json(res, 404, { error: 'Relatório desconhecido' });
        return json(res, 200, history.list(kind, Number(url.searchParams.get('limit') ?? 200)));
      }
      if (p === '/api/export' && method === 'GET') {
        const kind = (url.searchParams.get('kind') ?? 'trips') as ReportKind;
        const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'json';
        if (!REPORT_KINDS.includes(kind)) return json(res, 400, { error: 'kind inválido' });
        const rows = history.list(kind, 100000);
        const name = `truckpulse-${kind}-${new Date().toISOString().slice(0, 10)}.${format}`;
        res.writeHead(200, {
          'Content-Type': format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${name}"`,
        });
        return res.end(format === 'csv' ? '﻿' + toCsv(rows) : JSON.stringify(rows, (_k, v) => (typeof v === 'bigint' ? Number(v) : v), 2));
      }
      return json(res, 404, { error: 'Rota não encontrada' });
    } catch (err) {
      log.error(`Erro em ${method} ${p}`, err);
      return json(res, 500, { error: (err as Error).message });
    }
  });

  const wss = new WebSocketServer({ server, path: '/ws' });
  const send = (ws: WebSocket, msg: ServerMessage | string) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > 1_000_000) return; // cliente lento: descarta o frame
    ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
  };

  wss.on('connection', (ws, req) => {
    log.info(`Cliente WebSocket conectado (${req.socket.remoteAddress})`);
    send(ws, { type: 'hello', data: { version: APP_VERSION, mode: engine.currentMode, settings: settings.get() } });
    if (engine.lastFrame) send(ws, { type: 'frame', data: engine.lastFrame });
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(String(data)) as ClientMessage;
        if (msg.type === 'setMode' && (msg.mode === 'live' || msg.mode === 'demo')) engine.setMode(msg.mode);
      } catch {
        /* ignora mensagens inválidas */
      }
    });
    ws.on('close', () => log.info('Cliente WebSocket desconectado'));
  });

  engine.on('frame', (frame: TelemetryFrame) => {
    if (!wss.clients.size) return;
    const payload = JSON.stringify({ type: 'frame', data: frame } satisfies ServerMessage);
    for (const c of wss.clients) send(c, payload);
  });
  const broadcast = (msg: ServerMessage) => {
    if (!wss.clients.size) return;
    const payload = JSON.stringify(msg);
    for (const c of wss.clients) send(c, payload);
  };
  engine.on('doc', (doc) => broadcast({ type: 'doc', doc }));
  engine.on('dispatch', (message) => broadcast({ type: 'dispatch', message }));
  engine.on('duty', (summary) => broadcast({ type: 'duty', summary }));
  settings.on('change', (s: Settings) => {
    const payload = JSON.stringify({ type: 'settings', data: s } satisfies ServerMessage);
    for (const c of wss.clients) send(c, payload);
  });

  return { server, wss };
}
