import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../shared/types';
import { Gauge } from '../src/components/Gauge';
import { LightingPanel, Telltale } from '../src/components/Telltales';
import { Meter, Stat } from '../src/components/ui';
import { SpeedLimitSign } from '../src/components/Widgets';
import { WiperIndicator } from '../src/components/WiperIndicator';
import { TimeChart } from '../src/components/Charts';
import { lightsAll } from './fixtures';

const LIGHT_ICONS = ['blinkerLeft', 'hazard', 'blinkerRight', 'parking', 'lowBeam', 'highBeam', 'auxFront', 'auxRoof', 'brake', 'reverse', 'beacon', 'dashboard'];

describe('Painel de iluminação', () => {
  it('renderiza todos os 12 indicadores', () => {
    render(<LightingPanel lights={lightsAll(false)} />);
    for (const icon of LIGHT_ICONS) expect(screen.getByTestId(`telltale-${icon}`)).toBeInTheDocument();
  });

  it.each([true, false])('todos os indicadores refletem o estado %s', (on) => {
    render(<LightingPanel lights={lightsAll(on)} />);
    for (const icon of LIGHT_ICONS) expect(screen.getByTestId(`telltale-${icon}`)).toHaveAttribute('data-state', on ? 'on' : 'off');
  });

  it('cada luz muda isoladamente', () => {
    const keys = ['parking', 'lowBeam', 'highBeam', 'brake', 'reverse', 'beacon'] as const;
    for (const k of keys) {
      const { unmount } = render(<LightingPanel lights={{ ...lightsAll(false), [k]: true }} />);
      const icon = k === 'lowBeam' ? 'lowBeam' : k === 'highBeam' ? 'highBeam' : k;
      expect(screen.getByTestId(`telltale-${icon}`)).toHaveAttribute('data-state', 'on');
      expect(screen.getByTestId('telltale-blinkerLeft')).toHaveAttribute('data-state', 'off');
      unmount();
    }
  });

  it('pisca segue a lâmpada real (blinkerOn), não só a alavanca', () => {
    render(<LightingPanel lights={{ ...lightsAll(false), blinkerLeftActive: true, blinkerLeftOn: false }} />);
    expect(screen.getByTestId('telltale-blinkerLeft')).toHaveAttribute('data-state', 'off');
  });

  it('auxiliares mostram nível reduzido/máximo', () => {
    render(<LightingPanel lights={{ ...lightsAll(false), auxFront: 1, auxRoof: 2 }} />);
    expect(screen.getByTestId('telltale-auxFront')).toHaveTextContent('reduzido');
    expect(screen.getByTestId('telltale-auxRoof')).toHaveTextContent('máximo');
  });

  it('valor ausente → N/D', () => {
    render(<Telltale icon="beacon" label="Giroflex" on={null} />);
    expect(screen.getByTestId('telltale-beacon')).toHaveAttribute('data-state', 'nd');
  });
});

describe('Limpador', () => {
  it.each([
    [true, 'on', 'Ligado'],
    [false, 'off', 'Desligado'],
    [null, 'nd', 'N/D'],
  ] as const)('estado %s', (on, state, label) => {
    render(<WiperIndicator wipers={{ on, stage: null }} />);
    expect(screen.getByTestId('wiper-indicator')).toHaveAttribute('data-state', state);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(/Estágio: N\/D/)).toBeInTheDocument();
  });
});

describe('Indicadores numéricos', () => {
  it('Stat mostra N/D quando o valor não existe', () => {
    render(<Stat label="Pressão" value={null} unit="bar" />);
    expect(screen.getByText('N/D')).toBeInTheDocument();
    expect(screen.queryByText('bar')).toBeNull();
  });

  it('Meter sem valor não desenha barra', () => {
    const { container } = render(<Meter value={null} />);
    expect(container.querySelectorAll('.bg-accent')).toHaveLength(0);
  });

  it('Gauge desenha marcação do limite', () => {
    render(<Gauge value={50} max={140} marker={80} center={<span>50</span>} testId="g" />);
    expect(screen.getByTestId('gauge-marker')).toBeInTheDocument();
  });

  it('Gauge sem limite não desenha marcação', () => {
    render(<Gauge value={50} max={140} marker={null} center={<span>50</span>} />);
    expect(screen.queryByTestId('gauge-marker')).toBeNull();
  });

  it('placa de limite: valor e N/D', () => {
    const { rerender } = render(<SpeedLimitSign kmh={80} settings={DEFAULT_SETTINGS} />);
    expect(screen.getByTestId('speed-limit-sign')).toHaveTextContent('80');
    rerender(<SpeedLimitSign kmh={null} settings={DEFAULT_SETTINGS} />);
    expect(screen.getByTestId('speed-limit-sign')).toHaveTextContent('N/D');
    rerender(<SpeedLimitSign kmh={80} settings={{ ...DEFAULT_SETTINGS, speedUnit: 'mph' }} />);
    expect(screen.getByTestId('speed-limit-sign')).toHaveTextContent('50');
  });
});

describe('Gráficos', () => {
  it('estado vazio explica a ausência de dados', () => {
    render(<TimeChart data={[]} series={[{ key: 'v', name: 'v', color: 'red' }]} testId="c" />);
    expect(screen.getByTestId('c')).toHaveTextContent(/Sem dados/);
  });

  it('com dados renderiza o contêiner do gráfico', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ t: i * 1000, v: i }));
    render(<TimeChart data={data} series={[{ key: 'v', name: 'v', color: 'red', area: true }]} testId="c" />);
    expect(screen.getByTestId('c')).not.toHaveTextContent(/Sem dados/);
    expect(screen.getByTestId('c').querySelector('.recharts-responsive-container')).not.toBeNull();
  });
});

describe('primitivas novas', () => {
  it('Num cola separadores entre dígitos (.sep)', async () => {
    const { Num } = await import('../src/components/ui');
    const { container } = render(<span><Num value="31,4" /> <Num value="14:32" /> <Num value="abc.def" /></span>);
    expect(container.querySelectorAll('.sep')).toHaveLength(2);
    expect(container).toHaveTextContent('31,4 14:32 abc.def');
  });

  it('Meter segmentado acende a fração certa e mantém a classe de tom', () => {
    const { container } = render(<Meter value={50} max={100} segments={20} tone="accent" />);
    expect(container.querySelectorAll('.bg-accent')).toHaveLength(10);
  });

  it('Odômetro mecânico mostra dígitos com o decimal invertido', async () => {
    const { Odometer } = await import('../src/components/ui');
    const { container } = render(<Odometer value={317.46} intDigits={4} decimals={1} unit="km" />);
    expect(container).toHaveTextContent('03174km');
  });

  it('QR code local é gerado em SVG', async () => {
    const { QrCode } = await import('../src/pages/Settings');
    render(<QrCode text="http://192.168.0.14:5170" />);
    const svg = screen.getByTestId('lan-qr');
    expect(svg.querySelector('path')?.getAttribute('d')?.length).toBeGreaterThan(100);
  });
});
