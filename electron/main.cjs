/**
 * TRUCKPULSE Desktop (Electron) — opcional.
 *
 * Sobe o servidor TRUCKPULSE com o Node.js do sistema (o mesmo que roda os
 * testes; evita recompilar módulos nativos para a ABI do Electron) e abre o
 * painel numa janela própria. F11 alterna tela cheia; Ctrl+Shift+M escolhe o
 * monitor seguinte (útil para deixar o painel no segundo monitor).
 */
const { app, BrowserWindow, globalShortcut, screen, Menu, shell } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.TRUCKPULSE_PORT || 5170);
const URL = `http://127.0.0.1:${PORT}`;
let server = null;
let win = null;

function ping() {
  return new Promise((resolve) => {
    const req = http.get(`${URL}/api/status`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServer() {
  if (await ping()) return; // já está rodando (ex.: iniciado por INICIAR.bat)
  const args = ['--disable-warning=ExperimentalWarning', path.join(ROOT, 'server', 'dist', 'server', 'src', 'index.js')];
  if (process.env.TRUCKPULSE_DEMO === '1') args.push('--demo');
  server = spawn(process.env.TRUCKPULSE_NODE || 'node', args, {
    cwd: ROOT,
    env: { ...process.env, TRUCKPULSE_PORT: String(PORT) },
    stdio: 'inherit',
    windowsHide: true,
  });
  server.on('exit', (code) => {
    server = null;
    if (code && win) win.webContents.executeJavaScript(`console.error('Servidor TRUCKPULSE encerrou (código ${code})')`).catch(() => {});
  });
  for (let i = 0; i < 60; i++) {
    if (await ping()) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('O servidor TRUCKPULSE não respondeu. Rode scripts\\install.ps1 e tente de novo.');
}

function moveToNextDisplay() {
  if (!win) return;
  const displays = screen.getAllDisplays();
  const current = screen.getDisplayMatching(win.getBounds());
  const idx = displays.findIndex((d) => d.id === current.id);
  const next = displays[(idx + 1) % displays.length];
  const wasFull = win.isFullScreen();
  if (wasFull) win.setFullScreen(false);
  win.setBounds(next.workArea);
  if (wasFull) setTimeout(() => win.setFullScreen(true), 150);
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 940,
    minWidth: 360,
    minHeight: 480,
    backgroundColor: '#0a0b0d',
    title: 'TRUCKPULSE',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  Menu.setApplicationMenu(null);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  try {
    await ensureServer();
    await win.loadURL(URL);
  } catch (err) {
    await win.loadURL(`data:text/html;charset=utf-8,<body style="background:#0a0b0d;color:#e7eaef;font-family:sans-serif;padding:2rem"><h2>TRUCKPULSE</h2><p>${String(err.message)}</p></body>`);
  }
}

app.whenReady().then(() => {
  createWindow();
  globalShortcut.register('F11', () => win && win.setFullScreen(!win.isFullScreen()));
  globalShortcut.register('CommandOrControl+Shift+M', moveToNextDisplay);
});

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (server) server.kill();
});
