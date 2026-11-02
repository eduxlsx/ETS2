/**
 * Logs técnicos: console + arquivo diário em data/logs.
 * Mensagens repetidas (ex.: "plugin não encontrado" a cada tentativa) são
 * suprimidas por chave para não inundar o log.
 */
import { appendFile } from 'node:fs';
import path from 'node:path';
import { LOG_DIR, ensureDir } from './paths.js';

type Level = 'debug' | 'info' | 'warn' | 'error';
const ORDER: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const minLevel: Level = (process.env.TRUCKPULSE_LOG as Level) ?? 'info';
let fileLogging = process.env.NODE_ENV !== 'test' && !process.env.VITEST;
const lastByKey = new Map<string, string>();

function write(level: Level, scope: string, msg: string, extra?: unknown) {
  if (ORDER[level] < ORDER[minLevel]) return;
  const ts = new Date().toISOString();
  const tail = extra === undefined ? '' : ' ' + (extra instanceof Error ? extra.stack ?? extra.message : JSON.stringify(extra));
  const line = `${ts} [${level.toUpperCase()}] [${scope}] ${msg}${tail}`;
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
  if (fileLogging) {
    try {
      const file = path.join(ensureDir(LOG_DIR), `truckpulse-${ts.slice(0, 10)}.log`);
      appendFile(file, line + '\n', () => {});
    } catch {
      fileLogging = false;
    }
  }
}

export interface Logger {
  debug(msg: string, extra?: unknown): void;
  info(msg: string, extra?: unknown): void;
  warn(msg: string, extra?: unknown): void;
  error(msg: string, extra?: unknown): void;
  /** Loga apenas quando a mensagem para esta chave mudar. */
  once(key: string, level: Level, msg: string): void;
}

export function createLogger(scope: string): Logger {
  return {
    debug: (m, e) => write('debug', scope, m, e),
    info: (m, e) => write('info', scope, m, e),
    warn: (m, e) => write('warn', scope, m, e),
    error: (m, e) => write('error', scope, m, e),
    once(key, level, msg) {
      const k = scope + ':' + key;
      if (lastByKey.get(k) === msg) return;
      lastByKey.set(k, msg);
      write(level, scope, msg);
    },
  };
}
