/** Recibos e cupons simulados: pedágio, NFC-e de abastecimento, bilhete de balsa/trem, auto de infração e relatório de entrega. */
import { fmtGameDate, fmtGameDateTime, fmtGameTime } from '../../../shared/docs/build';
import type { TripDoc } from '../../../shared/types';
import { Barcode, BRow, brl, Bx, Disclaimer, DocQr, eur, fmtKey, num, Sheet } from './common';

const short = (gm: number) => {
  const s = fmtGameDateTime(gm);
  return `${s.slice(0, 6)}${s.slice(8, 10)} ${s.slice(11)}`;
};

export function TollReceipt({ doc }: { doc: TripDoc }) {
  const d = doc.data;
  return (
    <div className="thermal" data-testid="doc-toll">
      <div className="c b">{d.operator.toUpperCase()}</div>
      <div className="c fade">CONCESSIONÁRIA (FICTÍCIA) · CNPJ {d.operatorCnpj}</div>
      <hr />
      <div className="c b">RECIBO DE PEDÁGIO</div>
      <hr />
      <div className="kv"><span>PRAÇA</span><span>{d.plaza}</span></div>
      <div className="kv"><span>CABINE</span><span>{d.booth}</span></div>
      <div className="kv"><span>DATA/HORA</span><span>{short(d.gameMin)}</span></div>
      <div className="kv"><span>PLACA</span><span>{d.plate}</span></div>
      <div className="kv"><span>CATEGORIA</span><span>{d.category}</span></div>
      <div className="kv"><span>PAGAMENTO</span><span>TAG</span></div>
      {d.route && <div className="kv"><span>ROTA</span><span>{d.route}</span></div>}
      <hr />
      <div className="kv big"><span>TOTAL</span><span>{brl(d.amountEur * d.fx)}</span></div>
      <div className="fade">tollgatePayAmount {eur(d.amountEur)} (SDK) × câmbio simulado {num(d.fx)}</div>
      <hr />
      <div className="c fade">BOA VIAGEM · SEM VALOR FISCAL</div>
      <div className="barc"><Barcode digits={d.receipt} label="Código do recibo" /></div>
    </div>
  );
}

export function FuelReceipt({ doc }: { doc: TripDoc }) {
  const d = doc.data;
  return (
    <div className="thermal" data-testid="doc-fuel">
      <div className="c b">{d.station.toUpperCase()}</div>
      <div className="c fade">CNPJ {d.stationCnpj} · IE {d.stationIe}</div>
      <hr />
      <div className="c b">
        DANFE NFC-e — DOCUMENTO AUXILIAR
        <br />
        DA NOTA FISCAL DE CONSUMIDOR
      </div>
      <hr />
      <div className="kv b"><span>ITEM</span><span>QTD × VL UNIT</span></div>
      <div>001 ÓLEO DIESEL S10</div>
      <div className="kv"><span>BOMBA {d.pump} · BICO {d.nozzle}</span><span>{num(d.liters, 3)} L × {num(d.priceBrl, 3)}</span></div>
      <div className="kv"><span /><span className="b">{num(d.totalBrl)}</span></div>
      <hr />
      <div className="kv"><span>QTD. TOTAL DE ITENS</span><span>1</span></div>
      <div className="kv big"><span>VALOR A PAGAR</span><span>{brl(d.totalBrl)}</span></div>
      <div className="kv"><span>FORMA PGTO</span><span>CARTÃO FROTA</span></div>
      <div className="kv"><span>ODÔMETRO</span><span>{num(d.odometerKm, 0)} km</span></div>
      <div className="kv"><span>PLACA</span><span>{d.plate}</span></div>
      <div className="kv"><span>DATA/HORA</span><span>{short(d.gameMin)}</span></div>
      <hr />
      <div className="fade">refuelAmount {num(d.liters, 1)} L (SDK) · preço/L SIMULADO (Configurações)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8, alignItems: 'center', marginTop: 8 }}>
        <div style={{ height: 90 }} className="qr"><DocQr text={d.qr} /></div>
        <div className="fade">
          Consulta pela chave de acesso (fictícia)
          <br />
          {fmtKey(d.key).slice(0, 29)}…
          <br />
          NFC-e nº {String(d.numero).padStart(6, '0')} série 1
        </div>
      </div>
      <hr />
      <div className="c b" style={{ color: '#9d1d16' }}>NFe</div>
    </div>
  );
}

export function PassageTicket({ doc }: { doc: TripDoc }) {
  const d = doc.data;
  const ferry = d.kind === 'ferry';
  return (
    <div className="ticket" data-testid={`doc-${d.kind}`}>
      <div className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <b>{ferry ? 'BALSA' : 'TREM'} · {d.operator.toUpperCase()}</b>
          <span className="k">nº {d.ticket}</span>
        </div>
        <div className="route"><span>{d.from.toUpperCase()}</span><i /><span>{d.to.toUpperCase()}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
          <div><div className="k">Partida (jogo)</div><b>{fmtGameDate(d.gameMin).slice(0, 5)} · {fmtGameTime(d.gameMin)}</b></div>
          <div><div className="k">Veículo</div><b>{d.plate}</b></div>
          <div><div className="k">Categoria</div><b>CAMINHÃO + REBOQUE</b></div>
          <div><div className="k">Valor</div><b>{brl(d.amountEur * d.fx)}</b></div>
        </div>
        <div className="k" style={{ marginTop: 8 }}>{ferry ? 'ferry' : 'train'}SourceName / TargetName / PayAmount (SDK) · {eur(d.amountEur)} × câmbio</div>
      </div>
      <div className="stub">EMBARQUE · {ferry ? `CONVÉS ${d.deck}` : `VAGÃO ${d.deck}`}</div>
    </div>
  );
}

export function FineTicket({ doc }: { doc: TripDoc }) {
  const d = doc.data;
  const o = d.offence;
  return (
    <div className="talao" data-testid="doc-fine">
      <div className="via v2" />
      <div className="via">
        <div className="perf" />
        <div className="org">{d.agency} · Superintendência Regional</div>
        <h4>Auto de infração de trânsito</h4>
        <div className="no">AIT {d.ait}</div>
        <div className="f">
          <div className="s2"><span className="l">Placa</span><span className="h">{d.plate}</span></div>
          <div className="s2"><span className="l">Marca / modelo</span><span className="h">{d.truck}</span></div>
          <div className="s2"><span className="l">Espécie</span><span className="h">carga · tração</span></div>
          <div className="s4"><span className="l">Local da infração</span><span className="h">{d.place}</span></div>
          <div className="s2"><span className="l">Data · hora (jogo)</span><span className="h">{fmtGameDate(d.gameMin).slice(0, 5)} · {fmtGameTime(d.gameMin)}</span></div>
          <div className="s2"><span className="l">Enquadramento (CTB)</span><span className="h">art. {o.art}</span></div>
          <div className="s4"><span className="l">Descrição da infração · fineOffence = "{o.code}"</span><span className="h">{o.desc}</span></div>
          <div className="s2"><span className="l">Gravidade</span><span className="h">{o.severity}</span></div>
          <div className="s2"><span className="l">Valor (fineAmount × câmbio)</span><span className="h">{brl(d.amountEur * d.fx)}</span></div>
          <div className="s2"><span className="l">Medição</span><span className="h">{d.measured ? `${d.measured.speedKmh} km/h · lim. ${d.measured.limitKmh ?? '—'}` : '—'}</span></div>
          <div className="s3"><span className="l">Condutor</span><span className="h">{d.driver}</span></div>
          <div className="s3"><span className="l">Assinatura do condutor</span><span className="sig">{String(d.driver).split(' ')[0]}</span></div>
          <div className="s3"><span className="l">Agente autuador · matrícula</span><span className="h">{d.agent} · {d.agentId}</span></div>
          <div className="s3"><span className="l">Assinatura do agente</span><span className="sig">{String(d.agent).split(' ').pop()}</span></div>
          <div className="s6"><span className="l">Observações</span><span className="h">Condutor notificado no local. Documento simulado — sem valor legal.</span></div>
        </div>
        <div style={{ font: '1.6cqw var(--doc-font)', marginTop: '1.6cqw', color: '#5c5545' }}>
          1ª via — condutor · 2ª via (rosa) — órgão autuador
        </div>
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`Nota ${rating} de 5`} style={{ font: '700 3cqw var(--doc-font)', letterSpacing: '.1em' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: rating >= i ? 'var(--tp-accent)' : rating >= i - 0.5 ? 'var(--tp-accent-2)' : '#c9c4b5' }}>
          ★
        </span>
      ))}
    </span>
  );
}

export function DeliveryReport({ doc }: { doc: TripDoc }) {
  const d = doc.data;
  const j = d.job;
  const del = d.delivered;
  const late = d.lateMin > 0;
  return (
    <Sheet auto source={doc.source} testId="doc-delivery">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '.2cqw solid var(--ink-rule)', paddingBottom: '1cqw' }}>
        <div>
          <div style={{ font: '700 2.6cqw var(--doc-font)', textTransform: 'uppercase' }}>Relatório de entrega</div>
          <div style={{ font: '1.4cqw var(--doc-font)' }}>
            {j.compSrc} ({j.citySrc}) → {j.compDst} ({j.cityDst}) · {fmtGameDateTime(d.gameMin)} (jogo)
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Stars rating={d.rating} />
          <div style={{ font: '700 1.6cqw var(--doc-font)' }}>Nota {num(d.rating, 1)} / 5 (simulada)</div>
        </div>
      </div>
      <BRow cols="1fr 1fr 1fr">
        <Bx l="Carga" v={j.cargo} cls="b" />
        <Bx l="Recebedor · doca" v={`${d.receiver} · doca ${d.dock}`} />
        <Bx l="Receita do frete (SDK)" v={`${eur(del.revenueEur)} · ${brl(del.revenueEur * d.fx)}`} cls="r" />
      </BRow>
      <BRow cols="1fr 1fr 1fr">
        <Bx l="Prazo" v={late ? `ATRASO de ${Math.round(d.lateMin)} min` : `no prazo · folga ${Math.round(-d.lateMin)} min`} cls={late ? 'b' : ''} />
        <Bx l="Avaria (jobDeliveredCargoDamage)" v={`${num(del.cargoDamage * 100, 1)} %`} cls="r" />
        <Bx l="Infrações na viagem" v={String(d.fines)} cls="r" />
      </BRow>
      <BRow cols="1fr 1fr 1fr">
        <Bx l="Jornada (regra simulada)" v={d.dutyViolated ? 'VIOLADA' : 'dentro do limite'} />
        <Bx l="Estacionamento" v={del.autopark ? 'automático (autopark)' : 'manual'} />
        <Bx l="Experiência (XP)" v={String(del.earnedXp)} cls="r" />
      </BRow>
      <BRow cols="1fr 1fr">
        <Bx l="Distância (jobDeliveredDistanceKm)" v={`${num(del.distanceKm, 1)} km`} cls="r" />
        <Bx l="Tempo de entrega (jogo)" v={`${Math.floor(del.deliveryTimeMin / 60)} h ${String(Math.round(del.deliveryTimeMin % 60)).padStart(2, '0')} min`} cls="r" />
      </BRow>
      <div style={{ font: '1.25cqw var(--doc-font)', marginTop: '1cqw', color: 'var(--ink-2)' }}>
        Nota = 5 − 1,5·(avaria/10 %) − 0,5·multas − 1·atraso − 0,5·jornada violada + 0,5·sem autopark, limitada a 1–5 (cálculo SIMULADO).
      </div>
      <Disclaimer />
    </Sheet>
  );
}
