import { describe, expect, it } from 'vitest';
import { aamm, buildCte, buildFine, buildMdfe, buildNfe, deliveryRating, fmtGameDateTime, type JobInput } from '../../shared/docs/build.js';
import { chave, chaveModelo, cnpj, code128cBars, code128cSymbols, cpf, fmtChave, isValidChave, isValidCnpj, isValidCpf, protocolo } from '../../shared/docs/ids.js';
import { cargoTax, cityUf, offence, tollCategory } from '../../shared/docs/tables.js';

const JOB: JobInput = {
  cargoId: 'dryfruit', cargo: 'Frutas secas', massKg: 18240, units: 1, citySrc: 'Calais', compSrc: 'Tradeaux', cityDst: 'Lyon',
  compDst: 'Agrominta', incomeEur: 3210, plannedKm: 752, deadlineGameMin: 4000, startedGameMin: 2800, truckPlate: 'TP-517-RJ',
  truckPlateCountry: 'France', trailerPlate: 'TRL-4471', truckBrand: 'Scania', truckName: 'R', axles: 5,
};
const CTX = { fx: 6, carrier: 'TRUCKPULSE TRANSPORTES', driver: 'Eduardo B.', dieselPrice: 6.19 };

describe('identificadores simulados', () => {
  it('CNPJ: raiz 99, DV válido e determinístico', () => {
    for (const name of ['Tradeaux|Calais', 'Agrominta|Lyon', 'posto', 'x', 'Empresa com acentuação ç']) {
      const c = cnpj(name);
      expect(c).toMatch(/^99\.\d{3}\.\d{3}\/0001-\d{2}$/);
      expect(isValidCnpj(c)).toBe(true);
      expect(cnpj(name)).toBe(c);
    }
    expect(cnpj('a')).not.toBe(cnpj('b'));
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true); // exemplo clássico válido
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
  });

  it('CPF: DV válido e determinístico', () => {
    for (const name of ['Eduardo B.', 'Motorista', 'Ana']) {
      const c = cpf(name);
      expect(c).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
      expect(isValidCpf(c)).toBe(true);
      expect(cpf(name)).toBe(c);
    }
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('529.982.247-26')).toBe(false);
  });

  it('chave de acesso: 44 dígitos, cUF 91, DV módulo 11 e modelo correto', () => {
    for (const model of [55, 57, 58, 65] as const) {
      const k = chave(model, 4217, cnpj('emit'), '2611');
      expect(k).toHaveLength(44);
      expect(k.startsWith('912611')).toBe(true);
      expect(isValidChave(k)).toBe(true);
      expect(chaveModelo(k)).toBe(model);
      const bad = k.slice(0, 43) + String((Number(k[43]) + 1) % 10);
      expect(isValidChave(bad)).toBe(false);
    }
    expect(fmtChave('1234567890')).toBe('1234 5678 90');
    expect(protocolo('2611', 4217)).toMatch(/^991 2611 0004217 \d$/);
  });

  it('Code 128-C: início C, checksum módulo 103 e parada', () => {
    expect(code128cSymbols('12345678')).toEqual([105, 12, 34, 56, 78, 47, 106]);
    const k = chave(55, 1, cnpj('x'), '2611');
    const sym = code128cSymbols(k);
    expect(sym).toHaveLength(1 + 22 + 2);
    const { bars, width } = code128cBars(k);
    expect(bars.length).toBe(3 * 24 + 4); // 3 barras por símbolo + 4 na parada
    expect(width).toBe(20 + 11 * 24 + 13);
  });
});

describe('tabelas simuladas', () => {
  it('NCM/preço por carga com fallback', () => {
    expect(cargoTax('dryfruit').ncm).toBe('0813.40.90');
    expect(cargoTax('cement').desc).toMatch(/CIMENTO/);
    expect(cargoTax('xyz_new_cargo', 'frozen fish').key).toBe('frozen');
    expect(cargoTax('???', null)).toMatchObject({ ncm: '9999.99.99', desc: 'MERCADORIA DIVERSA', key: null });
  });
  it('UF pela cidade e multas pelo CTB', () => {
    expect(cityUf('Calais')).toBe('FR');
    expect(cityUf('Curitiba')).toBe('PR');
    expect(cityUf('Lugar Nenhum')).toBe('EX');
    expect(offence('red_signal')).toMatchObject({ art: '208', severity: 'GRAVÍSSIMA' });
    expect(offence('algo_novo').art).toBe('—');
    expect(tollCategory(5)).toBe('7 · 5 EIXOS');
  });
});

describe('documentos montados (determinísticos)', () => {
  it('NF-e/CT-e/MDF-e repetem os mesmos números para o mesmo frete', () => {
    const a = buildNfe(JOB, CTX, 4217);
    const b = buildNfe(JOB, CTX, 4217);
    expect(a).toEqual(b);
    expect(a.vProd).toBeCloseTo(18240 * 9.8, 2);
    expect(a.icms).toBeCloseTo(a.vProd * 0.12, 1);
    expect(a.key.slice(2, 6)).toBe(aamm(JOB.startedGameMin));
    const c = buildCte(JOB, CTX, 1388, a.key);
    expect(c.vFrete).toBe(3210 * 6);
    expect(c.components.peso + c.components.advalorem + c.components.pedagio + c.components.outros).toBeCloseTo(c.vFrete, 1);
    expect(chaveModelo(c.key)).toBe(57);
    const m = buildMdfe(JOB, CTX, 512, a.key, c.key);
    expect(chaveModelo(m.key)).toBe(58);
    expect(isValidCpf(m.driver.cpf)).toBe(true);
    expect(m.qr).toContain('truckpulse.local');
  });
  it('auto de infração com medição só em excesso de velocidade', () => {
    expect(buildFine(JOB, CTX, 3000, 'speeding', 650, 'X', 'Scania R', 97, 80).measured).toEqual({ speedKmh: 97, limitKmh: 80 });
    expect(buildFine(JOB, CTX, 3000, 'red_signal', 1200, 'X', 'Scania R', 50, 60).measured).toBeNull();
  });
  it('nota da entrega entre 1 e 5, em passos de 0,5', () => {
    expect(deliveryRating({ damage: 0, fines: 0, lateMin: 0, dutyViolated: false, autopark: false })).toBe(5);
    expect(deliveryRating({ damage: 0.087, fines: 1, lateMin: 30, dutyViolated: true, autopark: true })).toBe(1.5);
    expect(deliveryRating({ damage: 1, fines: 5, lateMin: 30, dutyViolated: true, autopark: true })).toBe(1);
  });
  it('relógio do jogo vira data fictícia', () => {
    expect(fmtGameDateTime(0)).toBe('02/11/2026 00:00');
    expect(fmtGameDateTime(1440 + 12)).toBe('03/11/2026 00:12');
  });
});
