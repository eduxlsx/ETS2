# TRUCKPULSE — Documentos fiscais simulados e funções de imersão

> Complementa o `DESIGN-SPEC.md`. Referência visual e interativa: **`docs/design/documentos.html`**
> (abre sem build; abra com `#canhoto-assinado` no fim da URL para ver o carimbo já aplicado).
> O mockup já traz, em JavaScript puro, as rotinas que podem ser portadas: CNPJ/CPF com DV,
> chave de acesso módulo 11, Code 128-C, assinatura em canvas, carimbo SVG com tinta irregular e
> tacógrafo.

**Princípios**
1. **Nada é apresentado como real.** Todo documento tem a marca d'água "SEM VALOR FISCAL" e o rodapé
   "DOCUMENTO SIMULADO — SEM VALOR FISCAL · empresas e números fictícios". CNPJs usam a raiz `99…`,
   a UF da chave de acesso é `91` (código inexistente) e o QR/consulta aponta para uma URL fictícia.
2. **O que vem do SDK é marcado `SDK`; o que é derivado ou simulado é marcado `SIM`** (na
   especificação e, discretamente, nos tooltips da interface). Valores simulados são
   **determinísticos**: o mesmo frete gera sempre os mesmos números.
3. **Papel é papel.** Documentos usam tokens de papel (claro) em todos os temas; a interface em volta
   segue o tema. No contraste, o papel fica `#fff` com tinta `#000`.
4. **Modo DEMO**: documentos são gerados, mas recebem a faixa "DEMO" e **não são persistidos**
   (mesma regra do histórico).

---

## 1. Fontes de dados

### 1.1 Canais do SDK (rev12) — já estão no layout, mas **faltam no adapter**

`server/src/sdk/layouts/rev12.ts` já declara os campos abaixo; `adapters.ts` precisa expô-los no frame
bruto (hoje só mapeia `onJob`, `cargo`, `citySrc/compSrc/cityDst/compDst`, `jobIncome`, `jobMarket`,
`plannedDistanceKm`, `cargoDamage`):

| Grupo | Campos |
|---|---|
| Frete | `cargoId`, `cargoMass`, `unitCount`, `citySrcId`, `compSrcId`, `cityDstId`, `compDstId`, `time_abs_delivery` (prazo), `jobStartingTime`, `jobFinishedTime`, `jobMarket` |
| Entrega | `jobDelivered`, `jobDeliveredRevenue`, `jobDeliveredCargoDamage`, `jobDeliveredDistanceKm`, `jobDeliveredDeliveryTime`, `jobDeliveredEarnedXp`, `jobDeliveredAutoparkUsed`, `jobDeliveredAutoloadUsed` |
| Cancelamento | `jobCancelled`, `jobCancelledPenalty`, `jobFinished` |
| Multa | `fined`, `fineOffence`, `fineAmount` |
| Pedágio | `tollgate`, `tollgatePayAmount` |
| Balsa / trem | `ferry`, `ferrySourceName`, `ferryTargetName`, `ferryPayAmount`, `train`, `trainSourceName`, `trainTargetName`, `trainPayAmount` |
| Abastecimento | `refuel`, `refuelPayed`, `refuelAmount` (litros) |
| Placas | `truckLicensePlate`, `truckLicensePlateCountry(Id)`, reboque `licensePlate`, `licensePlateCountry(Id)` |
| Tempo | `time_abs` (minutos do jogo), `restStop` (min até o descanso exigido pelo jogo) |
| Veículo | `truckBrand`, `truckName`, `truckWheelCount` + `wheel.position` (contagem de eixos para a categoria de pedágio) |

Os eventos de gameplay (`jobDelivered`, `fined`, `tollgate`…) ficam `true` só por um instante.
O servidor faz **detecção de borda de subida** e tira um *snapshot* dos valores no mesmo tick.
Deduplicar por (`tipo`, `time_abs`, valor) para não gerar dois documentos se o flag continuar alto
por vários ticks.

### 1.2 Simulado (`SIM`) — regras determinísticas

| Item | Regra |
|---|---|
| Hash | FNV-1a 32 bits sobre a string-semente → gerador de dígitos (ver `digits()` no mockup) |
| CNPJ | `99` + 6 dígitos de `hash('cnpj:'+empresa+cidade)` + `0001` + 2 DV (pesos oficiais 5…2/6…2) |
| IE | 12 dígitos de `hash('ie:'+nome)`, formato `000.000.000.000` |
| CPF do condutor | 9 dígitos de `hash('cpf:'+nome)` + 2 DV oficiais |
| Nº da NF-e / CT-e / MDF-e | sequenciais por modelo, persistidos (`docs.counters`) |
| Chave de acesso (44) | `cUF 91` + `AAMM` do relógio do jogo + CNPJ emitente + modelo (55/57/58/65) + série 001 + nº (9) + `tpEmis 1` + cNF (8, hash) + DV módulo 11 (pesos 2…9) |
| Protocolo | `991` + AAMM + nº + dígito |
| Razão social | `"{Empresa} Logística"` (emitente) / `"{Empresa} Distribuição"` (destinatário); transportadora = nome em Configurações › Motorista › Transportadora (padrão "TRUCKPULSE TRANSPORTES") |
| Endereço / CEP | tabela fixa por empresa (`shared/docs/companies.ts`), com fallback gerado do hash |
| UF | sigla do país (`FR`, `DE`…), vinda do `cityId` por tabela; fallback `EX` |
| NCM, descrição, CFOP | tabela por `cargoId` (`shared/docs/cargo-tax.ts`), ex.: `dryfruit → 0813.40.90`, CFOP 6.102 (NF-e) / 6.353 (CT-e); fallback `9999.99.99` "MERCADORIA DIVERSA" |
| Valor da mercadoria | `cargoMass × preço/kg` da categoria (mesma tabela); fallback R$ 5,00/kg |
| ICMS | 12 % sobre o valor da mercadoria (NF-e) e sobre o frete (CT-e); CST 000 / 00 |
| Valor do frete | `jobIncome × câmbio` |
| Câmbio | Configurações › Documentos › "1 € = R$ …" (padrão 6,00); o valor original em € sempre aparece em "Dados adicionais" |
| Diesel | Configurações › Documentos › "Preço do diesel R$/L" (padrão 6,19) |
| Concessionária / posto / balsa / órgão autuador | nomes fictícios por país, de uma tabela, mais o hash do local |
| Recebedor | lista de nomes fictícios + "doca N" (hash do frete) |

---

## 2. Modelo de dados e servidor

```ts
// shared/types.ts
type DocType = 'nfe' | 'cte' | 'mdfe' | 'toll' | 'ferry' | 'train' | 'fuel' | 'fine' | 'delivery';
type DocStatus = 'issued' | 'transit' | 'delivered' | 'cancelled' | 'archived';
interface TripDoc {
  id: string; tripId: string; type: DocType; number: number | null; key: string | null; // chave 44
  status: DocStatus; gameTime: number /* time_abs */; createdAt: string /* ISO real */;
  source: 'live' | 'demo';
  data: Record<string, unknown>;          // snapshot dos campos SDK + derivados SIM usados no render
  signature?: { strokes: [number, number, number][][]; signedAt: number } ; // x,y normalizados + largura
  stamps?: { kind: 'received' | 'damage' | 'cancelled'; color: 'blue' | 'red'; rot: number; at: number }[];
}
```

### 2.1 Captura de eventos (servidor)

- **`server/src/managers/gameplayEvents.ts`** (novo): recebe cada frame bruto, guarda o estado anterior
  dos booleanos (`onJob`, `jobDelivered`, `jobCancelled`, `jobFinished`, `fined`, `tollgate`, `ferry`,
  `train`, `refuel`, `refuelPayed`) e emite eventos tipados **só na borda de subida**, já com o snapshot
  dos valores daquele tick (`GameplayEvent = { kind, gameTime: time_abs, payload }`). Dedup:
  ignora o mesmo `kind` com o mesmo `time_abs` e payload idêntico (o flag pode ficar alto por vários
  ticks e o plugin às vezes repete o evento após pausar/despausar).
- Fonte `demo`: o simulador DEMO deve emitir os mesmos eventos (frete, pedágio, abastecimento, multa,
  entrega) para o mockup funcionar sem o jogo — com `source: 'demo'`, nunca persistidos.
- **`server/src/managers/documentManager.ts`** (novo): consome os eventos, aplica a máquina de
  estados do §3, gera números e chaves (`shared/docs/ids.ts`), grava no SQLite e publica no WebSocket.
- **`server/src/managers/dutyManager.ts`** (novo): integra a jornada (§6.1) a cada frame pelo
  `time_abs`, grava segmentos fechados e o disco diário.

### 2.2 Persistência — SQLite (`server/src/db/database.ts`, `node:sqlite`)

Subir `SCHEMA_VERSION` para 3 e acrescentar no `migrate()` (só `CREATE TABLE IF NOT EXISTS`, sem
mexer nas tabelas existentes):

```sql
CREATE TABLE IF NOT EXISTS jobs (               -- um frete do jogo
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER REFERENCES trips(id),
  started_game_min INTEGER NOT NULL,            -- time_abs no onJob ↑
  deadline_game_min INTEGER,                    -- time_abs_delivery
  finished_game_min INTEGER,
  status TEXT NOT NULL,                         -- issued|transit|awaiting_signature|delivered|cancelled|archived
  cargo_id TEXT, cargo TEXT, mass_kg REAL, units INTEGER,
  src_city TEXT, src_company TEXT, dst_city TEXT, dst_company TEXT,
  income_eur INTEGER, planned_km REAL,
  delivered_revenue_eur INTEGER, delivered_damage REAL, delivered_km REAL,
  delivered_time_min INTEGER, earned_xp INTEGER, autopark INTEGER, autoload INTEGER,
  cancel_penalty_eur INTEGER,
  truck_plate TEXT, truck_plate_country TEXT, trailer_plate TEXT, truck_name TEXT,
  rating REAL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER REFERENCES jobs(id),           -- NULL para recibos fora de frete
  type TEXT NOT NULL,                           -- nfe|cte|mdfe|toll|ferry|train|fuel|fine|delivery|tacho
  number INTEGER, access_key TEXT,              -- chave de 44 dígitos (modelos 55/57/58/65)
  status TEXT NOT NULL,
  game_min INTEGER NOT NULL,
  data_json TEXT NOT NULL,                      -- snapshot SDK + valores SIM usados no render
  signature_json TEXT,                          -- traços normalizados [[x,y,w],...][]
  stamps_json TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS documents_job ON documents(job_id);
CREATE INDEX IF NOT EXISTS documents_type ON documents(type, created_at);
CREATE TABLE IF NOT EXISTS doc_counters (model TEXT PRIMARY KEY, next INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS ledger (             -- carteira (§6.3)
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER, document_id INTEGER,
  game_min INTEGER NOT NULL, kind TEXT NOT NULL, -- advance|revenue|toll|ferry|train|fuel|fine|cancel_penalty
  label TEXT NOT NULL, amount_eur REAL NOT NULL, source TEXT NOT NULL,   -- 'sdk' | 'sim'
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS duty_segments (      -- diário de bordo / tacógrafo (§6.1)
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_day INTEGER NOT NULL, state TEXT NOT NULL, -- driving|work|idle|rest
  start_game_min INTEGER NOT NULL, end_game_min INTEGER,
  km REAL NOT NULL DEFAULT 0, place TEXT
);
CREATE TABLE IF NOT EXISTS gameplay_events (    -- log bruto, útil para depurar e reprocessar
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL, game_min INTEGER NOT NULL, payload_json TEXT NOT NULL, created_at INTEGER NOT NULL
);
```

Valores monetários ficam **em €, como o jogo informa**; a conversão para R$ é feita só na
apresentação (o câmbio pode mudar depois sem reescrever documentos — o câmbio usado na emissão vai em
`data_json.fx`, para o documento continuar idêntico). O `/api/export` existente passa a incluir
`jobs`, `documents` e `ledger`.

### 2.3 API (mesmo estilo de `net/server.ts`)

| Método e rota | Uso |
|---|---|
| `GET /api/jobs?limit=&offset=` | fretes com status e totais |
| `GET /api/jobs/current` | frete atual + documentos + stepper |
| `GET /api/docs?job=&type=&from=&to=` | lista da pasta (sem `data_json`) |
| `GET /api/docs/:id` | documento completo para renderizar |
| `POST /api/docs/:id/sign` | `{ strokes }` — exige status `awaiting_signature`; aplica carimbos; responde o documento |
| `GET /api/ledger?job=` | extrato e totais |
| `GET /api/duty?day=` | segmentos do dia + resumo da jornada (contínua, diária, interjornada, `restStop`) |
| `POST /api/checklist/:jobId` | itens manuais marcados |

**WebSocket** (canal existente): mensagens `{type:'doc', doc}` (criado/atualizado),
`{type:'dispatch', event, text, level}` (rádio, §6.2) e `{type:'duty', summary}` (a cada minuto do jogo).

---

## 3. Ciclo de vida (máquina de estados)

| Gatilho (SDK) | Ação |
|---|---|
| `onJob` 0→1 (ou mudança de `jobStartingTime`) | cria **NF-e** (`issued`), **CT-e** e **MDF-e**; logo depois passa para `transit`; despachante "Novo frete" |
| `jobDelivered` ↑ | NF-e → **aguardando assinatura** (no Painel: botão "Entregar e assinar" + toast); grava `jobDelivered*`; cria o **Relatório de entrega**; MDF-e encerrado |
| motorista assina (`POST /sign`) | NF-e → `delivered`; carimbo azul RECEBIDO (data/hora do jogo, doca); se `jobDeliveredCargoDamage > limite` (padrão 5 %, configurável) → segundo carimbo vermelho **AVARIA REGISTRADA x %** |
| sem assinatura após 10 min reais | assina automaticamente com rubrica gerada (o canhoto mostra "assinatura eletrônica automática") |
| `jobCancelled` ↑ | NF-e/CT-e/MDF-e → `cancelled`, carimbo vermelho **CANCELADO** com `jobCancelledPenalty`; lançamento negativo na carteira |
| `tollgate` ↑ | recibo de pedágio (`tollgatePayAmount`, categoria por nº de eixos do conjunto) |
| `ferry` ↑ / `train` ↑ | bilhete (origem, destino, valor) |
| `refuelPayed` ↑ (ou fim de `refuel`) | cupom NFC-e (litros = `refuelAmount`, preço SIM) |
| `fined` ↑ | **auto de infração** (`fineOffence`, `fineAmount`) |
| próximo `onJob` 0→1 | documentos da viagem anterior → `archived` |

Stepper exibido no Painel e no canhoto: **Emitida → Em trânsito → Entregue · assinada → Arquivada**
(ou **Cancelada**, em vermelho).

---

## 4. Documentos (layout)

Componentes React em `web/src/docs/` (um por tipo), todos dentro de `<Paper size="a4|thermal|ticket|carbon">`.

### 4.1 Folha A4 escalável
`container-type: inline-size`; **todas as medidas internas em `cqw`** (1 cqw = 1 % da largura da
folha), `aspect-ratio: 210/297`. A mesma folha fica fiel em 820 px no desktop, em 360 px no celular e em
194 mm na impressão. Caixas com fio de 0,13 cqw, rótulo em Arimo Narrow 1,05 cqw caixa-alta, valor em
Arimo 1,5 cqw. Marca d'água diagonal vermelha a 10 %.

Fontes dos documentos (via `@fontsource`): **Arimo** e **Arimo Narrow** (métrica da Arial, a fonte
usual dos DANFEs), **Courier Prime** (cupons térmicos, chaves), **Caveat** (preenchimento à mão do
talão). Fallbacks: Arial / Arial Narrow / Courier New / Segoe Print.

### 4.2 DANFE (NF-e, modelo 55) — gerada no início do frete
Blocos na ordem do DANFE real (ver mockup): canhoto destacável no topo (pontilhado) → emitente com
logotipo (inicial da empresa em caixa) | quadro DANFE (0-Entrada / 1-Saída = 1, nº, série, folha) |
código de barras **Code 128-C** da chave + chave em grupos de 4 + texto de consulta → natureza da
operação / protocolo → IE / IE ST / CNPJ → **Destinatário** → **Cálculo do imposto** (BC ICMS,
ICMS 12 %, ST 0, total) → **Transportador / volumes** (razão social, frete por conta
"1 - DESTINATÁRIO", ANTT, **placa do cavalo** + país, CNPJ, quantidade/espécie "PALETES", peso
bruto = massa + 600 kg de embalagem, peso líquido = `cargoMass`) → **Produtos** (código = `cargoId`,
descrição da tabela + placa do reboque, NCM, CST 000, CFOP 6.102, KG, quantidade = massa, valor
unitário, total, BC, ICMS, alíquota) → **Dados adicionais** (frete do jogo, origem/destino, distância
planejada, valor em €, câmbio, prazo pelo relógio do jogo, "valores SIMULADOS") → rodapé.

Code 128-C: o mockup tem a implementação completa (`code128c()`, com a tabela oficial de padrões,
início C = 105, checksum módulo 103 e parada). Portar para `web/src/docs/barcode.ts` (sem dependência)
e testar a soma de verificação.

### 4.3 DACTE (CT-e, modelo 57)
Emitente = transportadora (RNTRC SIM); modal RODOVIÁRIO, tipo NORMAL, tomador DESTINATÁRIO, CFOP 6.353;
início/término da prestação; remetente/destinatário; carga (produto predominante, valor, peso);
**componentes do frete** (frete-peso 82 %, ad valorem 8 %, pedágio 6 %, outros 4 % de `jobIncome × câmbio`);
ICMS 12 %; documento originário = chave da NF-e; placas do cavalo e do reboque; previsão de entrega =
`time_abs_delivery`.

### 4.4 DAMDFE (MDF-e, modelo 58)
Código de barras + **QR** (`qrcode-generator`, conteúdo = URL fictícia
`https://truckpulse.local/consulta?chave=…`); UF de carregamento → descarregamento; quantidade de CT-e e
NF-e; peso total; tabela de veículos (cavalo: marca/modelo do SDK, placa, eixos; reboques acoplados);
**condutor** (nome em Configurações; CPF SIM); percurso; chaves vinculadas; seguradora/averbação SIM.

### 4.5 Canhoto de recebimento (assinatura + carimbo)
- Tela de entrega (abre sozinha no `jobDelivered`, como uma folha por cima do Painel; no celular,
  tela cheia): cabeçalho "RECEBEMOS DE … OS PRODUTOS DA NF-E INDICADA", data/hora **do jogo**, recebedor
  (manuscrito, Caveat), **área de assinatura** com linha de base e "✕", avaria registrada, ressalvas.
- **Canvas de assinatura**: Pointer Events (`touch-action: none`), traço em `--ink-pen` (azul de
  caneta), largura variando pela velocidade (dedo/mouse) ou pela pressão (caneta), curvas quadráticas
  entre pontos médios. Os traços são guardados **normalizados (0..1)** — redesenham em qualquer tamanho
  e vão para o servidor como JSON pequeno. Botões de 44 px: "Limpar", "Assinar e entregar".
- **Carimbo** (SVG, não imagem): anel duplo com o nome da empresa e da cidade em `textPath`, centro
  "RECEBIDO" + data e hora do jogo + doca; estrelas laterais. **Tinta irregular** via filtro SVG
  `feTurbulence` (fractal, máscara alfa) + `feDisplacementMap` leve (bordas tremidas). Cores: azul
  `#1f3f9a` (recebido), vermelho `#b3261e` (avaria/cancelado). Rotação aleatória determinística
  (−12° a −4°), posição com pequeno desvio.
- **Animação do carimbo**: `stamp-hit` 420 ms — entra com `scale(2.3)` e rotação maior, bate em
  `scale(.95)`, assenta em `scale(1)` com opacidade de .88; a folha dá um "tranco" de 2 px (180 ms);
  som opcional (oscilador de 140→45 Hz, 160 ms; desligado por padrão, Configurações › Sons). Com
  `prefers-reduced-motion`, o carimbo aparece direto, sem som nem tranco.
- Carimbo **AVARIA REGISTRADA x %** retangular, 800 ms depois do primeiro; **CANCELADO** retangular
  com o valor da multa contratual.

### 4.6 Recibos e cupons
- **Pedágio** (cupom térmico 58 mm, Courier Prime, papel `--paper-thermal`, borda inferior serrilhada
  por `mask` cônica): concessionária, praça, cabine, data/hora do jogo, placa, **categoria pelo nº de
  eixos** (cavalo + reboque), pagamento TAG, total (`tollgatePayAmount × câmbio`), Code 128 do nº.
- **Abastecimento** (DANFE NFC-e, modelo 65): posto, CNPJ/IE, item "ÓLEO DIESEL S10", bomba/bico,
  `refuelAmount` L × preço/L, total, forma de pagamento "CARTÃO FROTA", odômetro do SDK, placa, QR,
  "SEM VALOR FISCAL".
- **Balsa / trem** (bilhete com canhoto lateral picotado): operadora fictícia, **origem → destino do
  SDK**, partida (relógio do jogo), veículo, categoria, valor.

### 4.7 Auto de infração (talão)
Folha em papel-carbono amarelo (`--paper-carbon-1`) com a 2ª via rosa deslocada por baixo, picote
superior, nº do AIT em vermelho, campos preenchidos "à mão" (Caveat, azul de caneta):
placa, marca/modelo, espécie, local ("Rodovia — rota {origem} → {destino}" — o SDK não dá a posição em
texto), data/hora, enquadramento, descrição, gravidade, valor (`fineAmount × câmbio`), medição (só em
excesso de velocidade: velocidade e limite do último frame), condutor, assinaturas do condutor e do
agente, observações.

Tabela `fineOffence → enquadramento` (CTB, plausível, simulado):

| `fineOffence` | Art. | Descrição | Gravidade |
|---|---|---|---|
| `speeding`, `speeding_camera` | 218, I | velocidade superior à máxima permitida | média |
| `red_signal` | 208 | avançar o sinal vermelho | gravíssima |
| `wrong_way` | 186, II | transitar na contramão | gravíssima |
| `no_lights` | 250, I, b | sem luzes acesas | média |
| `crash` | 169 | dirigir sem atenção | leve |
| `avoid_sleeping` | 67-C | descumprir tempo de direção e descanso | grave |
| `avoid_weighing`, `avoid_inspection`, `illegal_border_crossing` | 209 | evadir-se de fiscalização/pesagem | grave |
| `illegal_trailer` | 231, V | reboque em desacordo | grave |
| `hard_shoulder_violation` | 193 | transitar pelo acostamento | gravíssima |
| `damaged_vehicle_usage` | 230, XVIII | veículo em mau estado | grave |
| outros / `generic` | — | infração de trânsito | média |

### 4.8 Pasta de documentos (página **09 Documentos**)
- Desktop: coluna de 260 px com filtros (Todos · Fiscais · Recibos · Multas; chips de 32 px, 44 px no
  toque) e viagens agrupadas (rota + status) com os documentos (ícone de folha com sigla: NF-e, CT-e,
  MDF, PED, NFC, BAL, TRM, AIT); à direita, uma **prancheta** (madeira, prendedor metálico) com o
  documento selecionado. Teclado: setas navegam a lista, Enter abre.
- Celular: lista em tela cheia; tocar abre o documento em tela cheia com pinça para zoom e a barra
  "Imprimir / PDF · Compartilhar" (`navigator.share` com o PDF quando houver).
- **Imprimir / PDF**: `window.print()` com CSS de impressão: `@page { size: A4; margin: 8mm }`, só o
  `.print-root` visível, folha com 194 mm, sem sombras; cupons em 80 mm centralizados. "Exportar todos
  da viagem" imprime uma folha por documento (`break-after: page`).

---

## 5. Pontos de integração

- **Painel**: módulo "Documentos do frete" (P-10, 8 colunas no desktop, depois de Viagem): miniatura da
  folha com o carimbo, rota, números NF-e/CT-e/MDF-e, stepper e botões "Abrir pasta" / "Entregar e
  assinar" (este só aparece após `jobDelivered`).
- **Viagem**: módulo "Jornada do motorista" (§6.1) e "Saldo da viagem" (§6.3); lista de documentos da
  viagem atual.
- **Barra de status**: campo `DOC` ("NF-e EM TRÂNSITO", "ASSINAR ENTREGA" piscando em âmbar).
- **Navegação**: item `09 DOCUMENTOS` no trilho; no celular, dentro de "Mais".
- **Configurações › Documentos**: nome do motorista, transportadora, câmbio € → R$, preço do diesel,
  limite de avaria para o carimbo (5 %), som do carimbo, voz do despachante, assinatura automática
  (liga/desliga e tempo).

---

## 6. Outras funções de imersão (escolhidas)

### 6.1 Diário de bordo, jornada (Lei 13.103) e tacógrafo — **prioridade alta**
- **Estados** a cada tick, pelo relógio do jogo (`time_abs`): *direção* (velocidade > 2 km/h e motor
  ligado), *outros trabalhos* (parado com motor ligado e frete ativo, carga/descarga), *parado*,
  *descanso* (motor desligado ou freio de estacionamento ≥ 15 min do jogo).
- **Regras SIM** (Lei 13.103/2015): no máximo 5 h 30 de direção contínua → 30 min de descanso
  (pode ser fracionado); 8 h de direção por dia + até 2 h extras; 11 h de interjornada. Mostrar junto o
  **`restStop` real do jogo** (o jogo tem a sua própria regra de sono) — os dois relógios lado a lado,
  deixando claro qual é qual.
- UI: escalas "Direção contínua", "Direção no dia", "Interjornada" com marcadores do limite; linha do
  tempo de 24 h; registros (início de jornada, carregamento, direção, pausas) com local = cidade de
  origem/destino ou "rodovia".
- **Disco do tacógrafo** (SVG, papel): 24 h no sentido horário, escala de minutos, traço azul radial da
  velocidade (0–120 km/h → r 70–106), anel de atividade (direção grosso, trabalho médio, descanso fino),
  centro com nome, placa, data e km; ponteiro na hora atual do jogo. Um disco por dia do jogo, arquivado
  na pasta.
- Alertas: AVISO a 5 h 00 de direção contínua, CRIT ao passar de 5 h 30, e o mesmo pelo `restStop`.

### 6.2 Despachante da transportadora (rádio) — **prioridade alta**
Toasts no canto (no celular, acima da barra inferior) com borda esquerda na cor do evento, onda animada
de 3 barras e a hora do jogo; rádio com visor LCD verde-oliva na página Documentos; **voz opcional** via
Web Speech API (`speechSynthesis`, `lang = 'pt-BR'`), desligada por padrão. Respeitar reduced-motion.
Gatilhos (SDK → texto, todos com cooldown):

| Evento | Condição | Texto |
|---|---|---|
| Novo frete | `onJob` ↑ | "Frete confirmado: {carga}, {massa} t para {empresa} em {cidade}. Documentos emitidos." |
| Metade | rota restante ≤ 50 % de `plannedDistanceKm` | "Metade do percurso. Folga de {folga} no prazo." |
| Chegando | `routeDistanceKm` < 25 | "{empresa} avisada: doca {n} reservada." |
| Atraso | `time_abs + ETA > time_abs_delivery` (ETA = rota ÷ média do trip) | "Previsão de atraso de {min}. Quer que eu avise o cliente?" |
| Avaria | `cargoDamage` sobe > 2 pontos | "Registramos avaria de {x} %." |
| Multa | `fined` ↑ | "Recebemos o auto de infração: {descrição}, {valor}." |
| Jornada | direção contínua ≥ 5 h 00 | "Faltam 30 minutos para a parada obrigatória." |
| Combustível | `fuel.reserve` ↑ | "Entrou na reserva. Autonomia de {km} km." |
| Entrega | assinatura | "Entrega confirmada. NF-e {nº} assinada e carimbada." |

### 6.3 Carteira do motorista — **prioridade média**
Extrato por viagem e geral: indicadores (Receitas, Despesas, Resultado, R$/km) e tabela
`hora do jogo · lançamento (com origem SDK/SIM) · documento · valor · saldo`. Entradas:
adiantamento de 50 % na emissão do CT-e (SIM) e saldo na entrega (`jobDeliveredRevenue`); saídas:
pedágio, balsa/trem, combustível (`refuelAmount × preço SIM`), multas (`fineAmount`), multa de
cancelamento (`jobCancelledPenalty`). Tudo convertido pelo câmbio configurado, com o valor em € no
tooltip.

### 6.4 Checklist pré-viagem — **prioridade média**
Abre no `onJob` ↑ (pode ser dispensado). Itens automáticos `[ OK ]/[FALHA]` pelo SDK: freio de
estacionamento, pressão de ar ≥ limite, combustível suficiente para `plannedDistanceKm` (consumo médio
× distância), reboque acoplado, desgaste < 10 %, luzes de posição. Itens manuais (checkbox de 44 px):
documentos na pasta, carga amarrada, disco do tacógrafo, EPI e triângulo. Resultado vai para o diário de
bordo.

### 6.5 Relatório de entrega com avaliação — **prioridade média**
Gerado na entrega. Nota (SIM, determinística) =
`5 − 1,5·(avaria/10 %) − 0,5·multas − 1·(atraso > 0) − 0,5·(jornada violada) + 0,5·(sem autopark)`,
limitada a 1–5, em passos de 0,5; estrelas em `--tp-accent`. Linhas: folga ou atraso
(`jobDeliveredDeliveryTime` × prazo), avaria (`jobDeliveredCargoDamage`), infrações da viagem, jornada,
consumo médio, estacionamento (`jobDeliveredAutoparkUsed`), XP (`jobDeliveredEarnedXp`).

---

## 7. Celular (360–430 px)

- Folhas A4 cabem na largura (por causa do `cqw`); tocar abre em tela cheia com zoom por pinça
  (`touch-action: pinch-zoom` no visualizador).
- Canhoto: tela cheia, a área de assinatura ocupa toda a largura e ~40 % da altura; em paisagem, a
  assinatura fica à esquerda e os dados à direita.
- Toasts acima da barra inferior (`bottom: 72px + safe-area`), largura total menos 16 px.
- Todos os botões e chips com ≥ 44 px; filtros com rolagem horizontal.
- Testado no mockup com a largura real de 390 px (dentro de um iframe).

---

## 8. Dependências

- `qrcode-generator` (MIT, sem dependências) — QR do MDF-e e da NFC-e.
- Code 128: implementação própria (≈ 20 linhas, já no mockup) — sem biblioteca.
- `@fontsource/arimo`, `@fontsource/arimo-narrow` (ou usar Arimo com `font-stretch`, se o pacote
  Narrow não existir, caindo em Arial Narrow), `@fontsource/courier-prime`, `@fontsource/caveat`.
- Nada de geradores de PDF: `window.print()`.

---

## 9. Testes

- `cnpj()`/`cpf()`: DV válidos (algoritmo oficial) e determinismo (mesma entrada → mesma saída).
- `chave()`: 44 dígitos, DV módulo 11, modelo certo por tipo.
- `code128c()`: checksum conhecido para uma chave de exemplo.
- `documentManager`: borda de subida (flag alto por 5 ticks gera 1 documento), transições de status,
  cancelamento, carimbo de avaria acima do limite, modo DEMO não persiste.
- Componentes: `data-status` no canhoto, presença de "SEM VALOR FISCAL" em todos os documentos,
  assinatura serializada normalizada.

---

## 10. Tarefas (ordem sugerida)

1. **Servidor · adapter rev12**: expor os campos do §1.1 no frame bruto e no `TelemetryFrame`
   (`job.*` estendido, `events.*`, placas, `time_abs_delivery`); testes com buffer de fixture.
2. **Servidor · `gameplayEvents.ts`**: borda de subida + dedup + snapshot; eventos equivalentes no
   simulador DEMO; testes (flag alto por 5 ticks → 1 evento).
3. `shared/docs/` (tabelas de carga/NCM/preço, empresas, offences) e `shared/docs/ids.ts` (hash, CNPJ,
   CPF, IE, chave, protocolo, Code 128) com testes.
4. **Servidor · SQLite**: migração para `SCHEMA_VERSION` 3 com `jobs`, `documents`, `doc_counters`,
   `ledger`, `duty_segments`, `gameplay_events` (§2.2); incluir no `/api/export`.
5. **Servidor · `documentManager` e `dutyManager`**: máquina de estados §3, carteira, jornada; rotas
   da API §2.3; mensagens WebSocket `doc`/`dispatch`/`duty`; DEMO não persiste.
6. `web/src/docs/`: `Paper`, `Danfe`, `Dacte`, `Damdfe`, `Thermal*`, `Ticket`, `FineTicket`, `Stamp`,
   `SignaturePad`, `barcode.ts`, `qr.ts`; CSS de impressão.
7. Página **Documentos** (pasta + prancheta + filtros + impressão) e item 09 na navegação.
8. Fluxo de entrega: tela de assinatura, `POST /sign`, carimbos animados, status nos módulos do Painel
   e da Viagem.
9. Jornada / tacógrafo / diário de bordo.
10. Despachante (toasts + rádio + voz opcional).
11. Carteira, checklist e relatório de entrega.
12. Configurações › Documentos; revisão no celular (390 px, retrato e paisagem), nos três temas e na
    impressão.
