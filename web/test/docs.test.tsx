import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildCte, buildDelivery, buildFine, buildFuel, buildMdfe, buildNfe, buildPassage, buildToll, type JobInput } from '../../shared/docs/build';
import type { DocType, TripDoc } from '../../shared/types';
import { DocView, Stepper } from '../src/docs/DocView';
import { SignaturePad } from '../src/docs/SignaturePad';
import { Barcode } from '../src/docs/common';

// jsdom não implementa PointerEvent nem canvas 2D
if (!(globalThis as any).PointerEvent) {
  (globalThis as any).PointerEvent = class extends MouseEvent {
    pointerId: number;
    pointerType: string;
    pressure: number;
    constructor(type: string, init: any = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
      this.pressure = init.pressure ?? 0;
    }
  };
}
HTMLCanvasElement.prototype.getContext = (() => null) as any;

const JOB: JobInput = {
  cargoId: 'dryfruit', cargo: 'Frutas secas', massKg: 18240, units: 24, citySrc: 'Calais', compSrc: 'Tradeaux', cityDst: 'Lyon', compDst: 'Agrominta',
  incomeEur: 3210, plannedKm: 752, deadlineGameMin: 4000, startedGameMin: 2800, truckPlate: 'TP-517-RJ', truckPlateCountry: 'France',
  trailerPlate: 'TRL-4471', truckBrand: 'Scania', truckName: 'R', axles: 5, trailerBodyType: 'curtainside',
};
const CTX = { fx: 6, carrier: 'TRUCKPULSE TRANSPORTES', driver: 'Eduardo B.', dieselPrice: 6.19 };

const nfe = buildNfe(JOB, CTX, 4217);
const cte = buildCte(JOB, CTX, 1388, nfe.key);
const DATA: Record<DocType, Record<string, any>> = {
  nfe,
  cte,
  mdfe: buildMdfe(JOB, CTX, 512, nfe.key, cte.key),
  toll: { ...buildToll(JOB, CTX, 3000, 41.6, 5, 'TP-517-RJ'), amountEur: 41.6 },
  fuel: buildFuel(CTX, 3100, 412.6, 184211, 'TP-517-RJ', 88213),
  ferry: { ...buildPassage('ferry', CTX, 2700, 'Dover', 'Calais', 186, 'TP-517-RJ') },
  train: { ...buildPassage('train', CTX, 2700, 'Folkestone', 'Calais', 300, 'TP-517-RJ') },
  fine: buildFine(JOB, CTX, 3200, 'speeding', 650, 'TP-517-RJ', 'Scania R', 97, 80),
  delivery: buildDelivery(JOB, CTX, 3900, { revenueEur: 3210, cargoDamage: 0.087, distanceKm: 751, deliveryTimeMin: 1100, earnedXp: 400, autopark: false, autoload: false }, { fines: 1, dutyViolated: false, avgConsumption: null }),
};

const doc = (type: DocType, over: Partial<TripDoc> = {}): TripDoc => ({
  id: 1, jobId: 1, type, number: 1, key: null, status: 'transit', gameMin: 2800, createdAt: 0, source: 'live', title: type, data: DATA[type], ...over,
});

describe('documentos simulados', () => {
  it.each(Object.keys(DATA) as DocType[])('%s traz "SEM VALOR FISCAL"', (type) => {
    const { container } = render(<DocView doc={doc(type)} />);
    expect(container.textContent).toMatch(/SEM VALOR FISCAL/);
    expect(container.querySelector(`[data-testid="doc-${type}"]`)).not.toBeNull();
  });

  it('canhoto expõe data-status e mostra carimbos/assinatura depois de assinado', () => {
    const { container, rerender } = render(<DocView doc={doc('nfe', { status: 'awaiting_signature' })} />);
    expect(screen.getByTestId('canhoto')).toHaveAttribute('data-status', 'awaiting_signature');
    expect(container.querySelectorAll('[data-stamp]')).toHaveLength(0);
    rerender(
      <DocView
        doc={doc('nfe', {
          status: 'delivered',
          data: { ...nfe, receivedGameMin: 3900 },
          signature: { strokes: [[[0.1, 0.5, 2], [0.4, 0.6, 2]]], signedAt: 1, auto: false },
          stamps: [
            { kind: 'received', color: 'blue', rot: -8, at: 1, lines: ['AGROMINTA · LYON', 'RECEBIDO', 'QUA 00:12', 'CONFERIDO · DOCA 4'] },
            { kind: 'damage', color: 'red', rot: -5, at: 2, lines: ['AVARIA', 'REGISTRADA 8,7 %'] },
          ],
        })}
      />,
    );
    expect(screen.getByTestId('canhoto')).toHaveAttribute('data-status', 'delivered');
    expect(Array.from(container.querySelectorAll('[data-stamp]')).map((e) => e.getAttribute('data-stamp'))).toEqual(['received', 'damage']);
    expect(container.querySelector('[aria-label="Assinatura do recebedor"]')).not.toBeNull();
  });

  it('código de barras Code 128-C da chave tem barras e zona quieta', () => {
    const { container } = render(<Barcode digits={nfe.key} />);
    expect(container.querySelectorAll('rect').length).toBe(3 * 24 + 4);
  });

  it('stepper marca cancelamento em vermelho', () => {
    render(<Stepper status="cancelled" startedGameMin={2800} plannedKm={752} penaltyEur={1250} />);
    expect(screen.getByTestId('doc-steps')).toHaveAttribute('data-status', 'cancelled');
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
  });

  it('assinatura é serializada normalizada (0..1)', async () => {
    const { createRef } = await import('react');
    const ref = createRef<any>();
    render(<SignaturePad ref={ref} />);
    const canvas = screen.getByTestId('signature-pad') as HTMLCanvasElement;
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON() {} }) as DOMRect;
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 25, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 180, clientY: 75, pointerId: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    const strokes = ref.current.strokes();
    expect(strokes).toHaveLength(1);
    expect(strokes[0][0].slice(0, 2)).toEqual([0.1, 0.5]);
    expect(strokes[0][2].slice(0, 2)).toEqual([0.9, 0.75]);
    for (const [x, y, w] of strokes[0]) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1);
      expect(w).toBeGreaterThan(0);
    }
    ref.current.clear();
    expect(ref.current.isEmpty()).toBe(true);
  });
});
