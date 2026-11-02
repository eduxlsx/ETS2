import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Maximize2, Minimize2, MoreHorizontal, X } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { docsSettings } from '../../shared/types';
import type { TelemetryFrame } from '../../shared/types';
import { Led, Num, type Tone } from './components/ui';
import { AlertsBar } from './components/Widgets';
import { api, type NetworkInfo } from './lib/api';
import { distance } from './lib/format';
import { PAGES, pageNumber, type PageId } from './lib/pages';
import { connect, setState, useStore } from './lib/telemetryStore';
import { Dashboard } from './pages/Dashboard';
import { Diagnostics } from './pages/Diagnostics';
import { History } from './pages/History';
import { Maintenance } from './pages/Maintenance';
import { SettingsPage } from './pages/Settings';
import { SetupWizard } from './pages/SetupWizard';
import { TrailerPage } from './pages/Trailer';
import { TripPage } from './pages/Trip';
import { TruckPage } from './pages/TruckPage';
import { DispatchToasts } from './docs/Dispatch';
import { ChecklistModal } from './docs/Checklist';

// documentos: carregados sob demanda (folhas, fontes e carimbos ficam num pedaço separado)
const Documents = lazy(() => import('./pages/Documents').then((m) => ({ default: m.Documents })));
const DeliverySheet = lazy(() => import('./docs/DeliverySheet').then((m) => ({ default: m.DeliverySheet })));

const APP_VERSION = '1.0.0';

function usePage(): [PageId, (p: PageId) => void] {
  const read = () => {
    const h = location.hash.replace('#/', '').replace('#', '');
    return PAGES.some((p) => p.id === h) ? h : 'painel';
  };
  const [page, setPage] = useState<PageId>(read);
  useEffect(() => {
    const on = () => setPage(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return [page, (p) => (location.hash = `#/${p}`)];
}

const STATE_INFO: Record<TelemetryFrame['connection']['state'], { label: string; short: string; tone: Tone }> = {
  connected: { label: 'Conectado', short: 'Ao vivo', tone: 'ok' },
  demo: { label: 'Simulador', short: 'DEMO', tone: 'warn' },
  'game-not-running': { label: 'Jogo fechado', short: 'Jogo fechado', tone: 'off' },
  'plugin-missing': { label: 'Plugin ausente', short: 'Sem plugin', tone: 'crit' },
  'waiting-sdk': { label: 'Aguardando SDK', short: 'Aguardando', tone: 'warn' },
  incompatible: { label: 'Incompatível', short: 'Incompatível', tone: 'crit' },
  stale: { label: 'Sem atualização', short: 'Parado', tone: 'warn' },
};

const ACTIVITY: Record<string, string> = {
  paused: 'Pausado',
  'engine-off': 'Motor desligado',
  stopped: 'Parado',
  driving: 'Dirigindo',
  offline: '',
};

/** Estado do LINK (servidor + jogo) usado na barra de status e na barra do celular. */
function useLink(): { label: string; short: string; tone: Tone; blink: boolean; title?: string; offline: boolean } {
  const socket = useStore((s) => s.socket);
  const frame = useStore((s) => s.frame);
  if (socket !== 'open') {
    return socket === 'connecting'
      ? { label: 'Conectando…', short: 'Conectando', tone: 'warn', blink: true, offline: false }
      : { label: 'Servidor offline', short: 'Offline', tone: 'crit', blink: true, offline: true };
  }
  if (!frame) return { label: 'Aguardando dados', short: 'Aguardando', tone: 'off', blink: false, offline: false };
  const info = STATE_INFO[frame.connection.state];
  return { ...info, blink: false, title: frame.connection.message, offline: false };
}

const toneColor: Record<Tone, string> = {
  neutral: 'var(--tp-muted)',
  accent: 'var(--tp-accent)',
  ok: 'var(--tp-ok)',
  warn: 'var(--tp-warn)',
  crit: 'var(--tp-crit)',
  off: 'var(--tp-dim)',
};

function StatusField({ label, children, className = '', style, title }: { label: string; children: ReactNode; className?: string; style?: CSSProperties; title?: string }) {
  return (
    <div className={`flex min-w-0 flex-col justify-center gap-px border-r border-line px-3.5 ${className}`} style={style} title={title}>
      <span className="tp-label !text-[9px] !leading-[10px]">{label}</span>
      <b className="font-cond flex items-center gap-1.5 truncate text-[13px] leading-[15px] font-semibold uppercase tracking-[0.06em]">{children}</b>
    </div>
  );
}

function useFullscreen(): [boolean, () => void] {
  const [fs, setFs] = useState(typeof document !== 'undefined' && !!document.fullscreenElement);
  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };
  return [fs, toggle];
}

function FullscreenButton() {
  const [fs, toggle] = useFullscreen();
  return (
    <button onClick={toggle} className="tp-btn !h-8 !w-8 !p-0" title={fs ? 'Sair da tela cheia (F11)' : 'Tela cheia (F11)'} aria-label="Alternar tela cheia">
      {fs ? <Minimize2 size={16} strokeWidth={1.5} /> : <Maximize2 size={16} strokeWidth={1.5} />}
    </button>
  );
}

function useModeToggle(): [boolean, () => void] {
  const mode = useStore((s) => s.mode);
  const toggle = async () => {
    const next = mode === 'demo' ? 'live' : 'demo';
    setState({ mode: next });
    await api.setMode(next).catch(() => setState({ mode }));
  };
  return [mode === 'demo', toggle];
}

function ModeSwitch() {
  const [demo, toggle] = useModeToggle();
  return (
    <button onClick={toggle} className={`tp-btn ${demo ? 'warn' : ''}`} title="Alternar entre dados reais do jogo e o simulador DEMO">
      {demo ? 'Sair do DEMO' : 'Modo DEMO'}
    </button>
  );
}

function GameClock({ className = '' }: { className?: string }) {
  const label = useStore((s) => s.frame?.environment.gameTimeLabel ?? null);
  const day = useStore((s) => s.frame?.environment.weekday ?? null);
  if (!label) return null;
  return (
    <span className={`digits ${className}`} title="Horário do jogo">
      {day ? `${day.toUpperCase()} ` : ''}
      <Num value={label} />
    </span>
  );
}

function PulseMark({ className = 'h-[22px] w-[22px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M3 18h7l3-8 5 14 3-6h8" fill="none" stroke="var(--tp-accent)" strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

function StatusBar() {
  const link = useLink();
  const frame = useStore((s) => s.frame);
  const settings = useStore((s) => s.settings);
  const isDemo = frame?.source === 'demo';
  const act = frame && frame.source === 'live' && frame.connection.state === 'connected' ? ACTIVITY[frame.connection.activity] : isDemo ? ACTIVITY[frame.connection.activity] : '';
  const job = frame?.job;
  return (
    <div className="hidden h-10 shrink-0 items-stretch border-b border-line bg-panel lg:flex">
      <StatusField label="Link" title={link.title}>
        <Led tone={link.tone} blink={link.blink} />
        {link.label}
      </StatusField>
      <StatusField label="Fonte" className={isDemo ? '!bg-warn [&_*]:!text-[#111]' : ''}>
        {isDemo ? 'DEMO' : 'Ao vivo'}
      </StatusField>
      {act && <StatusField label="Atividade">{act}</StatusField>}
      {frame?.environment.gameTimeLabel && (
        <StatusField label="Hora do jogo">
          <GameClock className="text-[13px] font-normal tracking-normal" />
        </StatusField>
      )}
      <DocField />
      {job?.onJob && (job.sourceCity || job.destinationCity) && (
        <StatusField label="Entrega" className="hidden xl:flex">
          <span className="truncate normal-case">
            {job.sourceCity ?? '?'} → {job.destinationCity ?? '?'}
            {job.routeDistanceKm !== null && (
              <span className="digits ml-1 font-normal">
                · <Num value={distance(job.routeDistanceKm, settings, 0).text} /> {distance(0, settings).unit}
              </span>
            )}
          </span>
        </StatusField>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-2 px-3">
        <ModeSwitch />
        <FullscreenButton />
      </div>
    </div>
  );
}

function Rail({ page, setPage, net }: { page: PageId; setPage: (p: PageId) => void; net: NetworkInfo | null }) {
  const main = PAGES.filter((p) => p.group === 'main');
  const system = PAGES.filter((p) => p.group === 'system');
  const docsGroup = PAGES.filter((p) => p.group === 'docs');
  const item = (p: (typeof PAGES)[number]) => {
    const active = page === p.id;
    const n = pageNumber(p.id);
    return (
      <button
        key={p.id}
        onClick={() => setPage(p.id)}
        aria-current={active ? 'page' : undefined}
        title={`${p.label} (Alt+${Number(n)})`}
        className={`font-cond flex h-10 items-center gap-3 border-l-[3px] px-[13px] text-left text-sm font-medium uppercase tracking-[0.06em] max-xl:justify-center ${
          active ? 'border-accent bg-panel-2 text-text' : 'border-transparent text-muted hover:text-text'
        }`}
      >
        <i className={`digits w-4 text-[11px] not-italic max-xl:w-auto max-xl:text-[13px] ${active ? 'text-accent' : 'text-dim'}`}>{n}</i>
        <span className="hidden truncate xl:inline">{p.label}</span>
      </button>
    );
  };
  return (
    <aside className="hidden w-16 shrink-0 flex-col border-r border-line bg-panel lg:flex xl:w-[184px]">
      <div className="font-cond flex h-14 shrink-0 items-center gap-2 border-b border-line px-4 text-base font-semibold tracking-[0.14em] max-xl:justify-center max-xl:px-0" title="TRUCKPULSE">
        <PulseMark />
        <span className="hidden xl:inline">
          TRUCK<b className="font-semibold text-accent">PULSE</b>
        </span>
      </div>
      <nav className="flex flex-col py-1" aria-label="Páginas">
        {main.map(item)}
        <hr className="my-2 border-0 border-t border-line" />
        {system.map(item)}
        {docsGroup.length > 0 && <hr className="my-2 border-0 border-t border-line" />}
        {docsGroup.map(item)}
      </nav>
      <div className="mt-auto border-t border-line px-4 py-3 max-xl:px-1 max-xl:text-center">
        <div className="digits text-[11px] text-dim">
          v<Num value={APP_VERSION} />
        </div>
        {net?.lanEnabled && (
          <div className="tp-label !text-[10px] !text-dim" title={net.urls.join('  ')}>
            LAN ativa<span className="hidden xl:inline"> · {net.port}</span>
          </div>
        )}
      </div>
    </aside>
  );
}

function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex flex-col justify-end bg-black/60 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div
            className="border-t border-line-strong bg-panel pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-11 items-center border-b border-line pl-3">
              <span className="tp-title">{title}</span>
              <button className="ml-auto flex h-11 w-11 items-center justify-center text-muted" onClick={onClose} aria-label="Fechar">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SheetRow({ onClick, children, active, right }: { onClick: () => void; children: ReactNode; active?: boolean; right?: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`font-cond flex h-[52px] w-full items-center gap-3 border-b border-line border-l-2 px-4 text-left text-[15px] font-medium uppercase tracking-[0.06em] last:border-b-0 ${
        active ? 'border-l-accent bg-panel-2 text-text' : 'border-l-transparent text-muted'
      }`}
    >
      {children}
      {right && <span className="ml-auto">{right}</span>}
    </button>
  );
}

function MobileTopBar({ onMore }: { onMore: () => void }) {
  const link = useLink();
  const isDemo = useStore((s) => s.frame?.source === 'demo');
  const hasClock = useStore((s) => !!s.frame?.environment.gameTimeLabel);
  const tone: Tone = isDemo ? 'warn' : link.tone;
  return (
    <div className="flex shrink-0 items-center gap-2.5 border-b border-line bg-panel pt-[env(safe-area-inset-top)] pr-[max(6px,env(safe-area-inset-right))] pl-[max(12px,env(safe-area-inset-left))] lg:hidden">
      <div className="flex h-11 items-center gap-2.5">
        <span className="font-cond flex items-center gap-1 text-[15px] font-semibold tracking-[0.12em]">
          <PulseMark className="h-5 w-5" />
          TP
        </span>
        <span
          className="font-cond inline-flex items-center gap-1.5 rounded-[2px] border px-1.5 text-[11px] leading-[18px] font-semibold uppercase tracking-[0.08em]"
          style={{ borderColor: toneColor[tone], color: toneColor[tone], background: `color-mix(in srgb, ${toneColor[tone]} 12%, transparent)` }}
          title={link.title}
        >
          <Led tone={tone} blink={link.blink} />
          {isDemo ? 'DEMO' : link.short}
        </span>
      </div>
      <GameClock className="ml-auto text-[13px] text-muted" />
      <button onClick={onMore} className={`flex h-11 w-11 items-center justify-center text-muted ${hasClock ? '' : 'ml-auto'}`} aria-label="Mais opções">
        <MoreHorizontal size={20} strokeWidth={2} />
      </button>
    </div>
  );
}

function MobileNav({ page, setPage, onMore }: { page: PageId; setPage: (p: PageId) => void; onMore: () => void }) {
  const bar = PAGES.filter((p) => p.mobile === 'bar');
  const moreActive = PAGES.some((p) => p.mobile === 'more' && p.id === page);
  const cell = (active: boolean) =>
    `font-cond flex min-h-11 flex-col items-center justify-center gap-[3px] text-[11px] font-medium uppercase tracking-[0.06em] tp-mnav-item ${active ? 'is-active text-text' : 'text-dim'}`;
  return (
    <nav className="tp-mnav lg:hidden" aria-label="Páginas">
      {bar.map((p) => (
        <button key={p.id} className={cell(page === p.id)} onClick={() => setPage(p.id)} aria-current={page === p.id ? 'page' : undefined} title={p.label}>
          <p.icon size={20} strokeWidth={1.5} />
          <span>{p.short ?? p.label}</span>
        </button>
      ))}
      <button className={cell(moreActive)} onClick={onMore} aria-haspopup="dialog" title="Mais">
        <MoreHorizontal size={20} strokeWidth={1.5} />
        <span>Mais</span>
      </button>
    </nav>
  );
}

function DemoTape({ show, compact }: { show: boolean; compact?: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          transition={{ duration: 0.16, ease: 'linear' }}
          className="shrink-0 overflow-hidden"
          data-testid="demo-banner"
        >
          <div className="tp-tape h-1" />
          <div className="font-cond border-b border-line bg-panel px-3 text-center text-[12px] leading-[26px] font-semibold uppercase tracking-[0.14em] text-warn max-sm:text-[11px] max-sm:leading-[22px] max-sm:tracking-[0.08em]">
            {compact ? (
              'Modo DEMO — dados simulados'
            ) : (
              <>
                <span className="sm:hidden">Modo DEMO — dados simulados</span>
                <span className="hidden sm:inline">Modo DEMO — dados simulados, não são do jogo e não são salvos no histórico</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Campo DOC da barra de status: situação da NF-e do frete atual. */
function DocField() {
  const pw = useStore((s) => s.frame?.paperwork ?? null);
  if (!pw) return null;
  const sign = pw.awaitingSignature;
  const label = sign ? 'Assinar entrega' : pw.status === 'transit' || pw.status === 'issued' ? 'NF-e em trânsito' : pw.status === 'delivered' ? 'NF-e entregue' : pw.status === 'cancelled' ? 'NF-e cancelada' : 'NF-e arquivada';
  return (
    <StatusField label="Doc" className={sign ? 'cursor-pointer' : ''} title={`NF-e ${pw.nfe ?? '—'} · ${pw.route} (documento simulado)`}>
      <a href="#/documentos" className={`flex items-center gap-1.5 ${sign ? 'tp-blink text-warn' : ''}`}>
        {sign && <Led tone="warn" />}
        {label}
      </a>
    </StatusField>
  );
}

function renderPage(page: PageId, openWizard: () => void, openSign: (id: number) => void): ReactNode {
  switch (page) {
    case 'documentos':
      return (
        <Suspense fallback={<p className="p-3 text-sm text-muted">Abrindo a pasta…</p>}>
          <Documents onSign={openSign} />
        </Suspense>
      );
    case 'caminhao':
      return <TruckPage />;
    case 'viagem':
      return <TripPage />;
    case 'reboque':
      return <TrailerPage />;
    case 'manutencao':
      return <Maintenance />;
    case 'historico':
      return <History />;
    case 'config':
      return <SettingsPage onOpenWizard={openWizard} />;
    case 'diagnostico':
      return <Diagnostics />;
    default:
      return <Dashboard />;
  }
}

export default function App() {
  const [page, setPage] = usePage();
  const settings = useStore((s) => s.settings);
  const frame = useStore((s) => s.frame);
  const socket = useStore((s) => s.socket);
  const isDemo = frame?.source === 'demo';
  const [wizard, setWizard] = useState(false);
  const [more, setMore] = useState(false);
  const [net, setNet] = useState<NetworkInfo | null>(null);
  const [fs, toggleFs] = useFullscreen();
  const [demo, toggleDemo] = useModeToggle();
  const [signDoc, setSignDoc] = useState<number | null>(null);
  const [checklistJob, setChecklistJob] = useState<number | null>(null);
  const dismissed = useRef(new Set<number>());
  const lastDispatch = useStore((s) => s.dispatch[0]);
  const ds = docsSettings(settings);
  const pw = frame?.paperwork ?? null;

  const signRequest = useStore((s) => s.signRequest);
  useEffect(() => {
    if (signRequest !== null) {
      setSignDoc(signRequest);
      setState({ signRequest: null });
    }
  }, [signRequest]);
  // canhoto abre sozinho quando a entrega fica aguardando assinatura
  useEffect(() => {
    if (pw?.awaitingSignature && pw.nfeDocId && !dismissed.current.has(pw.nfeDocId) && signDoc === null) setSignDoc(pw.nfeDocId);
  }, [pw?.awaitingSignature, pw?.nfeDocId]);
  // checklist pré-viagem no início do frete
  useEffect(() => {
    if (lastDispatch?.event === 'job' && ds.checklistOnJob && Date.now() - lastDispatch.at < 15000) setChecklistJob(frame?.paperwork?.jobId ?? -1);
  }, [lastDispatch?.id]);

  useEffect(() => {
    connect();
    api
      .settings()
      .then((s) => {
        setState({ settings: s });
        if (!s.setupCompleted) setWizard(true);
      })
      .catch(() => {});
    api.network().then(setNet).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', settings.theme === 'midnight' ? '#0a0d12' : settings.theme === 'contrast' ? '#000000' : '#121211');
  }, [settings.theme]);

  // Atalhos Alt+1…Alt+N
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= PAGES.length) {
        e.preventDefault();
        setPage(PAGES[n - 1].id);
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  const go = (p: PageId) => {
    setMore(false);
    setPage(p);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="tp-shell bg-bg">
        <Rail page={page} setPage={setPage} net={net} />
        <MobileNav page={page} setPage={go} onMore={() => setMore(true)} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <StatusBar />
          <MobileTopBar onMore={() => setMore(true)} />
          <DemoTape show={isDemo} />
          {frame && frame.alerts.length > 0 && <AlertsBar alerts={frame.alerts} />}
          <main
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain pr-[env(safe-area-inset-right)] ${socket === 'closed' ? 'opacity-50' : ''}`}
            id="conteudo"
          >
            {renderPage(page, () => setWizard(true), (id) => setSignDoc(id))}
          </main>
        </div>

        <Sheet open={more} onClose={() => setMore(false)} title="Mais">
          {PAGES.filter((p) => p.mobile === 'more').map((p) => (
            <SheetRow key={p.id} onClick={() => go(p.id)} active={page === p.id} right={<span className="digits text-[11px] text-dim">{pageNumber(p.id)}</span>}>
              <p.icon size={20} strokeWidth={1.5} />
              {p.label}
            </SheetRow>
          ))}
          <div className="tp-label border-y border-line bg-bg px-4 py-1.5">Sistema</div>
          <SheetRow
            onClick={() => {
              setMore(false);
              toggleDemo();
            }}
            right={demo ? <span className="text-warn">Ativo</span> : undefined}
          >
            {demo ? 'Sair do modo DEMO' : 'Ativar modo DEMO'}
          </SheetRow>
          <SheetRow
            onClick={() => {
              setMore(false);
              toggleFs();
            }}
          >
            {fs ? <Minimize2 size={20} strokeWidth={1.5} /> : <Maximize2 size={20} strokeWidth={1.5} />}
            {fs ? 'Sair da tela cheia' : 'Tela cheia'}
          </SheetRow>
        </Sheet>

        {wizard && <SetupWizard onClose={() => setWizard(false)} />}
        <DispatchToasts />
        {checklistJob !== null && frame && signDoc === null && (
          <ChecklistModal frame={frame} jobId={checklistJob > 0 ? checklistJob : null} onClose={() => setChecklistJob(null)} />
        )}
        {signDoc !== null && (
          <Suspense fallback={null}>
            <DeliverySheet
              docId={signDoc}
              onClose={() => {
                dismissed.current.add(signDoc);
                setSignDoc(null);
              }}
            />
          </Suspense>
        )}
      </div>
    </MotionConfig>
  );
}
