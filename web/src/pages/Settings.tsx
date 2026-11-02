import qrcode from 'qrcode-generator';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { docsSettings, type DocsSettings, type Settings } from '../../../shared/types';
import { TRAILER_MODELS } from '../../../shared/vehicles';
import { Badge, Card, Limitation, PageHeader, Row } from '../components/ui';
import { api, type NetworkInfo } from '../lib/api';
import { setState, useStore } from '../lib/telemetryStore';
import { getVehicle, VEHICLES } from '../vehicles/registry';
import { TruckFront } from '../vehicles/TruckFront';
import { TruckSide } from '../vehicles/TruckSide';

/** Linha de formulário: rótulo 220 px | controle (empilha no celular). */
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 border-b border-line py-2.5 last:border-b-0 md:grid-cols-[220px_minmax(0,1fr)] md:items-center md:gap-4">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="grid gap-1">
        {children}
        {hint && <span className="text-[11px] leading-4 text-dim">{hint}</span>}
      </span>
    </label>
  );
}

function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <select className="tp-input w-full max-w-[360px]" value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function NumInput({ value, onChange, min, max, step = 1, allowEmpty = false }: { value: number | null; onChange: (v: number | null) => void; min: number; max: number; step?: number; allowEmpty?: boolean }) {
  return (
    <input
      type="number"
      className="tp-input w-full max-w-[160px]"
      value={value ?? ''}
      min={min}
      max={max}
      step={step}
      placeholder={allowEmpty ? 'automático (jogo)' : undefined}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '' && allowEmpty) return onChange(null);
        const n = Number(raw);
        if (Number.isFinite(n)) onChange(n);
      }}
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 border-b border-line py-2 text-[13px] last:border-b-0 md:min-h-9">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--tp-accent)]" />
      {label}
    </label>
  );
}

const THEMES: { id: Settings['theme']; label: string; note: string; colors: string[] }[] = [
  { id: 'graphite', label: 'Grafite', note: 'padrão', colors: ['#121211', '#1a1a18', '#ff7a1a', '#6fbf5a', '#f2b600', '#f0412e'] },
  { id: 'midnight', label: 'Cabine noturna', note: 'reduz a luminância — bom para jogar à noite', colors: ['#0a0d12', '#0f141b', '#ff9a3c', '#5fb87a', '#e8b23a', '#e5533d'] },
  { id: 'contrast', label: 'Alto contraste', note: 'máxima legibilidade', colors: ['#000000', '#141414', '#ff9500', '#3cff6e', '#ffe000', '#ff4040'] },
];

function ThemePicker({ value, onChange }: { value: Settings['theme']; onChange: (v: Settings['theme']) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tema visual">
      {THEMES.map((t) => {
        const sel = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={sel}
            onClick={() => onChange(t.id)}
            className={`flex min-h-11 flex-col gap-1.5 bg-inset p-2 text-left ${sel ? 'border-2 border-accent' : 'm-px border border-line-strong hover:bg-panel-2'}`}
          >
            <span className="flex h-3">
              {t.colors.map((c, i) => (
                <i key={i} className="flex-1" style={{ background: c }} />
              ))}
            </span>
            <span className="font-cond text-[13px] font-semibold uppercase tracking-[0.06em]">{t.label}</span>
            <span className="text-[11px] leading-4 text-dim">{t.note}</span>
          </button>
        );
      })}
    </div>
  );
}

const PREVIEW_LIGHTS = {
  parking: true, lowBeam: true, highBeam: false, auxFront: 0, auxRoof: 0, blinkerLeftActive: false, blinkerRightActive: false,
  blinkerLeftOn: false, blinkerRightOn: false, hazard: false, brake: false, reverse: false, beacon: false, dashboardBacklight: 0,
} as const;
const PREVIEW_SUSPENSION = {
  truckWheels: [], trailerWheels: [], liftAxle: null, liftAxleIndicator: null, trailerLiftAxle: null,
  truckRearAvgDeflection: null, trailerAvgDeflection: null, truckRearOscillationMm: null, trailerOscillationMm: null,
};

/** Pré-visualização do modelo 2D escolhido (sem dados do jogo). */
function ModelPreview({ modelKey, trailerKey }: { modelKey: string; trailerKey: string | null }) {
  const v = getVehicle(modelKey);
  return (
    <div className="grid grid-cols-[1fr_3fr] items-end gap-3 border border-line bg-inset p-2" data-testid="model-preview">
      <TruckFront vehicle={v} lights={{ ...PREVIEW_LIGHTS }} className="block h-auto w-full" />
      <TruckSide
        vehicle={v}
        lights={{ ...PREVIEW_LIGHTS }}
        suspension={PREVIEW_SUSPENSION}
        trailer={{ attached: !!trailerKey, modelKey: trailerKey ?? 'box' }}
        showSuspension={false}
        className="block h-auto w-full"
      />
      <span className="tp-label col-span-2 text-center">{v.label} — pré-visualização</span>
    </div>
  );
}

/** QR code gerado localmente (qrcode-generator, MIT), desenhado com <rect> para usar as variáveis CSS. */
export function QrCode({ text, size = 160 }: { text: string; size?: number }) {
  const { n, path } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { n: count, path: d };
  }, [text]);
  return (
    <svg viewBox={`-4 -4 ${n + 8} ${n + 8}`} width={size} height={size} shapeRendering="crispEdges" className="block border border-line" role="img" aria-label={`Código QR para ${text}`} data-testid="lan-qr">
      <rect x={-4} y={-4} width={n + 8} height={n + 8} fill="var(--qr-bg)" />
      <path d={path} fill="var(--qr-fg)" />
    </svg>
  );
}

function PhoneAccess() {
  const [net, setNet] = useState<NetworkInfo | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    api.network().then(setNet).catch(() => setError(true));
  }, []);
  const main = net?.urls[0] ?? null;
  const copy = async () => {
    if (!main) return;
    try {
      await navigator.clipboard.writeText(main);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = main;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const firewall = (
    <>
      Se o celular não abrir a página, permita o <b>Node.js</b> (ou o TRUCKPULSE) no <b>Firewall do Windows</b> para <b>redes privadas</b>, ou libere a porta{' '}
      <span className="digits">{net?.port ?? 5170}</span> (TCP). A rede Wi-Fi do PC deve estar marcada como "Privada".
    </>
  );
  return (
    <Card
      title="Acessar pelo celular"
      code="C-03"
      action={net ? <Badge tone={net.lanEnabled && main ? 'ok' : 'warn'}>{net.lanEnabled ? (main ? 'LAN ativa' : 'Sem rede') : 'Somente este PC'}</Badge> : undefined}
      testId="phone-access"
    >
      {error && <p className="text-sm text-crit">Não foi possível consultar /api/network.</p>}
      {!net && !error && <p className="text-sm text-muted">Consultando endereços…</p>}
      {net && net.lanEnabled && main && (
        <div className="grid items-center gap-5 md:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <div className="tp-label">Endereço na rede local</div>
            <div className="my-1.5 flex flex-wrap items-center gap-2.5">
              <span className="digits text-[18px] break-all text-text" data-testid="lan-url">
                {main}
              </span>
              <button className="tp-btn" onClick={copy}>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            {net.urls.length > 1 && (
              <div className="mb-1">
                {net.urls.slice(1).map((u) => (
                  <Row key={u} label="Outro endereço">
                    <span>{u}</span>
                  </Row>
                ))}
              </div>
            )}
            <Limitation label="Como usar">
              Conecte o celular na mesma rede Wi-Fi e aponte a câmera para o código. {firewall}
            </Limitation>
          </div>
          <div className="justify-self-center">
            <QrCode text={main} />
          </div>
        </div>
      )}
      {net && net.lanEnabled && !main && (
        <>
          <p className="font-cond text-sm font-semibold uppercase tracking-[0.06em] text-warn">Nenhuma rede local encontrada</p>
          <p className="mt-1 text-[13px] text-muted">O servidor aceita conexões da rede, mas este PC não tem um endereço IPv4 de rede local ativo (Wi-Fi ou cabo).</p>
        </>
      )}
      {net && !net.lanEnabled && (
        <>
          <p className="font-cond text-sm font-semibold uppercase tracking-[0.06em] text-warn">Acesso pela rede desativado</p>
          <p className="mt-1 text-[13px] text-muted">
            O servidor está escutando só em <span className="tp-code">{net.host}</span>, ou seja, apenas este computador abre o painel.
          </p>
          <Limitation label="Como ativar">
            O padrão do servidor é escutar em todas as interfaces. Remova a variável de ambiente <span className="tp-code">TRUCKPULSE_HOST</span> ou defina <span className="tp-code">TRUCKPULSE_HOST=0.0.0.0</span> (ou a opção
            equivalente do iniciador) — e reinicie o TRUCKPULSE. Depois volte aqui para ver o endereço e o QR code. {firewall}
          </Limitation>
        </>
      )}
    </Card>
  );
}

export function SettingsPage({ onOpenWizard }: { onOpenWizard: () => void }) {
  const current = useStore((s) => s.settings);
  const frame = useStore((s) => s.frame);
  const [draft, setDraft] = useState<Settings>(current);
  const [saved, setSaved] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.settings().then(setDraft).catch(() => {});
  }, []);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setAlert = <K extends keyof Settings['alerts']>(k: K, v: Settings['alerts'][K]) => setDraft((d) => ({ ...d, alerts: { ...d.alerts, [k]: v } }));
  const docs = docsSettings(draft);
  const setDoc = <K extends keyof DocsSettings>(k: K, v: DocsSettings[K]) => setDraft((d) => ({ ...d, docs: { ...docsSettings(d), [k]: v } }));

  const save = async () => {
    try {
      const s = await api.saveSettings(draft);
      setState({ settings: s });
      setDraft(s);
      setSaved({ ok: true, text: 'Configurações salvas.' });
    } catch (e) {
      setSaved({ ok: false, text: `Erro ao salvar: ${e}` });
    }
    setTimeout(() => setSaved(null), 3000);
  };

  const previewTrailer = draft.trailerModel !== 'auto' ? draft.trailerModel : frame?.trailer.attached ? frame.trailer.modelKey : null;

  return (
    <div className="grid grid-cols-1 gap-px bg-line">
      <PageHeader title="Configurações" code="07">
        {saved && <span className={`text-xs ${saved.ok ? 'text-ok' : 'text-crit'}`}>{saved.text}</span>}
        <button onClick={onOpenWizard} className="tp-btn">
          Assistente inicial
        </button>
        <button onClick={save} className="tp-btn solid" data-testid="settings-save">
          Salvar
        </button>
      </PageHeader>

      <Card title="Aparência e atualização" code="C-01">
        <div className="border-b border-line pb-3">
          <div className="mb-2 text-[13px] text-muted">Tema visual</div>
          <ThemePicker value={draft.theme} onChange={(v) => set('theme', v)} />
        </div>
        <Field label="Taxa de atualização (Hz)" hint="Frequência de leitura da memória e envio ao painel (1–60).">
          <NumInput value={draft.updateRateHz} min={1} max={60} onChange={(v) => set('updateRateHz', v ?? 20)} />
        </Field>
        <Field label="Exagero visual da suspensão" hint="Multiplica a deflexão real só no desenho 2D.">
          <NumInput value={draft.suspensionExaggeration} min={1} max={30} onChange={(v) => set('suspensionExaggeration', v ?? 8)} />
        </Field>
        <Toggle checked={draft.autoStart} onChange={(v) => set('autoStart', v)} label="Iniciar o TRUCKPULSE com o Windows" />
      </Card>

      <PhoneAccess />

      <Card title="Unidades" code="C-02">
        <Field label="Velocidade">
          <Select value={draft.speedUnit} onChange={(v) => set('speedUnit', v)} options={[['kmh', 'km/h'], ['mph', 'mph']]} />
        </Field>
        <Field label="Distância">
          <Select value={draft.distanceUnit} onChange={(v) => set('distanceUnit', v)} options={[['km', 'quilômetros'], ['mi', 'milhas']]} />
        </Field>
        <Field label="Combustível">
          <Select value={draft.fuelUnit} onChange={(v) => set('fuelUnit', v)} options={[['l', 'litros'], ['gal', 'galões (US)']]} />
        </Field>
        <Field label="Temperatura">
          <Select value={draft.temperatureUnit} onChange={(v) => set('temperatureUnit', v)} options={[['c', '°C'], ['f', '°F']]} />
        </Field>
        <Field label="Pressão">
          <Select value={draft.pressureUnit} onChange={(v) => set('pressureUnit', v)} options={[['bar', 'bar'], ['psi', 'psi']]} />
        </Field>
      </Card>

      <Card title="Veículo" code="C-04">
        <Field label="Seleção do modelo 2D" hint={frame?.truck.id ? `Detectado no jogo: ${frame.truck.id}` : undefined}>
          <Select value={draft.vehicleMode} onChange={(v) => set('vehicleMode', v)} options={[['auto', 'Automática (pelo jogo)'], ['manual', 'Manual']]} />
        </Field>
        <Field label="Modelo do caminhão (manual)">
          <Select value={draft.manualVehicleModel} onChange={(v) => set('manualVehicleModel', v)} options={VEHICLES.map((v) => [v.key, v.label] as [string, string])} />
        </Field>
        <Field label="Modelo do reboque" hint={frame?.trailer.bodyType ? `body_type detectado: ${frame.trailer.bodyType}` : 'Automático: identificado por body_type, id do reboque e acessório da carga.'}>
          <Select
            value={draft.trailerModel}
            onChange={(v) => set('trailerModel', v)}
            options={[['auto', 'Automático (pelo jogo)'] as [Settings['trailerModel'], string], ...TRAILER_MODELS.map((t) => [t.key, t.label] as [Settings['trailerModel'], string])]}
          />
        </Field>
        <Field label="Capacidade do tanque (L)" hint="Vazio = usar a capacidade informada pelo jogo (truck.fuel.capacity).">
          <NumInput value={draft.fuelCapacityOverrideL} min={10} max={5000} allowEmpty onChange={(v) => set('fuelCapacityOverrideL', v)} />
        </Field>
        <div className="max-w-[760px] pt-3">
          <ModelPreview modelKey={draft.vehicleMode === 'manual' ? draft.manualVehicleModel : frame?.truck.modelKey ?? 'generic'} trailerKey={previewTrailer} />
        </div>
      </Card>

      <Card title="Velocidade" code="C-05">
        <Field label="Velocidade máxima configurada (km/h)" hint="Marca no velocímetro e alerta ao ultrapassar.">
          <NumInput value={draft.configuredMaxSpeedKmh} min={10} max={300} onChange={(v) => set('configuredMaxSpeedKmh', v ?? 90)} />
        </Field>
        <Field label="Tolerância sobre o limite da via (km/h)">
          <NumInput value={draft.speedLimitToleranceKmh} min={0} max={30} onChange={(v) => set('speedLimitToleranceKmh', v ?? 3)} />
        </Field>
        <Toggle checked={draft.alerts.overSpeed} onChange={(v) => setAlert('overSpeed', v)} label="Alertar acima do limite da via" />
      </Card>

      <Card title="Alertas personalizados" code="C-06">
        <Field label="Combustível baixo (%)">
          <NumInput value={draft.alerts.fuelPercent} min={0} max={100} onChange={(v) => setAlert('fuelPercent', v ?? 15)} />
        </Field>
        <Field label="Desgaste (%)">
          <NumInput value={draft.alerts.wearPercent} min={1} max={100} onChange={(v) => setAlert('wearPercent', v ?? 25)} />
        </Field>
        <Field label="Temp. motor (°C)">
          <NumInput value={draft.alerts.waterTempC} min={50} max={200} onChange={(v) => setAlert('waterTempC', v ?? 105)} />
        </Field>
        <Field label="Temp. óleo (°C)">
          <NumInput value={draft.alerts.oilTempC} min={50} max={200} onChange={(v) => setAlert('oilTempC', v ?? 120)} />
        </Field>
      </Card>

      <Card title="Documentos" code="C-08" testId="settings-docs">
        <Field label="Nome do motorista" hint="Aparece no MDF-e, no auto de infração e no disco do tacógrafo.">
          <input className="tp-input w-full max-w-[360px]" maxLength={60} value={docs.driverName} onChange={(e) => setDoc('driverName', e.target.value)} />
        </Field>
        <Field label="Transportadora" hint="Razão social usada no CT-e e no MDF-e (fictícia).">
          <input className="tp-input w-full max-w-[360px]" maxLength={60} value={docs.carrierName} onChange={(e) => setDoc('carrierName', e.target.value)} />
        </Field>
        <Field label="Câmbio simulado (1 € = R$)" hint="O jogo informa valores em €; a conversão é só de apresentação.">
          <NumInput value={docs.fxBrlPerEur} min={0.01} max={1000} step={0.01} onChange={(v) => setDoc('fxBrlPerEur', v ?? 6)} />
        </Field>
        <Field label="Preço do diesel (R$/L)" hint="Usado no cupom de abastecimento (litros vêm do SDK).">
          <NumInput value={docs.dieselPriceBrl} min={0.01} max={100} step={0.01} onChange={(v) => setDoc('dieselPriceBrl', v ?? 6.19)} />
        </Field>
        <Field label="Limite de avaria para o carimbo (%)" hint="Acima disso o canhoto recebe o carimbo vermelho AVARIA REGISTRADA.">
          <NumInput value={docs.damageStampPct} min={0} max={100} step={0.5} onChange={(v) => setDoc('damageStampPct', v ?? 5)} />
        </Field>
        <Field label="Assinatura automática (min reais)" hint="Sem assinatura do motorista, o canhoto é assinado sozinho após este tempo.">
          <NumInput value={docs.autoSignMinutes} min={1} max={120} onChange={(v) => setDoc('autoSignMinutes', v ?? 10)} />
        </Field>
        <Toggle checked={docs.autoSign} onChange={(v) => setDoc('autoSign', v)} label="Assinar automaticamente se eu não assinar" />
        <Toggle checked={docs.stampSound} onChange={(v) => setDoc('stampSound', v)} label="Som do carimbo" />
        <Toggle checked={docs.dispatcherToasts} onChange={(v) => setDoc('dispatcherToasts', v)} label="Avisos do despachante na tela" />
        <Toggle checked={docs.dispatcherVoice} onChange={(v) => setDoc('dispatcherVoice', v)} label="Voz do despachante (síntese de fala do navegador, pt-BR)" />
        <Toggle checked={docs.checklistOnJob} onChange={(v) => setDoc('checklistOnJob', v)} label="Abrir o checklist pré-viagem ao aceitar um frete" />
        <Limitation>Documentos, empresas e números. No modo DEMO nada é salvo.</Limitation>
      </Card>

      <Card title="Trip" code="C-07">
        <Toggle checked={draft.tripAutoResetOnJob} onChange={(v) => set('tripAutoResetOnJob', v)} label="Zerar o trip automaticamente ao aceitar uma entrega" />
        <p className="mt-2 text-[11px] text-dim">O trip é salvo no SQLite e nunca altera o odômetro real do jogo. Para zerar manualmente use a página Viagem.</p>
      </Card>
    </div>
  );
}
