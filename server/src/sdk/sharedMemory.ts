/**
 * Acesso à memória compartilhada (Memory Mapped File) do Windows via FFI.
 *
 * Usamos o koffi (FFI com binários pré-compilados, sem node-gyp) para chamar
 * kernel32: OpenFileMappingW → MapViewOfFile → cópia do bloco para um Buffer.
 * Cada leitura gera um snapshot independente, então o parser nunca lê um
 * valor no meio de uma escrita do plugin por mais de uma cópia.
 */
import { createRequire } from 'node:module';
import { createLogger } from '../util/logger.js';

const log = createLogger('shm');
const FILE_MAP_READ = 0x0004;

export interface SharedMemorySource {
  readonly isOpen: boolean;
  open(name: string, size: number): boolean;
  read(size: number): Buffer | null;
  close(): void;
}

interface Kernel32 {
  koffi: any;
  OpenFileMappingW: (access: number, inherit: number, name: string) => unknown;
  MapViewOfFile: (h: unknown, access: number, hi: number, lo: number, size: number) => unknown;
  UnmapViewOfFile: (p: unknown) => number;
  CloseHandle: (h: unknown) => number;
  GetLastError: () => number;
  OpenProcess: (access: number, inherit: number, pid: number) => unknown;
  QueryFullProcessImageNameW: (h: unknown, flags: number, buf: Buffer, size: number[]) => number;
}

let kernel32: Kernel32 | null = null;
let ffiError: string | null = null;

export function loadFfi(): { ok: boolean; error: string | null } {
  if (kernel32) return { ok: true, error: null };
  if (ffiError) return { ok: false, error: ffiError };
  if (process.platform !== 'win32') {
    ffiError = 'Memória compartilhada do SCS SDK só existe no Windows.';
    return { ok: false, error: ffiError };
  }
  try {
    const require = createRequire(import.meta.url);
    const koffi = require('koffi');
    const lib = koffi.load('kernel32.dll');
    kernel32 = {
      koffi,
      OpenFileMappingW: lib.func('__stdcall', 'OpenFileMappingW', 'void *', ['uint32_t', 'int', 'str16']),
      MapViewOfFile: lib.func('__stdcall', 'MapViewOfFile', 'void *', ['void *', 'uint32_t', 'uint32_t', 'uint32_t', 'size_t']),
      UnmapViewOfFile: lib.func('__stdcall', 'UnmapViewOfFile', 'int', ['void *']),
      CloseHandle: lib.func('__stdcall', 'CloseHandle', 'int', ['void *']),
      GetLastError: lib.func('__stdcall', 'GetLastError', 'uint32_t', []),
      OpenProcess: lib.func('__stdcall', 'OpenProcess', 'void *', ['uint32_t', 'int', 'uint32_t']),
      QueryFullProcessImageNameW: lib.func('__stdcall', 'QueryFullProcessImageNameW', 'int', ['void *', 'uint32_t', 'void *', '_Inout_ uint32_t *']),
    };
    return { ok: true, error: null };
  } catch (err) {
    ffiError = `Falha ao carregar koffi/kernel32: ${(err as Error).message}`;
    log.error(ffiError);
    return { ok: false, error: ffiError };
  }
}

/** Caminho completo do executável de um processo (para achar a pasta plugins do jogo). */
export function processImagePath(pid: number): string | null {
  if (!loadFfi().ok || !kernel32) return null;
  const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
  const h = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
  if (!h) return null;
  try {
    const buf = Buffer.alloc(2048);
    const size = [1024];
    if (!kernel32.QueryFullProcessImageNameW(h, 0, buf, size)) return null;
    return buf.toString('utf16le', 0, size[0] * 2);
  } finally {
    kernel32.CloseHandle(h);
  }
}

export class WindowsSharedMemory implements SharedMemorySource {
  private handle: unknown = null;
  private view: unknown = null;
  private mappedSize = 0;

  get isOpen(): boolean {
    return this.view !== null;
  }

  open(name: string, size: number): boolean {
    if (this.isOpen) return true;
    if (!loadFfi().ok || !kernel32) return false;
    const k = kernel32;
    const handle = k.OpenFileMappingW(FILE_MAP_READ, 0, name);
    if (!handle) return false; // ERROR_FILE_NOT_FOUND: plugin não carregado
    const view = k.MapViewOfFile(handle, FILE_MAP_READ, 0, 0, 0);
    if (!view) {
      log.warn(`MapViewOfFile falhou (erro ${k.GetLastError()})`);
      k.CloseHandle(handle);
      return false;
    }
    this.handle = handle;
    this.view = view;
    this.mappedSize = size;
    log.info(`Memória compartilhada ${name} aberta`);
    return true;
  }

  read(size: number): Buffer | null {
    if (!this.view || !kernel32) return null;
    const n = Math.min(size, this.mappedSize || size);
    try {
      const { koffi } = kernel32;
      if (typeof koffi.view === 'function') {
        const ab: ArrayBuffer = koffi.view(this.view, n);
        return Buffer.from(new Uint8Array(ab)); // cópia → snapshot
      }
      const arr = koffi.decode(this.view, koffi.array('uint8_t', n, 'Typed')) as Uint8Array;
      return Buffer.from(arr);
    } catch (err) {
      log.error('Falha ao ler a memória compartilhada', err);
      this.close();
      return null;
    }
  }

  close(): void {
    if (!kernel32) return;
    if (this.view) kernel32.UnmapViewOfFile(this.view);
    if (this.handle) kernel32.CloseHandle(this.handle);
    if (this.view) log.info('Memória compartilhada fechada');
    this.view = null;
    this.handle = null;
  }
}
