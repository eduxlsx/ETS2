/**
 * Verificação de ambiente pela linha de comando:
 *   npm run check            → diagnóstico completo + leitura de amostra
 *   npm run check -- --json  → saída JSON
 */
import { TelemetryEngine } from '../engine/telemetryEngine.js';
import { runDiagnostics } from '../engine/diagnostics.js';
import { DEFAULT_SETTINGS } from '../../../shared/types.js';

const engine = new TelemetryEngine({ db: null, getSettings: () => DEFAULT_SETTINGS });
engine.start();
await new Promise((r) => setTimeout(r, 2500)); // aguarda detecção do processo e algumas leituras
const frame = engine.tick();
const report = await runDiagnostics(engine);
engine.stop();

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ report, frame }, (_k, v) => (typeof v === 'bigint' ? Number(v) : v), 2));
} else {
  const icon = (ok: boolean | null) => (ok === true ? '[ OK ]' : ok === false ? '[FALHA]' : '[ -- ]');
  console.log('\nTRUCKPULSE — verificação do SDK\n');
  for (const c of report.checks) console.log(`${icon(c.ok)} ${c.label}\n        ${c.detail}`);
  console.log(`\nEstado da conexão: ${report.connection.state} — ${report.connection.message}`);
  if (frame.connection.state === 'connected') {
    console.log('\nAmostra de dados reais:');
    console.log(`  API de telemetria do jogo ${report.gameVersion} / SDK ${report.telemetryVersion} / plugin rev ${report.pluginRevision}`);
    console.log(`  Caminhão: ${frame.truck.brand ?? 'N/D'} ${frame.truck.name ?? ''} (${frame.truck.id ?? 'N/D'}) → modelo 2D ${frame.truck.modelKey}`);
    console.log(`  Velocidade ${frame.motion.speedKmh?.toFixed(1) ?? 'N/D'} km/h, RPM ${frame.engine.rpm?.toFixed(0) ?? 'N/D'}, marcha ${frame.engine.gearLabel}`);
    console.log(`  Combustível ${frame.fuel.liters?.toFixed(1) ?? 'N/D'} / ${frame.fuel.capacityLiters ?? 'N/D'} L, odômetro ${frame.motion.odometerKm?.toFixed(1) ?? 'N/D'} km`);
    console.log(`  Pausado: ${frame.game.paused}, motor ligado: ${frame.engine.engineOn}, horário ${frame.environment.weekday ?? ''} ${frame.environment.gameTimeLabel ?? 'N/D'}`);
  }
  console.log('');
}
process.exit(0);
