/**
 * Detecção do processo do jogo (ETS2 / ATS) via tasklist, em segundo plano.
 * Usado para: saber se o jogo está aberto, diferenciar "plugin ausente" de
 * "jogo fechado" e liberar o handle da memória quando o jogo fecha (senão o
 * nosso handle manteria o mapa vivo com dados antigos).
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { processImagePath } from './sharedMemory.js';

export const GAME_PROCESSES = ['eurotrucks2.exe', 'amtrucks.exe'];

export function parseTasklist(output: string): string | null {
  return parseTasklistEntry(output)?.name ?? null;
}

export function parseTasklistEntry(output: string): { name: string; pid: number } | null {
  for (const line of output.split(/\r?\n/)) {
    const m = line.match(/^"([^"]+)","(\d+)"/);
    if (m && GAME_PROCESSES.includes(m[1].toLowerCase())) return { name: m[1].toLowerCase(), pid: Number(m[2]) };
  }
  return null;
}

function runTasklist(): Promise<string | null> {
  // caminho absoluto: o PATH pode não incluir System32 (ex.: atalhos/serviços)
  const tasklist = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tasklist.exe');
  return new Promise((resolve) => {
    execFile(tasklist, ['/FO', 'CSV', '/NH'], { windowsHide: true, timeout: 5000 }, (err, stdout) => resolve(err ? null : stdout));
  });
}

export function findGameProcess(): Promise<string | null> {
  if (process.platform !== 'win32') return Promise.resolve(null);
  return runTasklist().then((out) => (out ? parseTasklist(out) : null));
}

/** Caminho completo do executável do jogo (para localizar a pasta plugins). */
export async function findGameExecutablePath(): Promise<string | null> {
  if (process.platform !== 'win32') return null;
  const out = await runTasklist();
  const entry = out ? parseTasklistEntry(out) : null;
  return entry ? processImagePath(entry.pid) : null;
}

export function pluginPathFor(exePath: string): string {
  return path.join(path.dirname(exePath), 'plugins', 'scs-telemetry.dll');
}

export function isPluginInstalled(exePath: string): boolean {
  return existsSync(pluginPathFor(exePath));
}

export class GameProcessWatcher {
  private timer: NodeJS.Timeout | null = null;
  current: string | null = null;
  checkedOnce = false;

  constructor(private readonly intervalMs = 2000, private readonly finder = findGameProcess) {}

  start(onChange?: (name: string | null) => void): void {
    const tick = async () => {
      const found = await this.finder();
      const changed = found !== this.current || !this.checkedOnce;
      this.current = found;
      this.checkedOnce = true;
      if (changed) onChange?.(found);
    };
    void tick();
    this.timer = setInterval(tick, this.intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
