/** DANFE (NF-e 55), DACTE (CT-e 57) e DAMDFE (MDF-e 58) — SIMULADOS, sem valor fiscal. */
import { fmtGameDate, fmtGameDateTime, fmtGameTime } from '../../../shared/docs/build';
import type { TripDoc } from '../../../shared/types';
import { Barcode, BRow, brl, Bx, Disclaimer, DocQr, fmtKey, nfmt, num, Sheet } from './common';
import { SignatureSvg, StampView } from './Stamp';

const TRAILER_PT: Record<string, string> = {
  dryvan: 'baú', curtainside: 'sider', refrigerated: 'frigorífico', flatbed: 'carga seca', container: 'porta-contêiner', lowloader: 'prancha', log: 'porta-toras',
  silo: 'silo', dumper: 'basculante', car_transporter: 'cegonha', livestock: 'boiadeiro', fuel_tank: 'tanque',
};

export function Danfe({ doc }: { doc: TripDoc }) {
  const d = doc.data;
  const j = d.job;
  const emitDate = fmtGameDate(d.emittedGameMin);
  const received = doc.status === 'delivered' && doc.signature;
  return (
    <Sheet source={doc.source} testId="doc-nfe">
      <div className="canhoto" data-status={doc.status} data-testid="canhoto">
        <BRow cols="1fr">
          <Bx l={`Recebemos de ${d.emit.name} os produtos constantes da nota fiscal eletrônica indicada ao lado`} v={`Destinatário: ${d.dest.name} — ${d.dest.city}/${d.dest.uf} · Valor total: ${brl(d.vProd)}`} />
        </BRow>
        <div className="bx" style={{ gridRow: 'span 2', textAlign: 'center' }}>
          <span className="l" style={{ textAlign: 'center' }}>
            NF-e
          </span>
          <span className="v b c" style={{ fontSize: '1.9cqw' }}>
            Nº {nfmt(d.numero)}
          </span>
          <span className="v c">SÉRIE 001</span>
        </div>
        <BRow cols="30fr 70fr">
          <Bx l="Data de recebimento" v={received ? `${fmtGameDateTime(d.receivedGameMin)} (jogo)` : ''} />
          <Bx l="Identificação e assinatura do recebedor" v={received ? (doc.signature!.auto ? 'assinatura eletrônica automática' : '') : ''} />
        </BRow>
        {received && (
          <div className="sig-on">
            <SignatureSvg strokes={doc.signature!.strokes} aspect={6} />
          </div>
        )}
        {doc.stamps?.map((s, i) => (
          <div key={i} className={`stamp-on${s.kind === 'received' ? '' : ' rect'}`} style={s.kind !== 'received' ? { top: `${1 + i}cqw` } : undefined}>
            <StampView stamp={s} />
          </div>
        ))}
      </div>
      <div className="danfe-head">
        <div className="bx">
          <span className="l">Identificação do emitente</span>
          <div className="emit">
            <div className="logo">{d.emit.initial}</div>
            <div>
              <div className="nm">{d.emit.name}</div>
              <div className="ad">
                {d.emit.addr.street} — {d.emit.addr.district}
                <br />
                {d.emit.city} / {d.emit.uf} · CEP {d.emit.addr.cep}
                <br />
                Fone {d.emit.addr.phone}
              </div>
            </div>
          </div>
        </div>
        <div className="bx dbox">
          <div className="t1">DANFE</div>
          <div className="t2">
            Documento Auxiliar da
            <br />
            Nota Fiscal Eletrônica
          </div>
          <div className="es">
            <span>
              0 - ENTRADA
              <br />1 - SAÍDA
            </span>
            <i>1</i>
          </div>
          <div className="nn">
            Nº {nfmt(d.numero)}
            <br />
            SÉRIE 001
            <br />
            FOLHA 1/1
          </div>
        </div>
        <div className="bx">
          <div className="bar">
            <Barcode digits={d.key} />
          </div>
          <span className="l" style={{ marginTop: '.4cqw' }}>
            Chave de acesso
          </span>
          <div className="chave">{fmtKey(d.key)}</div>
          <div className="consult">
            Consulta de autenticidade fictícia
            <br />
            truckpulse.local/consulta (sem conexão com a Sefaz)
          </div>
        </div>
      </div>
      <BRow cols="58fr 42fr">
        <Bx l="Natureza da operação" v="VENDA DE MERCADORIA ADQUIRIDA DE TERCEIROS" cls="b" />
        <Bx l="Protocolo de autorização de uso" v={`${d.protocolo} — ${fmtGameDateTime(d.emittedGameMin)}`} cls="c" />
      </BRow>
      <BRow cols="1fr 1fr 1fr">
        <Bx l="Inscrição estadual" v={d.emit.ie} />
        <Bx l="Insc. estadual do subst. trib." v="" />
        <Bx l="CNPJ" v={d.emit.cnpj} />
      </BRow>
      <div className="bt">Destinatário / remetente</div>
      <BRow cols="58fr 24fr 18fr">
        <Bx l="Nome / razão social" v={d.dest.name} cls="b" />
        <Bx l="CNPJ / CPF" v={d.dest.cnpj} />
        <Bx l="Data da emissão" v={emitDate} cls="c" />
      </BRow>
      <BRow cols="46fr 22fr 14fr 18fr">
        <Bx l="Endereço" v={d.dest.addr.street} />
        <Bx l="Bairro / distrito" v={d.dest.addr.district} />
        <Bx l="CEP" v={d.dest.addr.cep} />
        <Bx l="Data da saída/entrada" v={emitDate} cls="c" />
      </BRow>
      <BRow cols="40fr 18fr 6fr 18fr 18fr">
        <Bx l="Município" v={d.dest.city} />
        <Bx l="Fone / fax" v={d.dest.addr.phone} />
        <Bx l="UF" v={d.dest.uf} cls="c" />
        <Bx l="Inscrição estadual" v={d.dest.ie} />
        <Bx l="Hora da saída" v={fmtGameTime(d.emittedGameMin)} cls="c" />
      </BRow>
      <div className="bt">Cálculo do imposto</div>
      <BRow cols="repeat(5,1fr)">
        <Bx l="Base de cálc. do ICMS" v={num(d.vProd)} cls="r" />
        <Bx l="Valor do ICMS" v={num(d.icms)} cls="r" />
        <Bx l="Base cálc. ICMS S.T." v="0,00" cls="r" />
        <Bx l="Valor do ICMS subst." v="0,00" cls="r" />
        <Bx l="Valor total dos produtos" v={num(d.vProd)} cls="r b" />
      </BRow>
      <BRow cols="repeat(6,1fr)">
        <Bx l="Valor do frete" v="0,00" cls="r" />
        <Bx l="Valor do seguro" v="0,00" cls="r" />
        <Bx l="Desconto" v="0,00" cls="r" />
        <Bx l="Outras despesas" v="0,00" cls="r" />
        <Bx l="Valor do IPI" v="0,00" cls="r" />
        <Bx l="Valor total da nota" v={num(d.vProd)} cls="r b" />
      </BRow>
      <div className="bt">Transportador / volumes transportados</div>
      <BRow cols="34fr 20fr 12fr 13fr 5fr 16fr">
        <Bx l="Nome / razão social" v={d.carrier.name} cls="b" />
        <Bx l="Frete por conta" v="1 - DESTINATÁRIO" />
        <Bx l="Código ANTT" v={d.carrier.rntrc} />
        <Bx l="Placa do veículo" v={j.truckPlate || '—'} cls="b" />
        <Bx l="UF" v={(j.truckPlateCountry || 'EX').slice(0, 2).toUpperCase()} cls="c" />
        <Bx l="CNPJ / CPF" v={d.carrier.cnpj} />
      </BRow>
      <BRow cols="44fr 30fr 6fr 20fr">
        <Bx l="Endereço" v={d.carrier.addr.street} />
        <Bx l="Município" v={j.citySrc} />
        <Bx l="UF" v={d.emit.uf} cls="c" />
        <Bx l="Inscrição estadual" v={d.carrier.ie} />
      </BRow>
      <BRow cols="repeat(6,1fr)">
        <Bx l="Quantidade" v={String(d.volumes)} cls="r" />
        <Bx l="Espécie" v={d.cargo.species} />
        <Bx l="Marca" v="—" />
        <Bx l="Numeração" v={`1 A ${d.volumes}`} />
        <Bx l="Peso bruto" v={`${num(d.grossKg, 3)} kg`} cls="r" />
        <Bx l="Peso líquido" v={`${num(d.netKg, 3)} kg`} cls="r" />
      </BRow>
      <div className="bt">Dados do produto / serviço</div>
      <table className="prod">
        <thead>
          <tr>
            <th>Código</th>
            <th style={{ width: '30%' }}>Descrição do produto / serviço</th>
            <th>NCM/SH</th>
            <th>CST</th>
            <th>CFOP</th>
            <th>UN</th>
            <th>Qtde.</th>
            <th>V. unit.</th>
            <th>V. total</th>
            <th>BC ICMS</th>
            <th>V. ICMS</th>
            <th>Alíq.</th>
          </tr>
        </thead>
        <tbody>
          <tr className="fill">
            <td>{(d.cargo.id || 'CARGA').toUpperCase()}</td>
            <td>
              {d.cargo.desc}
              {d.cargo.known ? '' : ` (${d.cargo.name})`}
              <br />
              <span style={{ color: '#555' }}>Placa reboque {j.trailerPlate || '—'}</span>
            </td>
            <td>{d.cargo.ncm}</td>
            <td>000</td>
            <td>6.102</td>
            <td>KG</td>
            <td className="n">{num(d.netKg, 4)}</td>
            <td className="n">{num(d.cargo.priceKg, 4)}</td>
            <td className="n">{num(d.vProd)}</td>
            <td className="n">{num(d.vProd)}</td>
            <td className="n">{num(d.icms)}</td>
            <td className="n">12,00</td>
          </tr>
        </tbody>
      </table>
      <div className="bt">Dados adicionais</div>
      <div className="addl">
        <Bx
          l="Informações complementares"
          v={`Frete do jogo Euro Truck Simulator 2 · origem ${j.compSrc} (${j.citySrc}) → destino ${j.compDst} (${j.cityDst}) · distância planejada ${num(j.plannedKm, 0)} km · valor do frete € ${num(d.incomeEur, 0)} (câmbio simulado 1 € = R$ ${num(d.fx)}) · prazo ${fmtGameDateTime(d.deadlineGameMin)} (relógio do jogo). Valores de mercadoria e impostos SIMULADOS.`}
        />
        <Bx l="Reservado ao fisco" v="" />
      </div>
      <Disclaimer />
    </Sheet>
  );
}

export function Dacte({ doc }: { doc: TripDoc }) {
  const d = doc.data;
  const j = d.job;
  const c = d.components;
  return (
    <Sheet source={doc.source} testId="doc-cte">
      <div className="danfe-head" style={{ gridTemplateColumns: '40fr 22fr 38fr' }}>
        <div className="bx">
          <span className="l">Emitente (transportador)</span>
          <div className="emit">
            <div className="logo" style={{ fontSize: '1.9cqw' }}>
              TP
            </div>
            <div>
              <div className="nm">{d.carrier.name}</div>
              <div className="ad">
                CNPJ {d.carrier.cnpj}
                <br />
                IE {d.carrier.ie} · RNTRC {d.carrier.rntrc}
                <br />
                {j.citySrc} / {d.emit.uf}
              </div>
            </div>
          </div>
        </div>
        <div className="bx dbox">
          <div className="t1">DACTE</div>
          <div className="t2">
            Documento Auxiliar do
            <br />
            Conhecimento de Transporte Eletrônico
          </div>
          <div className="nn">
            MODELO 57 · SÉRIE 001
            <br />
            Nº {nfmt(d.numero)}
            <br />
            FOLHA 1/1
          </div>
        </div>
        <div className="bx">
          <div className="bar">
            <Barcode digits={d.key} />
          </div>
          <span className="l">Chave de acesso</span>
          <div className="chave">{fmtKey(d.key)}</div>
          <div className="consult">
            Protocolo {d.protocolo} · {fmtGameDateTime(d.emittedGameMin)}
          </div>
        </div>
      </div>
      <BRow cols="repeat(4,1fr)">
        <Bx l="Modal" v="RODOVIÁRIO" cls="b" />
        <Bx l="Tipo do CT-e" v="NORMAL" />
        <Bx l="Tipo do serviço" v="NORMAL" />
        <Bx l="Tomador do serviço" v="DESTINATÁRIO" />
      </BRow>
      <BRow cols="1fr 1fr">
        <Bx l="CFOP — natureza da prestação" v="6.353 — PRESTAÇÃO DE SERVIÇO DE TRANSPORTE A ESTABELECIMENTO COMERCIAL" />
        <Bx l="Data e hora de emissão" v={fmtGameDateTime(d.emittedGameMin)} cls="c" />
      </BRow>
      <BRow cols="1fr 1fr">
        <Bx l="Início da prestação" v={`${j.citySrc} — ${d.emit.uf}`} cls="b" />
        <Bx l="Término da prestação" v={`${j.cityDst} — ${d.dest.uf}`} cls="b" />
      </BRow>
      <BRow cols="1fr 1fr">
        <Bx l="Remetente" v={`${d.emit.name} · CNPJ ${d.emit.cnpj}`} />
        <Bx l="Destinatário" v={`${d.dest.name} · CNPJ ${d.dest.cnpj}`} />
      </BRow>
      <BRow cols="1fr 1fr">
        <Bx l="Expedidor" v="—" />
        <Bx l="Recebedor" v="—" />
      </BRow>
      <div className="bt">Informações da carga</div>
      <BRow cols="40fr 20fr 20fr 20fr">
        <Bx l="Produto predominante" v={(j.cargo || 'MERCADORIA').toUpperCase()} cls="b" />
        <Bx l="Outras características" v="CARGA PALETIZADA" />
        <Bx l="Valor total da carga" v={num(d.vProd)} cls="r" />
        <Bx l="Peso bruto (kg)" v={num(d.grossKg, 3)} cls="r" />
      </BRow>
      <div className="bt">Componentes do valor da prestação do serviço</div>
      <BRow cols="repeat(4,1fr)">
        <Bx l="Frete peso" v={num(c.peso)} cls="r" />
        <Bx l="Frete valor (ad valorem)" v={num(c.advalorem)} cls="r" />
        <Bx l="Pedágio" v={num(c.pedagio)} cls="r" />
        <Bx l="Gris / outros" v={num(c.outros)} cls="r" />
      </BRow>
      <BRow cols="1fr 1fr">
        <Bx l="Valor total do serviço" v={brl(d.vFrete)} cls="r b" />
        <Bx l="Valor a receber" v={brl(d.vFrete)} cls="r b" />
      </BRow>
      <div className="bt">Informações relativas ao imposto</div>
      <BRow cols="repeat(5,1fr)">
        <Bx l="Situação tributária" v="00 - TRIBUTAÇÃO NORMAL" />
        <Bx l="Base de cálculo" v={num(d.vFrete)} cls="r" />
        <Bx l="Alíq. ICMS" v="12,00" cls="r" />
        <Bx l="Valor ICMS" v={num(d.icms)} cls="r" />
        <Bx l="% red. BC" v="0,00" cls="r" />
      </BRow>
      <div className="bt">Documentos originários</div>
      <BRow cols="20fr 80fr">
        <Bx l="Tipo" v="NF-e" />
        <Bx l="Chave de acesso" v={fmtKey(d.nfeKey)} cls="b" />
      </BRow>
      <div className="bt">Dados específicos do modal rodoviário</div>
      <BRow cols="repeat(4,1fr)">
        <Bx l="RNTRC da empresa" v={d.carrier.rntrc} />
        <Bx l="Placa tração" v={j.truckPlate || '—'} cls="b" />
        <Bx l="Placa reboque" v={j.trailerPlate || '—'} cls="b" />
        <Bx l="Previsão de entrega" v={fmtGameDateTime(d.deadlineGameMin)} cls="c" />
      </BRow>
      <div className="bt">Observações</div>
      <div className="addl">
        <Bx l="Observações gerais" v={`Distância planejada ${num(j.plannedKm, 0)} km. Valor do frete = receita do frete no jogo (jobIncome € ${num(d.incomeEur, 0)}) × câmbio simulado 1 € = R$ ${num(d.fx)}.`} />
        <Bx l="Reservado ao fisco" v="" />
      </div>
      <Disclaimer />
      <StampsOverlay doc={doc} />
    </Sheet>
  );
}

export function Damdfe({ doc }: { doc: TripDoc }) {
  const d = doc.data;
  const j = d.job;
  return (
    <Sheet source={doc.source} testId="doc-mdfe">
      <div className="danfe-head" style={{ gridTemplateColumns: '44fr 56fr' }}>
        <div className="bx">
          <span className="l">Emitente</span>
          <div className="emit">
            <div className="logo" style={{ fontSize: '1.9cqw' }}>
              TP
            </div>
            <div>
              <div className="nm">{d.carrier.name}</div>
              <div className="ad">
                CNPJ {d.carrier.cnpj} · IE {d.carrier.ie}
                <br />
                RNTRC {d.carrier.rntrc}
              </div>
            </div>
          </div>
        </div>
        <div className="bx">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 13cqw', gap: '1cqw', alignItems: 'center' }}>
            <div>
              <div style={{ font: '700 2.4cqw var(--doc-font)' }}>DAMDFE</div>
              <div style={{ font: '1.1cqw var(--doc-font)' }}>Documento Auxiliar do Manifesto Eletrônico de Documentos Fiscais</div>
              <div className="bar" style={{ marginTop: '.6cqw' }}>
                <Barcode digits={d.key} />
              </div>
            </div>
            <div className="qr" style={{ height: '13cqw' }}>
              <DocQr text={d.qr} />
            </div>
          </div>
          <span className="l">Chave de acesso</span>
          <div className="chave">{fmtKey(d.key)}</div>
        </div>
      </div>
      <BRow cols="repeat(6,1fr)">
        <Bx l="Modelo" v="58" cls="c" />
        <Bx l="Série" v="001" cls="c" />
        <Bx l="Número" v={nfmt(d.numero)} cls="c" />
        <Bx l="Folha" v="1/1" cls="c" />
        <Bx l="Emissão" v={fmtGameDateTime(d.emittedGameMin)} cls="c" />
        <Bx l="UF carreg. → descarreg." v={`${d.emit.uf} → ${d.dest.uf}`} cls="c" />
      </BRow>
      <BRow cols="repeat(4,1fr)">
        <Bx l="Qtd. CT-e" v="1" cls="r b" />
        <Bx l="Qtd. NF-e" v="1" cls="r b" />
        <Bx l="Peso total (kg)" v={num(d.grossKg, 3)} cls="r b" />
        <Bx l="Valor total da carga" v={brl(d.vProd)} cls="r b" />
      </BRow>
      <div className="bt">Modal rodoviário de carga</div>
      <table className="prod">
        <thead>
          <tr>
            <th>Veículo</th>
            <th>Placa</th>
            <th>País/UF</th>
            <th>RNTRC</th>
            <th>Tipo</th>
            <th>Eixos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Tração · {j.truckBrand} {j.truckName}
            </td>
            <td>
              <b>{j.truckPlate || '—'}</b>
            </td>
            <td>{(j.truckPlateCountry || 'EX').slice(0, 2).toUpperCase()}</td>
            <td>{d.carrier.rntrc}</td>
            <td>Cavalo mecânico</td>
            <td className="n">{Math.max(2, Math.min(4, j.axles - 3))}</td>
          </tr>
          <tr>
            <td>Reboque · {TRAILER_PT[j.trailerBodyType] ?? (j.trailerName || 'semirreboque')}</td>
            <td>
              <b>{j.trailerPlate || '—'}</b>
            </td>
            <td>{(j.trailerPlateCountry || j.truckPlateCountry || 'EX').slice(0, 2).toUpperCase()}</td>
            <td>{d.carrier.rntrc}</td>
            <td>Semirreboque</td>
            <td className="n">{Math.max(1, Math.min(4, j.axles - Math.max(2, Math.min(4, j.axles - 3))))}</td>
          </tr>
          <tr className="fill" style={{ height: '2cqw' }}>
            <td colSpan={6} />
          </tr>
        </tbody>
      </table>
      <div className="bt">Condutor</div>
      <BRow cols="60fr 40fr">
        <Bx l="Nome" v={d.driver.name.toUpperCase()} cls="b" />
        <Bx l="CPF (fictício)" v={d.driver.cpf} />
      </BRow>
      <div className="bt">Percurso e documentos vinculados</div>
      <BRow cols="1fr">
        <Bx l="Percurso" v={`${j.citySrc} (${d.emit.uf}) → ${j.cityDst} (${d.dest.uf}) · ${num(j.plannedKm, 0)} km planejados`} />
      </BRow>
      <BRow cols="20fr 80fr">
        <Bx l="CT-e" v={fmtKey(d.cteKey)} />
        <Bx l="NF-e vinculada" v={fmtKey(d.nfeKey)} />
      </BRow>
      <BRow cols="1fr 1fr">
        <Bx l="Seguradora (simulada)" v={`${d.insurer.name} · apólice ${d.insurer.policy}`} />
        <Bx l="Averbação" v={d.insurer.averbacao} />
      </BRow>
      <div className="bt">Observações</div>
      <div className="addl">
        <Bx l="Informações complementares" v={`Manifesto ${doc.status === 'delivered' || doc.status === 'archived' ? 'ENCERRADO na entrega (jobDelivered)' : doc.status === 'cancelled' ? 'CANCELADO (jobCancelled)' : 'em aberto — encerrado automaticamente na entrega ou no cancelamento'}. Consulta: ${d.qr}`} />
        <Bx l="Reservado ao fisco" v="" />
      </div>
      <Disclaimer />
      <StampsOverlay doc={doc} />
    </Sheet>
  );
}

/** Carimbos (ex.: CANCELADO) no meio da folha para CT-e/MDF-e. */
function StampsOverlay({ doc }: { doc: TripDoc }) {
  if (!doc.stamps?.length) return null;
  return (
    <div style={{ position: 'absolute', top: '30%', left: '30%', width: '40%', zIndex: 4, pointerEvents: 'none' }}>
      {doc.stamps.map((s, i) => (
        <StampView key={i} stamp={s} />
      ))}
    </div>
  );
}

