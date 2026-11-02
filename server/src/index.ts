/**
 * TRUCKPULSE — ponto de entrada do servidor.
 * Inicia banco, configurações, Telemetry Engine e servidor HTTP/WebSocket.
 */
import { Database } from './db/database.js';
import { TelemetryEngine } from './engine/telemetryEngine.js';
import { HistoryService } from './managers/historyService.js';
import { SettingsService } from './managers/settingsService.js';
import { networkInfo } from './net/network.js';
import { createServer } from './net/server.js';
import { createLogger } from './util/logger.js';
import { APP_VERSION, HOST, PORT } from './util/paths.js';

const log = createLogger('main');

const db = new Database();
const settings = new SettingsService(db);
const history = new HistoryService(db);
history.prune();
const engine = new TelemetryEngine({ db, getSettings: () => settings.get() });

let lastRate = settings.get().updateRateHz;
settings.on('change', (s) => {
  if (s.updateRateHz !== lastRate) {
    lastRate = s.updateRateHz;
    engine.restartTimer();
  }
});

if (process.argv.includes('--demo') || process.env.TRUCKPULSE_DEMO === '1') engine.setMode('demo');

const { server } = createServer({ engine, settings, history });
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') log.error(`Porta ${PORT} já está em uso. O TRUCKPULSE já está aberto? Defina TRUCKPULSE_PORT para usar outra.`);
  else log.error('Erro no servidor HTTP', err);
  process.exit(1);
});
server.listen(PORT, HOST, () => {
  log.info(`TRUCKPULSE ${APP_VERSION} em http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  for (const u of networkInfo().urls) log.info(`Acesso pela rede local (celular/tablet): ${u}`);
  engine.start();
});

let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info(`Encerrando (${signal})…`);
  try {
    engine.stop();
  } finally {
    db.close();
    server.close();
    process.exit(0);
  }
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (err) => log.error('Exceção não tratada', err));
process.on('unhandledRejection', (err) => log.error('Promise rejeitada sem tratamento', err));
