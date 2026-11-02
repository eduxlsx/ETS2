/**
 * Mini-DSL para descrever o layout binário da memória compartilhada do
 * scs-sdk-plugin. Cada "zona" do struct C começa em um offset fixo e os
 * campos dentro dela são empacotados em sequência (o header original agrupa
 * campos do mesmo tipo justamente para não haver padding).
 *
 * compileLayout() calcula os offsets e valida que nenhuma zona extrapola seu
 * limite — se o header mudar e o layout ficar errado, os testes acusam.
 */

export type FieldType = 'bool' | 'u32' | 'i32' | 'f32' | 'f64' | 'u64' | 'i64' | 'str';

export interface FieldDef {
  name: string;
  type: FieldType;
  /** Número de elementos (arrays). */
  count?: number;
  /** Tamanho em bytes de cada string. */
  size?: number;
}

export interface ZoneDef {
  name: string;
  start: number;
  /** Offset do primeiro byte APÓS a zona (início da próxima). */
  end: number;
  fields: FieldDef[];
}

export interface CompiledField {
  name: string;
  type: FieldType;
  offset: number;
  count: number;
  size: number;
}

export interface CompiledLayout {
  size: number;
  fields: Map<string, CompiledField>;
  zones: { name: string; start: number; end: number; used: number }[];
}

const TYPE_SIZE: Record<Exclude<FieldType, 'str'>, number> = {
  bool: 1,
  u32: 4,
  i32: 4,
  f32: 4,
  f64: 8,
  u64: 8,
  i64: 8,
};

export function fieldByteSize(f: FieldDef): number {
  const count = f.count ?? 1;
  if (f.type === 'str') {
    if (!f.size) throw new Error(`Campo string ${f.name} sem size`);
    return f.size * count;
  }
  return TYPE_SIZE[f.type] * count;
}

export function compileLayout(zones: ZoneDef[], prefix = ''): CompiledLayout {
  const fields = new Map<string, CompiledField>();
  const zoneInfo: CompiledLayout['zones'] = [];
  let size = 0;
  for (const zone of zones) {
    let cursor = zone.start;
    for (const f of zone.fields) {
      const elem = f.type === 'str' ? f.size! : TYPE_SIZE[f.type];
      const align = f.type === 'str' || f.type === 'bool' ? 1 : elem;
      if (cursor % align !== 0) {
        throw new Error(`Campo ${f.name} desalinhado em ${cursor} (zona ${zone.name})`);
      }
      const name = prefix + f.name;
      if (fields.has(name)) throw new Error(`Campo duplicado: ${name}`);
      fields.set(name, { name, type: f.type, offset: cursor, count: f.count ?? 1, size: elem });
      cursor += fieldByteSize(f);
    }
    if (cursor > zone.end) {
      throw new Error(`Zona ${zone.name} extrapola o limite: ${cursor} > ${zone.end}`);
    }
    zoneInfo.push({ name: zone.name, start: zone.start, end: zone.end, used: cursor - zone.start });
    size = Math.max(size, zone.end);
  }
  return { size, fields, zones: zoneInfo };
}

/** Leitor tipado sobre um snapshot (Buffer) da memória compartilhada. */
export class LayoutReader {
  constructor(
    private readonly buf: Buffer,
    private readonly layout: CompiledLayout,
    private readonly base = 0,
  ) {}

  /** Cria um leitor para uma sub-estrutura (ex.: reboque N) com outro layout. */
  sub(layout: CompiledLayout, base: number): LayoutReader {
    return new LayoutReader(this.buf, layout, base);
  }

  private field(name: string): CompiledField {
    const f = this.layout.fields.get(name);
    if (!f) throw new Error(`Campo desconhecido no layout: ${name}`);
    return f;
  }

  private readAt(f: CompiledField, index: number): number | boolean | bigint | string {
    const off = this.base + f.offset + index * f.size;
    if (off + f.size > this.buf.length) throw new RangeError(`Leitura fora do buffer: ${f.name}`);
    switch (f.type) {
      case 'bool':
        return this.buf.readUInt8(off) !== 0;
      case 'u32':
        return this.buf.readUInt32LE(off);
      case 'i32':
        return this.buf.readInt32LE(off);
      case 'f32':
        return this.buf.readFloatLE(off);
      case 'f64':
        return this.buf.readDoubleLE(off);
      case 'u64':
        return this.buf.readBigUInt64LE(off);
      case 'i64':
        return this.buf.readBigInt64LE(off);
      case 'str': {
        const end = this.buf.indexOf(0, off);
        const stop = end === -1 || end > off + f.size ? off + f.size : end;
        return this.buf.toString('utf8', off, stop);
      }
    }
  }

  num(name: string, index = 0): number {
    const v = this.readAt(this.field(name), index);
    return typeof v === 'bigint' ? Number(v) : (v as number);
  }

  bool(name: string, index = 0): boolean {
    return this.readAt(this.field(name), index) as boolean;
  }

  str(name: string, index = 0): string {
    return this.readAt(this.field(name), index) as string;
  }

  big(name: string, index = 0): bigint {
    return this.readAt(this.field(name), index) as bigint;
  }

  nums(name: string, count?: number): number[] {
    const f = this.field(name);
    const n = Math.min(count ?? f.count, f.count);
    const out: number[] = [];
    for (let i = 0; i < n; i++) out.push(this.num(name, i));
    return out;
  }

  bools(name: string, count?: number): boolean[] {
    const f = this.field(name);
    const n = Math.min(count ?? f.count, f.count);
    const out: boolean[] = [];
    for (let i = 0; i < n; i++) out.push(this.bool(name, i));
    return out;
  }
}
