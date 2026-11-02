/** Escreve valores em um buffer usando o layout compilado — simula a memória do plugin. */
import type { CompiledLayout } from '../src/sdk/layout.js';
import { REV12_TOTAL_SIZE, REV12_TRAILER_BASE, REV12_TRAILER_SIZE, rev12Layout, rev12TrailerLayout } from '../src/sdk/layouts/rev12.js';

export class BufferWriter {
  constructor(readonly buf: Buffer, private layout: CompiledLayout, private base = 0) {}

  set(name: string, value: number | boolean | string | bigint, index = 0): this {
    const f = this.layout.fields.get(name);
    if (!f) throw new Error('campo desconhecido ' + name);
    const off = this.base + f.offset + index * f.size;
    switch (f.type) {
      case 'bool': this.buf.writeUInt8(value ? 1 : 0, off); break;
      case 'u32': this.buf.writeUInt32LE(Number(value), off); break;
      case 'i32': this.buf.writeInt32LE(Number(value), off); break;
      case 'f32': this.buf.writeFloatLE(Number(value), off); break;
      case 'f64': this.buf.writeDoubleLE(Number(value), off); break;
      case 'u64': this.buf.writeBigUInt64LE(BigInt(value as any), off); break;
      case 'i64': this.buf.writeBigInt64LE(BigInt(value as any), off); break;
      case 'str': this.buf.fill(0, off, off + f.size); this.buf.write(String(value), off, f.size - 1, 'utf8'); break;
    }
    return this;
  }
}

export function makeRev12Buffer(): { buf: Buffer; w: BufferWriter; trailer: (i: number) => BufferWriter } {
  const buf = Buffer.alloc(REV12_TOTAL_SIZE);
  const w = new BufferWriter(buf, rev12Layout);
  w.set('telemetry_plugin_revision', 12).set('sdkActive', true).set('game', 1).set('maxTrailerCount', 10);
  return { buf, w, trailer: (i) => new BufferWriter(buf, rev12TrailerLayout, REV12_TRAILER_BASE + i * REV12_TRAILER_SIZE) };
}
