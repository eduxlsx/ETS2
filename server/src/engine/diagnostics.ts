/** Verificação do SDK/plugin/conexão (usada pela API, pelo assistente e pelo `npm run check`). */
import type { DiagnosticsReport } from '../../../shared/types.js';
import { findGameExecutablePath, isPluginInstalled, pluginPathFor } from '../sdk/gameProcess.js';
import { loadFfi } from '../sdk/sharedMemory.js';
import { SUPPORTED_REVISIONS } from '../sdk/adapters.js';
import type { TelemetryEngine } from './telemetryEngine.js';
import path from 'node:path';

export async function runDiagnostics(engine: TelemetryEngine): Promise<DiagnosticsReport> {
  const ffi = loadFfi();
  const exe = engine.gameProcess ? await findGameExecutablePath() : null;
  const pluginPath = exe ? pluginPathFor(exe) : null;
  // se a memória do plugin está aberta, o plugin está carregado — mesmo sem achar o caminho do exe
  const pluginInstalled = exe ? isPluginInstalled(exe) : engine.sharedMemoryOpen ? true : null;
  const raw = engine.lastRaw;
  const conn = engine.connectionInfo;
  const rev = conn.pluginRevision;
  const live = engine.currentMode === 'live';

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  const checks: DiagnosticsReport['checks'] = [
    { id: 'node', ok: nodeMajor >= 22, label: 'Node.js ≥ 22.13', detail: `Node ${process.versions.node}` },
    { id: 'ffi', ok: ffi.ok, label: 'Acesso à memória compartilhada (koffi)', detail: ffi.error ?? 'kernel32 carregado' },
    { id: 'game', ok: !!engine.gameProcess, label: 'Jogo em execução', detail: engine.gameProcess ?? 'eurotrucks2.exe não encontrado' },
    {
      id: 'plugin',
      ok: pluginInstalled,
      label: 'Plugin scs-telemetry.dll instalado',
      detail:
        pluginPath ??
        (engine.sharedMemoryOpen ? 'Carregado pelo jogo (memória compartilhada ativa)' : 'Abra o jogo para localizar a pasta de instalação'),
    },
    { id: 'shm', ok: engine.sharedMemoryOpen, label: 'Memória "Local\\SCSTelemetry" aberta', detail: engine.sharedMemoryOpen ? 'OK' : 'Não disponível' },
    {
      id: 'revision',
      ok: rev === null ? null : SUPPORTED_REVISIONS.includes(rev),
      label: 'Revisão do plugin compatível',
      detail: rev === null ? 'Desconhecida' : `Revisão ${rev} (suportadas: ${SUPPORTED_REVISIONS.join(', ')})`,
    },
    {
      id: 'sdk',
      ok: raw ? raw.sdkActive : null,
      label: 'SDK ativo e enviando dados',
      detail: !live ? 'Modo DEMO ativo' : conn.state === 'connected' ? 'Recebendo dados' : conn.message,
    },
  ];

  return {
    platform: `${process.platform} ${process.arch}`,
    nodeVersion: process.versions.node,
    ffiAvailable: ffi.ok,
    ffiError: ffi.error,
    gameProcess: engine.gameProcess,
    gameInstallPath: exe ? path.resolve(path.dirname(exe), '..', '..') : null,
    pluginInstalled,
    pluginPath,
    sharedMemoryOpen: engine.sharedMemoryOpen,
    pluginRevision: rev,
    revisionSupported: rev === null ? null : SUPPORTED_REVISIONS.includes(rev),
    sdkActive: raw ? raw.sdkActive : null,
    gameVersion: raw ? `${raw.versionMajor}.${raw.versionMinor}` : null,
    telemetryVersion: raw ? `${raw.telemetryVersionMajor}.${raw.telemetryVersionMinor}` : null,
    connection: conn,
    checks,
  };
}
