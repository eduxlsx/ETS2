/** Assistente de configuração inicial (aparece na primeira execução). */
import { useEffect, useState } from 'react';
import type { DiagnosticsReport, Settings } from '../../../shared/types';
import { api } from '../lib/api';
import { setState, useStore } from '../lib/telemetryStore';
import { VEHICLES } from '../vehicles/registry';
import { CheckMark } from './Diagnostics';

const STEPS = ['Boas-vindas', 'Plugin e jogo', 'Unidades', 'Veículo', 'Pronto'];

function Choice<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <label className="grid gap-1">
      <span className="tp-label">{label}</span>
      <select className="tp-input w-full" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SetupWizard({ onClose }: { onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Settings>(settings);
  const [diag, setDiag] = useState<DiagnosticsReport | null>(null);

  useEffect(() => {
    if (step === 1) {
      const load = () => api.diagnostics().then(setDiag).catch(() => {});
      load();
      const t = setInterval(load, 3000);
      return () => clearInterval(t);
    }
  }, [step]);

  const finish = async () => {
    const s = await api.saveSettings({ ...draft, setupCompleted: true });
    setState({ settings: s });
    onClose();
  };
  const skip = () => {
    // pular também conta como concluído (pode ser reaberto em Configurações)
    api.saveSettings({ setupCompleted: true }).then((s) => setState({ settings: s })).catch(() => {});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 sm:p-4" role="dialog" aria-modal="true" aria-label="Assistente de configuração">
      <div className="flex h-full w-full max-w-[720px] flex-col border border-line-strong bg-panel sm:h-auto sm:max-h-[90dvh]">
        <div className="flex h-10 shrink-0 items-center border-b border-line px-3 pt-[env(safe-area-inset-top)] sm:pt-0">
          <span className="tp-title">Assistente inicial</span>
          <span className="digits ml-3 text-[11px] text-dim sm:hidden">
            PASSO {step + 1}/{STEPS.length}
          </span>
          <button className="tp-btn text ml-auto" onClick={skip}>
            Pular
          </button>
        </div>
        <div className="flex min-h-0 flex-1">
          <ol className="hidden w-[200px] shrink-0 border-r border-line py-2 sm:block">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={`font-cond flex h-9 items-center gap-2.5 border-l-[3px] px-3 text-sm font-medium uppercase tracking-[0.06em] ${
                  i === step ? 'border-accent bg-panel-2 text-text' : 'border-transparent ' + (i < step ? 'text-muted' : 'text-dim')
                }`}
              >
                <span className={`digits w-5 text-[11px] ${i === step ? 'text-accent' : ''}`}>{i < step ? '✓' : String(i + 1).padStart(2, '0')}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="min-w-0 flex-1 overflow-y-auto p-4">
            <h2 className="tp-page-title mb-3">{STEPS[step]}</h2>

            {step === 0 && (
              <div className="space-y-2 text-sm text-muted">
                <p>
                  O TRUCKPULSE lê a telemetria real do Euro Truck Simulator 2 através do plugin <b className="text-text">scs-sdk-plugin</b> (memória compartilhada do SCS Telemetry SDK).
                </p>
                <p>
                  Valores que o jogo não fornece aparecem como <b className="text-text">N/D</b> — nada é inventado. Para testar sem o jogo, use o <b className="text-warn">Modo DEMO</b>, sempre identificado na tela.
                </p>
              </div>
            )}

            {step === 1 && (
              <div>
                {!diag && <p className="text-sm text-muted">Verificando…</p>}
                <ul>
                  {diag?.checks.map((c) => (
                    <li key={c.id} className="grid grid-cols-[64px_1fr] gap-2 border-b border-line py-2 last:border-b-0">
                      <span className="leading-5">
                        <CheckMark ok={c.ok} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] leading-5">{c.label}</div>
                        <div className="break-all text-[11px] text-muted">{c.detail}</div>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="pt-2 text-[11px] text-dim">
                  Sem o plugin? Rode <span className="tp-code">scripts\install-plugin.ps1</span> e reinicie o jogo. Esta lista atualiza a cada 3 s.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-3">
                <Choice label="Velocidade" value={draft.speedUnit} onChange={(v) => setDraft({ ...draft, speedUnit: v })} options={[['kmh', 'km/h'], ['mph', 'mph']]} />
                <Choice label="Distância" value={draft.distanceUnit} onChange={(v) => setDraft({ ...draft, distanceUnit: v })} options={[['km', 'km'], ['mi', 'milhas']]} />
                <Choice label="Combustível" value={draft.fuelUnit} onChange={(v) => setDraft({ ...draft, fuelUnit: v })} options={[['l', 'litros'], ['gal', 'galões']]} />
                <Choice label="Pressão" value={draft.pressureUnit} onChange={(v) => setDraft({ ...draft, pressureUnit: v })} options={[['bar', 'bar'], ['psi', 'psi']]} />
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-1 text-sm">
                <label className="flex min-h-11 items-center gap-2.5">
                  <input type="radio" className="accent-[var(--tp-accent)]" checked={draft.vehicleMode === 'auto'} onChange={() => setDraft({ ...draft, vehicleMode: 'auto' })} /> Identificar o caminhão automaticamente
                </label>
                <label className="flex min-h-11 items-center gap-2.5">
                  <input type="radio" className="accent-[var(--tp-accent)]" checked={draft.vehicleMode === 'manual'} onChange={() => setDraft({ ...draft, vehicleMode: 'manual' })} /> Escolher manualmente
                </label>
                {draft.vehicleMode === 'manual' && (
                  <select className="tp-input" value={draft.manualVehicleModel} onChange={(e) => setDraft({ ...draft, manualVehicleModel: e.target.value })}>
                    {VEHICLES.map((v) => (
                      <option key={v.key} value={v.key}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                )}
                <label className="flex min-h-11 items-center gap-2.5">
                  <input type="checkbox" className="accent-[var(--tp-accent)]" checked={draft.autoStart} onChange={(e) => setDraft({ ...draft, autoStart: e.target.checked })} /> Iniciar o TRUCKPULSE com o Windows
                </label>
              </div>
            )}

            {step === 4 && (
              <p className="text-sm text-muted">
                Tudo pronto. Abra o ETS2 e dirija — o painel atualiza em tempo real. Dica: use o botão de tela cheia para deixá-lo em um segundo monitor, ou abra
                pelo celular (Configurações › Acessar pelo celular).
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 justify-between border-t border-line px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
          <button className="tp-btn text" onClick={() => setStep(step - 1)} disabled={step === 0}>
            Voltar
          </button>
          {step < STEPS.length - 1 ? (
            <button className="tp-btn solid" onClick={() => setStep(step + 1)}>
              Avançar
            </button>
          ) : (
            <button className="tp-btn solid" onClick={finish}>
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
