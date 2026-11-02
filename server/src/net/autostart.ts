/** Inicialização automática com o Windows (atalho .cmd na pasta Inicializar do usuário). */
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT } from '../util/paths.js';

function startupFile(): string | null {
  const appData = process.env.APPDATA;
  if (process.platform !== 'win32' || !appData) return null;
  return path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'TruckPulse.cmd');
}

export function isAutoStartEnabled(): boolean {
  const f = startupFile();
  return !!f && existsSync(f);
}

export function setAutoStart(enabled: boolean): boolean {
  const f = startupFile();
  if (!f) return false;
  if (enabled) {
    const script = path.join(PROJECT_ROOT, 'scripts', 'start.ps1');
    writeFileSync(
      f,
      `@echo off\r\nrem Criado pelo TRUCKPULSE (Configurações > Iniciar com o Windows)\r\nstart "" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "${script}" -NoBrowser\r\n`,
      'utf8',
    );
  } else if (existsSync(f)) {
    unlinkSync(f);
  }
  return true;
}
