/**
 * Canvas de assinatura: Pointer Events (touch-action: none), traço em --ink-pen,
 * largura pela velocidade (dedo/mouse) ou pela pressão (caneta), curvas
 * quadráticas entre pontos médios. Traços guardados normalizados (0..1).
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import type { SignatureStroke } from '../../../shared/types';

export interface SignaturePadHandle {
  clear(): void;
  strokes(): SignatureStroke[];
  isEmpty(): boolean;
}

interface P {
  x: number;
  y: number;
  w: number;
  t: number;
}

export const SignaturePad = forwardRef<SignaturePadHandle, { disabled?: boolean; onChange?: (empty: boolean) => void }>(function SignaturePad({ disabled, onChange }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<P[][]>([]);
  const cur = useRef<P[] | null>(null);

  const ctx = () => canvas.current?.getContext('2d') ?? null;
  const pen = () => getComputedStyle(document.documentElement).getPropertyValue('--ink-pen').trim() || '#1b2a6b';

  const seg = (c: CanvasRenderingContext2D, a: P, b: P, W: number, H: number) => {
    c.lineWidth = b.w;
    c.beginPath();
    c.moveTo(a.x * W, a.y * H);
    c.quadraticCurveTo(a.x * W, a.y * H, ((a.x + b.x) / 2) * W, ((a.y + b.y) / 2) * H);
    c.lineTo(b.x * W, b.y * H);
    c.stroke();
  };

  const redraw = useCallback(() => {
    const el = canvas.current;
    const c = ctx();
    if (!el || !c) return;
    const r = el.getBoundingClientRect();
    c.clearRect(0, 0, r.width, r.height);
    for (const s of strokes.current) for (let i = 1; i < s.length; i++) seg(c, s[i - 1], s[i], r.width, r.height);
  }, []);

  const fit = useCallback(() => {
    const el = canvas.current;
    const c = ctx();
    if (!el || !c) return;
    const r = el.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    el.width = Math.max(1, r.width * d);
    el.height = Math.max(1, r.height * d);
    c.setTransform(d, 0, 0, d, 0, 0);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = pen();
    redraw();
  }, [redraw]);

  useEffect(() => {
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    if (ro && canvas.current) ro.observe(canvas.current);
    return () => ro?.disconnect();
  }, [fit]);

  useImperativeHandle(ref, () => ({
    clear() {
      strokes.current = [];
      redraw();
      onChange?.(true);
    },
    strokes() {
      return strokes.current.map((s) => s.map((p) => [Math.round(p.x * 1e4) / 1e4, Math.round(p.y * 1e4) / 1e4, Math.round(p.w * 10) / 10] as [number, number, number]));
    },
    isEmpty() {
      return strokes.current.length === 0;
    },
  }));

  const point = (e: React.PointerEvent, prev?: P): P => {
    const r = canvas.current!.getBoundingClientRect();
    const p: P = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, t: performance.now(), w: 2.4 };
    if (prev) {
      const v = Math.hypot((p.x - prev.x) * r.width, (p.y - prev.y) * r.height) / Math.max(1, p.t - prev.t);
      p.w = e.pointerType === 'pen' && e.pressure ? 1 + e.pressure * 2.6 : Math.max(1.1, 3.2 - v * 1.6);
    }
    return p;
  };

  return (
    <canvas
      ref={canvas}
      aria-label="Área de assinatura — desenhe com o dedo, a caneta ou o mouse"
      data-testid="signature-pad"
      onPointerDown={(e) => {
        if (disabled) return;
        canvas.current!.setPointerCapture?.(e.pointerId);
        cur.current = [point(e)];
        strokes.current.push(cur.current);
      }}
      onPointerMove={(e) => {
        if (!cur.current) return;
        const c = ctx();
        const r = canvas.current!.getBoundingClientRect();
        const p = point(e, cur.current[cur.current.length - 1]);
        if (c) seg(c, cur.current[cur.current.length - 1], p, r.width, r.height);
        cur.current.push(p);
        onChange?.(false);
      }}
      onPointerUp={() => (cur.current = null)}
      onPointerCancel={() => (cur.current = null)}
    />
  );
});
