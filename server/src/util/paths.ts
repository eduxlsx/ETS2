import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Raiz do projeto (funciona tanto em src/ via tsx quanto em dist/ compilado). */
export const PROJECT_ROOT = (() => {
  // sobe até achar a pasta que contém web/ e server/ (funciona em src/ e em dist/)
  let dir = here;
  for (let i = 0; i < 10; i++) {
    if (existsSync(path.join(dir, 'web')) && existsSync(path.join(dir, 'server'))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
})();

export const DATA_DIR = process.env.TRUCKPULSE_DATA ?? path.join(PROJECT_ROOT, 'data');
export const LOG_DIR = path.join(DATA_DIR, 'logs');
export const WEB_DIST = path.join(PROJECT_ROOT, 'web', 'dist');
export const PORT = Number(process.env.TRUCKPULSE_PORT ?? process.env.PORT ?? 5170);
// 0.0.0.0: aceita conexões da rede local (celular/tablet). Use 127.0.0.1 para restringir ao PC.
export const HOST = process.env.TRUCKPULSE_HOST ?? '0.0.0.0';
export const APP_VERSION = '1.0.0';

export function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}
