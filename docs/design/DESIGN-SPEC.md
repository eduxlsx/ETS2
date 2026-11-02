# TRUCKPULSE — Especificação de design (remodelagem visual)

> Documento para o desenvolvedor. Referências visuais: `docs/design/mockup.html` (desktop + celular),
> `docs/design/trucks/*.svg` (cavalo), `docs/design/trailers/*.svg` (reboques e cargas).
> Nada aqui exige dependência pesada nova. Todos os textos de UI em pt-BR.

---

## 1. Direção: "Instrumento de frota"

O app deixa de parecer um dashboard genérico e passa a parecer **um equipamento de bordo / terminal de
frota**: o tipo de tela que existe num painel de caminhão, num analisador de oficina ou num rack de
instrumentação.

- **Referências reais, não "UI de app"**: mostradores com escala graduada e ponteiro (não arcos grossos com
  brilho), escalas lineares com marcações, quadros de anunciadores (annunciator) para alertas, fita zebrada
  de advertência para o modo DEMO, plaqueta de identificação, contador mecânico do odômetro.
- **Uma cor de acento, com significado**: *laranja de sinalização* (RAL 2009 aproximado). O azul sai do
  chrome da interface; fica somente onde a norma manda (luz alta, ISO 2575).
- **Tipografia com origem**: Barlow / Barlow Condensed (inspirada em placas de rodovia) para texto e
  rótulos; **B612 Mono** (projetada para telas de cockpit da Airbus) para todos os números.
- **Grade rígida e fios finos**: painéis encostados uns nos outros separados por 1 px (como módulos num
  rack), cantos retos, nenhuma sombra, nenhum gradiente decorativo, nenhum glow na interface.
- **Densidade**: rótulos pequenos em caixa-alta, números tabulares alinhados à direita, tabelas com pontilhado
  guia (`Rótulo ........ valor`) como numa ficha técnica.
- **Ícones com parcimônia**: lucide só na barra inferior do celular e em botões de ícone (tela cheia).
  Painéis não têm ícone no título. Os indicadores luminosos continuam com símbolos ISO desenhados à mão.

O que evitar (checklist de revisão): `rounded-xl`/`2xl`, `shadow-*`, `backdrop-blur`, `bg-gradient`,
`.glow`, cards de mesmo tamanho repetidos em grade, ícone ao lado de todo título, texto azul/ciano.

---

## 2. Tokens

### 2.1 Mecanismo de tema (mantido)

`document.documentElement.dataset.theme = settings.theme` continua igual. Os valores continuam
`graphite | midnight | contrast` (não mudar `shared/types.ts`); só mudam os rótulos e as paletas.
Em `web/src/index.css`, substituir os blocos `:root[data-theme=...]` pelos abaixo e manter o
`@theme inline` mapeando `--color-*` → `--tp-*` (acrescentar os tokens novos).

| Token | Uso | Grafite (padrão) | Cabine noturna (`midnight`) | Alto contraste |
|---|---|---|---|---|
| `--tp-bg` | fundo do app / fios entre painéis | `#121211` | `#0a0d12` | `#000000` |
| `--tp-panel` | superfície do painel | `#1a1a18` | `#0f141b` | `#000000` |
| `--tp-panel-2` | elevado (hover, célula ativa, cabeçalho de tabela) | `#22221f` | `#151b24` | `#141414` |
| `--tp-inset` | trilho de escala, janela LCD, campos | `#0e0e0d` | `#070a0e` | `#000000` |
| `--tp-line` | fio 1 px padrão | `#2e2d29` | `#1f2732` | `#5c5c5c` |
| `--tp-line-strong` | régua, borda de controle, solo do desenho | `#45433d` | `#2f3a48` | `#a0a0a0` |
| `--tp-text` | texto principal | `#ebe7de` | `#cdd5df` | `#ffffff` |
| `--tp-muted` | rótulos | `#a19c90` | `#8593a5` | `#d0d0d0` |
| `--tp-dim` | desativado, N/D, marcações menores | `#6b675e` | `#556274` | `#9a9a9a` |
| `--tp-accent` | acento único (ponteiro, item ativo, série principal) | `#ff7a1a` | `#ff9a3c` | `#ff9500` |
| `--tp-accent-ink` | texto sobre o acento | `#121211` | `#0a0d12` | `#000000` |
| `--tp-accent-2` | acento suave (2ª série, hover do acento) | `#ffb066` | `#ffc078` | `#ffc266` |
| `--tp-ok` | normal | `#6fbf5a` | `#5fb87a` | `#3cff6e` |
| `--tp-warn` | atenção | `#f2b600` | `#e8b23a` | `#ffe000` |
| `--tp-crit` | crítico | `#f0412e` | `#e5533d` | `#ff4040` |
| `--tp-info` | **somente** luz alta (ISO azul) | `#4a9dff` | `#5b9cf5` | `#4da3ff` |
| `--tp-glow` | (legado) | `transparent` | `transparent` | `transparent` |

Rótulos no Settings: **Grafite**, **Cabine noturna** (reduz luminância, bom para jogar à noite),
**Alto contraste**. O tema `contrast` também troca `border-width` dos painéis para 1 px `--tp-line-strong`
e deixa os rótulos em `--tp-text`.

Acento × atenção: laranja (`accent`) é "o que é seu / o que está ativo"; âmbar (`warn`) é "atenção".
Nunca usar `accent` para estado. No contraste o âmbar vira amarelo para não colar no laranja.

### 2.2 Tokens dos desenhos (caminhão e reboque)

Definir em `:root` (iguais em todos os temas, exceto onde indicado). Os SVGs de referência já usam esses
nomes com valor de reserva (`var(--truck-plastic,#2b2c2a)`).

| Token | Grafite / Noturno | Contraste | Uso |
|---|---|---|---|
| `--truck-paint` | (por modelo, `vehicle.paint`) | idem | pintura da cabine — aplicar `style={{'--truck-paint': vehicle.paint}}` no `<svg>` |
| `--truck-plastic` / `--truck-plastic-2` | `#2b2c2a` / `#3a3b38` | `#3a3a3a` / `#4a4a4a` | para-choque, para-lamas, espelhos |
| `--truck-rubber` | `#1b1b19` | `#262626` | pneus, para-barros |
| `--truck-outline` | `#4a4944` | `#8a8a8a` | contorno 1 px de pneus e chassi (`.t-out`). **Obrigatório**: sem ele pneus e chassi somem no fundo escuro |
| `--truck-chassis` | `#2a2b28` | `#333333` | longarinas, pórtico, suportes |
| `--truck-metal` / `-dk` / `-lt` | `#8e9196` / `#5d6166` / `#c4c6c9` | idem | tanque, aros, cubos, degraus |
| `--truck-glass` | `#1c2832` | `#22303c` | vidros |
| `--truck-ink` | `#0b0b0a` | `#000` | aberturas, sombras profundas |
| `--lens-clear` / `--lens-amber` / `--lens-red` | `#30353a` / `#4a3110` / `#3e1311` | idem | lente APAGADA (camada de baixo) |
| `--lamp-white` / `--lamp-xenon` | `#f4f1e6` / `#e8f0ff` | idem | luz acesa (lanterna / farol) |
| `--lamp-amber` / `--lamp-red` | `#ffa21a` / `#ff2b1c` | idem | pisca, gabarito / lanterna, freio |
| `--trailer-body`, `--trailer-reefer`, `--trailer-curtain`, `--trailer-alu`, `--trailer-tape` | `#d7dbe0`, `#eceeef`, `#3a5a7c`, `#aeb3b8`, `#e3b000` | idem | carrocerias, faixa refletiva |
| `--cargo-*` (tank, container, wood, wood-end, machine, crate, strap, deck) | ver SVGs | idem | cargas |

Sombreamento = **camadas planas** sobre a pintura: `.t-shade` (preto 16 %), `.t-shade-2` (preto 30 %),
`.t-hi` (branco 13 %), `.t-seam` (fio preto 38 %), `.t-seam-hi` (fio branco 20 %). Assim qualquer cor de
`--truck-paint` ganha volume sem gradiente. Remover os `linearGradient`/`radialGradient` atuais
(`tp-side-shade`, `paint`, `glass`, `chrome`, `lamp`, `high`, `beam`).

### 2.3 Tipografia

Pacotes (offline, funcionam no Electron e no celular via LAN):

```
npm i -w web @fontsource/barlow @fontsource/barlow-condensed @fontsource/b612-mono
```

Em `main.tsx` importar só o necessário (cada peso latin ≈ 15–25 kB):

```ts
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/b612-mono/400.css';
import '@fontsource/b612-mono/700.css';
```

```css
--font-sans: 'Barlow', 'Bahnschrift', 'Segoe UI', system-ui, sans-serif;
--font-cond: 'Barlow Condensed', 'Bahnschrift SemiCondensed', 'Bahnschrift', 'Arial Narrow', sans-serif;
--font-mono: 'B612 Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace;
```

(Bahnschrift vem no Windows 10+ e é um DIN — fallback quase idêntico em espírito.)

| Papel | Família | Peso | Tamanho / altura | Extra |
|---|---|---|---|---|
| Micro-rótulo (`.tp-label`) | cond | 600 | 11 / 14 px | caixa-alta, `letter-spacing: .08em`, `--tp-muted` |
| Título de painel | cond | 600 | 13 / 16 px | caixa-alta, `.1em` |
| Título de página | cond | 600 | 22 / 26 px | caixa-alta, `.04em` |
| Navegação | cond | 500 | 14 / 18 px | caixa-alta, `.06em` |
| Corpo | sans | 400 | 14 / 20 px | |
| Corpo pequeno / notas | sans | 400 | 12 / 17 px | |
| Leitura S | mono | 400 | 15 px | `tabular-nums` (B612 já é mono) |
| Leitura M | mono | 400 | 22 px | |
| Leitura L | mono | 400 | 34 px | |
| Leitura XL (velocidade) | mono | 700 | 44–52 px | dentro da janela LCD |
| Marcha | mono | 700 | 56 px | |
| Unidade | cond | 500 | 12 px | `--tp-muted`, separada 4 px do número |

**Separadores em números**: na B612 Mono a vírgula, o ponto e os dois-pontos ocupam uma célula inteira ("14: 32", "31, 4"). Envolver o separador entre dígitos em `<span class="sep">` com `.sep { display:inline-block; margin: 0 -.24em }` — fazer isso num helper único (ex.: `<Num value="31,4" />` em `ui.tsx`, que aplica a regex `/(d)([,:.])(d)/`). Texto não numérico (carga, cidade) fica em Barlow, nunca em mono. Nos `<text>` de SVG usar `<tspan dx>` em vez de span.

Substituir a classe `.digits` por: `font-family: var(--font-mono); font-variant-numeric: tabular-nums slashed-zero; letter-spacing: 0;`.

### 2.4 Espaço, bordas, raios, sombras

- Base 4 px: `2, 4, 8, 12, 16, 24, 32`. Padding de painel **12 px** (desktop) / **10 px** (celular).
- Cabeçalho de painel: altura 32 px, padding-x 12, fio inferior `--tp-line`.
- Fios: 1 px sempre. Régua/borda de controle: `--tp-line-strong`.
- Raios: **0** em painéis, tabelas, barras; **2 px** em botões, inputs, badges; círculo só na placa de
  limite de velocidade (é uma placa real) e nos mostradores.
- Sombras: **nenhuma**. Modal: fundo `rgb(0 0 0 / .6)` sem blur, janela com 1 px `--tp-line-strong`.
- Foco: `outline: 2px solid var(--tp-accent); outline-offset: 1px` em todo controle (`:focus-visible`).

### 2.5 Padrões utilitários (CSS global novo)

```css
.tp-label { font: 600 11px/14px var(--font-cond); text-transform: uppercase; letter-spacing: .08em; color: var(--tp-muted); }
.tp-hatch { background-image: repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in srgb, var(--tp-dim) 18%, transparent) 6px 7px); }
.tp-tape  { background: repeating-linear-gradient(135deg, var(--tp-warn) 0 10px, #111 10px 20px); }
.tp-leader { flex: 1; border-bottom: 1px dotted var(--tp-line-strong); margin: 0 6px 4px; }
```
(`.tp-hatch` e `.tp-tape` são padrões de listras para "sem sinal" e "DEMO" — não são gradientes de cor.)

---

## 3. Shell do app (`App.tsx`)

### 3.1 Desktop (≥ 1024 px)

```
┌────────────┬────────────────────────────────────────────────────────────────────┐
│ TRUCKPULSE │ LINK ■ CONECTADO │ FONTE AO VIVO │ DIRIGINDO │ HORA DO JOGO TER 14:32 │ [MODO DEMO] [⤢] │  ← barra de status 40 px
│            ├────────────────────────────────────────────────────────────────────┤
│ 01 PAINEL  │ ▨▨▨ fita DEMO (só no modo demo) ▨▨▨                                │
│ 02 CAMINHÃO│ [CRIT] Pressão de ar baixa  [AVISO] Reserva …   ← anunciadores     │
│ 03 VIAGEM  ├────────────────────────────────────────────────────────────────────┤
│ 04 REBOQUE │                                                                    │
│ 05 MANUT.  │                     conteúdo (grade de painéis)                    │
│ 06 HISTÓR. │                                                                    │
│ ────────── │                                                                    │
│ 07 CONFIG. │                                                                    │
│ 08 DIAGN.  │                                                                    │
│ v1.0 · LAN │                                                                    │
└────────────┴────────────────────────────────────────────────────────────────────┘
```

- **Trilho lateral** 184 px (≥ 1280) ou 64 px (1024–1279, só os números "01"…"08" + tooltip).
  Fundo `--tp-panel`, fio direito `--tp-line`. Topo: marca "TRUCKPULSE" em cond 600 16 px,
  `PULSE` em `--tp-accent`, com o sinal de pulso do logo atual (traço reto, `stroke-linecap: square`).
- Item de navegação: altura 40 px, número em mono 11 px `--tp-dim`, rótulo cond 14 px caixa-alta.
  Ativo: barra 3 px `--tp-accent` à esquerda, fundo `--tp-panel-2`, texto `--tp-text`.
  Hover: texto `--tp-text`. Sem ícones. Atalhos de teclado `Alt+1`…`Alt+8` (dica no `title`).
  Configurações e Diagnóstico separados por um fio (são "sistema").
- Rodapé do trilho: versão e, se `/api/network` tiver `lanEnabled`, "LAN ATIVA" em micro-rótulo.
- **Barra de status** (substitui o header): campos separados por fios verticais, cada um
  `rótulo micro + valor`. LED quadrado 6×6 (não bolinha):
  - `LINK` — `ConnectionStatus`: verde CONECTADO, âmbar AGUARDANDO SDK / SEM ATUALIZAÇÃO, vermelho
    SERVIDOR OFFLINE / PLUGIN AUSENTE, `--tp-dim` JOGO FECHADO. LED pisca (1 Hz, `steps(2)`) só em
    "Conectando…".
  - `FONTE` — AO VIVO (texto) ou DEMO (fundo `--tp-warn`, texto `#111`).
  - `ATIVIDADE` — `ACTIVITY` atual (oculto se vazio).
  - `HORA DO JOGO` — `GameClock` em mono.
  - À direita: botão `ModeSwitch` (borda 1 px; no demo vira preenchido âmbar "SAIR DO DEMO") e
    `FullscreenButton` (ícone lucide 16 px, 32×32).
- **Fita DEMO** (`data-testid="demo-banner"`, mesmo texto atual): faixa 4 px `.tp-tape` + linha de texto
  cond 12 px caixa-alta `--tp-warn` sobre `--tp-panel`. Entra com altura 0→auto em 160 ms.
- **Conteúdo**: `main` com padding 0; cada página monta uma grade com `gap: 1px; background: var(--tp-line)`
  e painéis `bg-panel` — os fios entre painéis são o próprio fundo vazando. Margem externa 0 no desktop
  (o conteúdo encosta no trilho e na barra; a grade é o "rack").

### 3.2 Celular (360–430 px; o app é aberto pelo IP da rede local)

- **Barra superior compacta** 44 px: marca (só "TP" + pulso), LED de LINK com rótulo curto
  (`AO VIVO` / `DEMO` / `OFFLINE`), hora do jogo, botão `⋯` (abre folha com Modo DEMO / tela cheia).
- **Barra inferior fixa** 56 px + `env(safe-area-inset-bottom)`: 5 alvos de 56×56 (≥ 44 px):
  **Painel, Caminhão, Viagem, Reboque, Mais**. "Mais" abre uma folha (bottom sheet, cantos 0, fio
  superior `--tp-line-strong`) com Manutenção, Histórico, Configurações, Diagnóstico em linhas de 52 px.
  Ícone lucide 20 px `strokeWidth 1.5` + rótulo cond 11 px caixa-alta. Ativo: barra 2 px `--tp-accent`
  no TOPO do item e texto `--tp-text`.
- `viewport`: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
  `<meta name="theme-color" content="#121211">`; evitar `100vh` → usar `100dvh`.
- Toque: todo alvo ≥ 44×44 px (botões de alternância LATERAL/FRONTAL, abas, chips de alerta, linhas de
  tabela clicáveis). Sem hover como única pista.
- Paisagem (altura < 500 px): barra inferior vira trilho lateral de 56 px à esquerda (só ícones);
  dashboard passa a 2 colunas (ver §5.1).

### 3.3 Breakpoints

| Nome | Largura | Navegação | Grade do painel |
|---|---|---|---|
| `xs` | < 480 | barra inferior | 1 coluna |
| `sm` | 480–767 / celular paisagem | trilho 56 px (paisagem) ou barra inferior | 2 colunas |
| `md` | 768–1023 | barra inferior (tablet) | 6 colunas |
| `lg` | 1024–1279 | trilho 64 px | 12 colunas |
| `xl` | ≥ 1280 | trilho 184 px | 12 colunas |

---

## 4. Componentes

Preservar **todos** os `data-testid`, `data-state`, `data-lamp`, `data-part`, `data-model`, `data-type`,
`data-level`, classes `tp-lamp`/`tp-beam`/`tp-beacon`/`on`/`dim`, os textos verificados nos testes
(`N/D`, `Ligado`, `Desligado`, `Estágio: N/D …`, `reduzido`, `máximo`, `Sem dados`) e as classes `bg-*`
de tom do `Meter` (o teste procura `.bg-accent`).

### 4.1 `ui.tsx`

- **`Card` → visual de "módulo"** (manter o nome/export `Card` para não mexer em todas as páginas):
  `section` sem raio, sem sombra, `bg-panel`. Cabeçalho 32 px: título `.tp-label` 13 px em `--tp-text`
  à esquerda; opcionalmente um **código** em mono 10 px `--tp-dim` à direita do título (prop nova
  opcional `code`, ex. "P-01"); `action` à direita. A prop `icon` continua aceita, **mas não é
  renderizada** (remover os imports de ícone das páginas na limpeza). Corpo: padding 12.
- **`Stat`**: rótulo `.tp-label`; valor mono (S = 15 px, `big` = 34 px); unidade cond 12 px `--tp-muted`.
  N/D: texto "N/D" em `--tp-dim` com sublinhado pontilhado (indica que há explicação no `title`).
  `hint` em 11 px `--tp-dim`.
- **`Meter` → escala linear graduada**:
  - trilho 8 px `--tp-inset` com borda 1 px `--tp-line`, raio 0;
  - preenchimento com a classe de tom (`bg-ok`, `bg-warn`…), animação de largura 250 ms linear
    (0 ms com reduced-motion);
  - abaixo do trilho, régua de 5 marcações (0/25/50/75/100 %) de 3 px em `--tp-line-strong`;
  - `markers`: fio 1 px `--tp-text` atravessando o trilho + triângulo 5 px apontando para baixo acima;
  - linha de cima: rótulo `.tp-label` à esquerda, valor mono 13 px à direita;
  - prop nova opcional `segments?: number` → barra segmentada (ex.: 20 segmentos de 1 px de fresta), usada
    no combustível. Segmentos apagados em `--tp-panel-2`.
- **`Badge`**: raio 2, borda 1 px, cond 600 11 px caixa-alta, LED quadrado 6×6 à esquerda quando `pulse`
  (pisca 1 Hz `steps(2)`; parado com reduced-motion). Fundos: tom a 12 % (`bg-ok/12`).
- **`Row`**: `rótulo  ··········  valor` — usar `.tp-leader` entre os dois; valor mono 13 px alinhado à
  direita; sem fio inferior.
- **`Limitation`**: bloco "NOTA" — fio esquerdo 2 px `--tp-line-strong`, micro-rótulo "NOTA" + texto 12 px
  `--tp-muted`, sem fundo.
- **`wearTone`** inalterado.

### 4.2 `Gauge.tsx` — mostrador com ponteiro

Manter a API (`value, max, zones, marker, ticks, label, center, size, testId`) e o
`data-testid="gauge-marker"`.

- Varredura **250°**: `START = -125`, `SWEEP = 250` (a abertura de 110° fica embaixo, onde vai o LCD).
- Escala: marcações maiores a cada `max/ticks` (r 104→93, 1.5 px `--tp-text`), menores 4 por intervalo
  (r 104→99, 1 px `--tp-dim`). Numerais mono 11 px `--tp-muted` em r 80.
- Faixas (`zones`): banda de 5 px em r 108–113 (fora da escala). `--tp-warn` sólido; zona vermelha
  (redline RPM) `--tp-crit`.
- Trilho de valor: arco 3 px em r 90, `--tp-line`; valor em `--tp-accent` (substitui o arco grosso com
  gradiente; remover `tp-gauge-grad` e `.glow`).
- **Ponteiro**: linha 2.5 px `--tp-accent` de r −14 a r 100, cubo r 7 `--tp-panel-2` com anel 1 px
  `--tp-line-strong` e centro r 2 `--tp-accent`. Gira via `motion.g` `rotate` (tween 150 ms linear;
  0 ms com reduced-motion). Sem valor: ponteiro em `--tp-dim` repousando no início.
- Marcador (limite da via): triângulo `--tp-crit` com ponta para dentro em r 114→104 + fio até r 93.
- `center` passa a ser renderizado numa **janela LCD** abaixo do cubo: retângulo `--tp-inset` com fio
  `--tp-line`, centrado em x, topo a 60 % da altura, largura 46 % do mostrador. Velocidade mono 700
  ~44 px; unidade e "ACIMA DO LIMITE" abaixo da janela (cond 11 px).

### 4.3 `Telltales.tsx`

- Manter o conjunto `ICONS` (símbolos ISO). Trocar: cor `blue` → `var(--tp-info)` (não o acento).
- Célula: 56×56 (desktop) / 48×48 (celular, mínimo 44), sem raio, borda 1 px `--tp-line`; células
  encostadas formam uma **régua de indicadores** (como o cluster real).
  - aceso: símbolo na cor ISO, fundo da célula = cor a 12 %, sem drop-shadow;
  - apagado: símbolo `--tp-dim` a 45 %;
  - N/D: símbolo `--tp-dim` a 20 % + "N/D" mono 9 px no canto.
- Rótulo abaixo do símbolo em cond 10 px caixa-alta; `detail` em mono 9 px.
- Manter `data-testid="telltale-<icon>"`, `data-state`, `aria-label`, textos de `detail`.
- `LightingPanel` vira uma faixa de 12 células (`grid-cols-6` no celular → 2 linhas; `grid-cols-12` no xl).

### 4.4 `Widgets.tsx`

- `SpeedLimitSign`: mantém a placa real (círculo branco, anel `--tp-crit`); número em
  **Barlow Condensed 600** (DIN de placa), não mono.
- `AlertsBar` → **anunciadores**: cada alerta é um retângulo com bloco de código à esquerda (`CRIT`,
  `AVISO`, `INFO` em cond 600 11 px, fundo da cor do nível, texto `--tp-accent-ink`) + mensagem 13 px.
  Borda 1 px na cor do nível; fundo a 10 %. Crítico pisca a borda 2× ao aparecer e fica fixo. INFO usa
  `--tp-muted` (não azul). Sem ícone. Em fila horizontal com rolagem no celular.
- `EnvironmentCard`: tabela com pontilhado guia; nota de limitação no formato "NOTA".
- `NoDataNotice`: painel "SEM SINAL" — fundo `.tp-hatch`, título cond 600 16 px, mensagem e ação
  "Abrir diagnóstico" / "Ativar DEMO" como botões de texto.

### 4.5 `WiperIndicator.tsx`

Esquema técnico: contorno do para-brisa em fio 1.5 px `--tp-line-strong` sem preenchimento; braços em
`--tp-text` 2 px com palheta 4 px; ligado → palheta `--tp-accent`. Remover o rastro com brilho.
Animação 1.4 s (sem animação com reduced-motion — palhetas paradas a meio curso). Manter
`data-testid`, `data-state`, "Ligado/Desligado/N/D" e "Estágio: N/D (SDK só informa liga/desliga)".

### 4.6 `Charts.tsx`

- Sem `linearGradient`: área com `fillOpacity={0.10}` da cor da série; linha 1.5 px.
- Grade: só horizontais, fio sólido `--tp-line` (sem tracejado); eixo X com marcações 3 px.
- Fontes dos eixos: mono 10 px `--tp-dim`.
- Tooltip: `--tp-panel-2`, borda 1 px `--tp-line-strong`, raio 0, mono 12 px.
- Série "Limite": `--tp-crit`, tracejado `4 3`, `stepAfter`.
- Cores das séries: velocidade `--tp-accent`; combustível `--tp-ok`; consumo `--tp-accent-2`;
  suspensão cavalo `--tp-accent` / reboque `--tp-muted`.
- Estado vazio: retângulo `.tp-hatch` com texto 12 px `--tp-dim` (mesmo texto atual).

### 4.7 `VehicleView.tsx`

- Cabeçalho: nome do modelo em cond 600 15 px + plaqueta de origem (`AUTO` / `MANUAL` / `APROXIMADO`)
  como `Badge`. Alternância `LATERAL | FRONTAL` como controle segmentado de 2 botões (32 px de altura no
  desktop, 44 px no celular), ativo = `--tp-panel-2` + sublinhado 2 px `--tp-accent`.
- Fundo do desenho: `--tp-panel` com **solo** (`--tp-line-strong`) e uma régua métrica discreta sob o
  solo (marcação a cada 1 m, `--tp-line`) — reforça a leitura de "desenho técnico".
- Nota de rodapé em 11 px `--tp-dim` (mesmo texto).

---

## 5. Páginas

### 5.1 Painel (`Dashboard.tsx`) — ver `mockup.html`

Desktop (12 colunas, fios de 1 px):

| Linha | Conteúdo |
|---|---|
| A | **Cluster** (8 col): régua de 12 indicadores no topo; abaixo, mostrador de velocidade · coluna central (marcha grande, placa de limite, piloto automático, média, máx. config.) · mostrador de RPM; rodapé com 3 indicadores do motor (freio motor, retarder, freio estacionário). **Combustível** (4 col): barra segmentada de 20, %, litros/capacidade, autonomia, AdBlue, consumo médio e do trip. |
| B | **Veículo** (8 col): `VehicleView` grande (lateral) com reboque. **Motor** (4 col): 5 escalas lineares (água, óleo, pressão do óleo, ar dos freios, bateria) com marcadores de limite. |
| C | **Velocidade × limite** (8 col, 200 px). **Viagem** (4 col): trip em contador mecânico + tabela pontilhada (tempo, odômetro, sessão, combustível usado, vel. máx.; entrega quando houver). |
| D | **Ambiente** (5 col) · **Limpadores** (3 col) · **Consumo** (4 col). |

Celular (1 coluna, ordem por prioridade de quem dirige):
1. **Faixa principal** (sem cabeçalho de painel): velocidade grande mono 64 px + unidade, à direita a
   placa de limite 56 px; abaixo marcha (mono 36 px) | RPM (mono 22 px) | piloto automático.
2. Régua de indicadores 6×2 (células 48 px).
3. Combustível (barra segmentada + % + autonomia).
4. Motor (escalas lineares).
5. Veículo (lateral; desenho ocupa 100 % da largura, alternância 44 px).
6. Viagem, gráficos (altura 160 px), ambiente, limpadores.
Os mostradores circulares **não** aparecem em `xs` (ocupariam a tela inteira); voltam em `sm` paisagem
lado a lado (2 colunas: mostradores | indicadores + combustível).

### 5.2 Caminhão (`TruckPage.tsx`)
`VehicleView` grande (lateral/frontal) ocupando 8 col × 2 linhas; à direita "Identificação" (tabela
pontilhada, plaqueta com `truck.id` em mono) e "Iluminação" (`LightingPanel` completo). Abaixo
"Suspensão e eixos": escalas por eixo + gráfico; "Rodas" em tabela densa (cabeçalho `--tp-panel-2`,
números à direita, linha 28 px, hover `--tp-panel-2`).

### 5.3 Viagem (`Trip.tsx`)
"Trip atual" com o **contador mecânico**: dígitos mono 34 px em células 26×40 com fio entre células,
último dígito (decimal) em célula invertida (`--tp-text` fundo, `--tp-bg` texto) — como odômetro
analógico. Botão "ZERAR TRIP" com confirmação inline (mesmo texto atual). Quilometragem, Entrega atual
(rota restante como escala linear), gráfico de consumo.

### 5.4 Reboque (`Trailer.tsx`)
Desenho lateral do reboque (novo catálogo, §7) em largura total; plaqueta com tipo e origem da
identificação ("AUTO" / "MANUAL"). Desgaste do reboque como escalas com limites; suspensão do reboque.

### 5.5 Manutenção (`Maintenance.tsx`)
Lista de componentes (motor, transmissão, cabine, chassi, rodas, reboque…) em linhas de 44 px:
nome · escala linear com marcadores em `limite` e `2×limite` (de `settings`) · % mono · estado
(`OK` / `ATENÇÃO` / `CRÍTICO` em badge). "Estado geral" no topo como número grande mono.

### 5.6 Histórico (`History.tsx`)
Resumo geral como faixa de 4–6 `Stat` em linha; gráficos de 24 h lado a lado; "Registros" em tabela
densa com cabeçalho fixo, datas mono, filtro como controle segmentado.

### 5.7 Diagnóstico (`Diagnostics.tsx`)
Formato de **relatório de teste**: cada verificação numa linha `[ OK ]` / `[FALHA]` / `[ -- ]` (mono,
cor do estado) + descrição + detalhe `--tp-muted`. Instalação do plugin como passos numerados 1–n com
caminho em bloco mono `--tp-inset`. "Canais do SDK utilizados" em tabela mono.

### 5.8 Configurações (`Settings.tsx`)
- Layout de formulário em duas colunas (rótulo 220 px | controle), seções com título `.tp-label` e fio.
- Inputs/selects: altura 32 (44 no celular), `--tp-inset`, borda 1 px `--tp-line-strong`, raio 2.
- **Tema**: trocar o `<select>` por 3 cartões-amostra (radio group, 1 linha) com uma tira das cores do
  tema (bg/panel/accent/ok/warn/crit) e o nome; selecionado = borda 2 px `--tp-accent`.
- **Novo painel "Acessar pelo celular"** (seção própria, logo após Aparência):
  - lê `GET /api/network` (já existe: `{ lanEnabled, urls[] }`);
  - se `lanEnabled` e houver URL: mostra o endereço principal `http://<IP>:5170` em mono 18 px com
    botão "COPIAR", outros IPs em lista menor, e um **QR code** 160×160 (módulos `--tp-text` sobre
    `--tp-panel`, margem de 4 módulos; no tema contraste preto sobre branco para leitura garantida);
  - texto: "Conecte o celular na mesma rede Wi-Fi e aponte a câmera para o código.";
  - se `lanEnabled` for falso: estado "ACESSO PELA REDE DESATIVADO" + instrução de como ativar
    (servidor em `0.0.0.0`) e aviso do firewall do Windows;
  - QR: usar `qrcode-generator` (MIT, sem dependências, ~20 kB) gerando SVG (`qr.createSvgTag` ou
    percorrer `qr.getModuleCount()`/`isDark` e desenhar `<rect>`s — preferível, para usar as variáveis
    CSS). Não usar serviço externo (app offline).
- Trip, Alertas, Veículo, Velocidade, Unidades: mesmos campos, novo visual.

### 5.9 Assistente (`SetupWizard.tsx`)
Janela 720 px, raio 0, fio `--tp-line-strong`, sem blur/scale. Coluna esquerda 200 px com os 5 passos
numerados (01 Boas-vindas … 05 Pronto) — atual em `--tp-accent`, concluídos com "✓" mono; conteúdo à
direita. Status do plugin como linhas `[ OK ]`/`[FALHA]` (substitui os ícones `CheckCircle2` etc.).
Botões no rodapé: "VOLTAR" (texto) e "AVANÇAR"/"CONCLUIR" (preenchido `--tp-accent`, texto
`--tp-accent-ink`). Celular: tela cheia, passos viram "PASSO 2/5" no topo.

---

## 6. Estados

| Estado | Tratamento |
|---|---|
| OK / AVISO / CRÍTICO | cor `--tp-ok` / `--tp-warn` / `--tp-crit` **sempre com texto** (nunca só cor). Crítico: valor em `--tp-crit` + anunciador. |
| N/D | "N/D" em `--tp-dim`, sublinhado pontilhado, `title` explicando. Escalas sem preenchimento; ponteiro em repouso e `--tp-dim`. |
| Desconectado / sem dados | `NoDataNotice` em `.tp-hatch` no topo; LINK vermelho; números N/D. Painéis continuam visíveis (o layout não pula). |
| Servidor offline | LINK "SERVIDOR OFFLINE" vermelho, LED piscando; conteúdo esmaecido a 50 % com `pointer-events` normais. |
| DEMO | fita zebrada + campo FONTE âmbar; nada de cor diferente nos dados. |
| Hover / ativo | `--tp-panel-2`; nunca escala ou sombra. |
| Desabilitado | `--tp-dim`, borda `--tp-line`. |

---

## 7. Desenhos dos veículos

### 7.1 Arquivos de referência

| Arquivo | Conteúdo |
|---|---|
| `trucks/side-4x2.svg` | cavalo cab-over 4x2, lateral esquerda, 100 px = 1 m, frente à direita, com cotas |
| `trucks/side-6x2.svg` | mesmo cavalo 6x2 com eixo auxiliar (tag) e contorno tracejado do eixo erguido |
| `trucks/front-master.svg` | frontal mestre 300×410 (mesma caixa do `TruckFront.tsx`), 96 px = 1 m |
| `trucks/front-families.svg` | folha com as 6 famílias (grade, faróis, teto, para-sol) |
| `trailers/<tipo>.svg` | 12 reboques/cargas laterais, 100 px = 1 m (mesma escala do cavalo) |
| `trailers/overview.svg` | folha de contato com os 12 |

As coordenadas estão nos `<desc>` de cada arquivo (`x = 680 − 100·m`, `y = 400 − 100·h` no cavalo;
`x = 1400 − 100·m` no reboque). O `TruckSide.tsx` usa `S = 26 px/m` — basta trocar as constantes
desenhadas por `X(m)`/`Y(h)` existentes: todos os pontos dos SVGs foram escolhidos em metros "redondos"
justamente para portar como `c(m, h)`.

### 7.2 Ganchos que NÃO mudam (testes)

Lateral: `data-testid="truck-side"`, `data-model`, `truck-axle-N`, `trailer-axle-N`, `trailer-side` +
`data-type`, `data-part="shock"` com `<text>` = deflexão real em mm, `data-part="cab|chassis|roof-bar|tail"`.
Luzes (`data-lamp`): `lowBeam`, `parking`, `blinker-left-front`, `blinker-left-side`, `blinker-left-rear`,
`auxFront`, `auxRoof`, `beacon` (+ classe `tp-beacon`), `clearance`, `tail`, `brake`, `reverse`,
`side-marker`; feixes `beam-low`, `beam-high`, `beam-aux`, `beam-roof` (classe `tp-beam`, `on`/`dim`).
Frontal: `truck-front`, `lowBeam`, `highBeam`, `parking`, `blinker-left`, `blinker-right`, `auxFront`
(+`data-level`), `auxRoof` (+`data-level`), `beacon`, `clearance`, `beam`, `wipers` (classe `on`).
O farol do **lado esquerdo do caminhão** fica no `<g transform="translate(R−inset y) scale(-1 1)">`
(o teste checa `scale(-1 1)` no `closest('g')`).

### 7.3 Construção das luzes (novo padrão)

Cada luz = **duas camadas**: a lente apagada (`.t-lens-*`, sem data-lamp) e por cima o elemento aceso
(`.t-lit-* tp-lamp [on]`, com `data-lamp`). CSS:

```css
.tp-lamp { opacity: .12; transition: opacity 120ms linear; }   /* era .18 sem lente */
.tp-lamp.on { opacity: 1; }
.tp-lamp.on.t-lit-amber { filter: drop-shadow(0 0 3px var(--lamp-amber)); }
.tp-lamp.on.t-lit-red   { filter: drop-shadow(0 0 3px var(--lamp-red)); }
@keyframes tp-beacon { 0%, 49% { opacity: 1 } 50%, 100% { opacity: .15 } }  /* pisca seco, 2 fases */
.tp-beacon.on { animation: tp-beacon .6s steps(1) infinite; }
@media (prefers-reduced-motion: reduce) { .tp-beacon.on { animation: none; } }
```
O brilho (drop-shadow ≤ 3 px) é permitido **só** em luzes acesas — é luz de verdade, não enfeite de UI.
Lanterna × freio: lanterna acesa com `style={{opacity:.55}}`; freio a 1 (como hoje). Feixes: 2 faixas
planas sobrepostas (8–12 % de opacidade) em vez de gradiente.

Neblina: o SDK não tem canal de farol de neblina; os faróis inferiores do para-choque são o `auxFront`
(rotular "Aux. dianteiro / neblina" no tooltip). Ré: `reverse` (traseira). Teto: `auxRoof` (barra com 4).

### 7.4 Anatomia (o que o novo desenho tem e o atual não)

Lateral: para-choque em plástico com lábio, farol de canto com lanterna em faixa, repetidor lateral,
para-lama dianteiro com caixa de 3 degraus e para-barro, porta com janela de recorte baixo, maçaneta e
alça, vinco lateral com sombra plana abaixo, tomada de ar, bagageiro, colarinho traseiro, espelho
principal + grande-angular, para-sol, barra de teto, giroflex, pórtico com mangueiras (vermelha
emergência / amarela serviço / preta elétrica), passarela, quinta-roda com alavanca, caixa de baterias,
AdBlue (tampa azul), tanque com cintas e bocal, longarina furada, para-lama traseiro e para-barro, rodas
com pneu de banda marcada, aro com 10 furos, porcas e cubo (traseiro com cubo de redução).
Frontal: teto com plano claro, defletores de coluna, para-brisa com interior insinuado (encostos,
volante do lado do motorista), espelho de meio-fio, 5 gabaritos, barra com 4 auxiliares, 2 giroflex,
limpadores com pivô, grade por família, para-choque com entrada de ar, placa UE, gancho, auxiliares
circulares, pneus com 3 sulcos e lamelas.

### 7.5 Eixos (4x2 / 6x2 / 6x4)

Os eixos vêm de `groupAxles(suspension.truckWheels)`. Regras de desenho:
- primeiro grupo = dianteiro (`#s-wheel-front`); grupos com `powered` = tração (`#s-wheel-drive`, rodado
  duplo); demais = auxiliar (roda simples). 6x4: dois de tração.
- eixo erguido (`lift > 0.5`): sobe 0,22 m (já existe) + contorno tracejado da posição no chão.
- 6x2/6x4: para-lama em ponte cobrindo os dois eixos; quinta-roda centrada a 0,25 m à frente do centro
  do conjunto traseiro (já é a regra `kingpin = rearCenter − 0.25`); chassi termina 1,0 m após o último
  eixo.

---

## 8. Variações por modelo (`models/*.ts`)

`SideProfile`/`FrontProfile` continuam sendo a fonte. Ajustes recomendados de valores (frontal na
escala nova de 96 px/m, solo y = 400 — hoje a parte de baixo está comprimida):

| Modelo | Teto lateral (m) | `front.roofY` | Para-brisa (top/bottom) | Para-sol | Grade | Farol (forma, y) |
|---|---|---|---|---|---|---|
| Scania R | 3,75 | 38 | 82 / 194 | sim | `horizontal-bars` 6, retângulo alto 64–236 × 206–292, faixa de logo no topo | `scania-r` no para-choque, y 300 |
| Scania S | 3,98 (piso plano) | 22 | 66 / 188 | sim | idem, 7 lamelas, topo 200 | `scania-s` com DRL em L, y 300 |
| Volvo FH3 | 3,70 | 40 | 84 / 192 | sim | `diagonal`, trapézio 76–224 × 204–262 | `volvo-fh3` retangular com recorte, y 250 |
| Volvo FH4 | 3,80 | 30 | 74 / 190 (cantos r 12) | não | `diagonal` + aro do emblema | `volvo-fh4` bumerangue, y 248 |
| Volvo FH5 | 3,85 (teto em degrau) | 28 | 72 / 190 | não | `diagonal`, grade mais larga 70–230 | `volvo-fh5` bumerangue + DRL "martelo" |
| DAF XF | 3,85 | 34 | 78 / 192 | sim | `mesh` colmeia, trapézio 60–240 / 72–228, barra cromada no topo | `daf-xf` angular, y 300 |
| DAF XG | 4,02 | 14 | 58 / 196 (desce mais) | não | `mesh` com barras horizontais | `daf-xg` fino, y 296 |
| Actros (MP3/MP5) | 3,88 | 32 | 76 / 190 | não | `horizontal-bars` 4 lamelas, emblema circular grande | `actros`, y 292 |
| Actros MP4 | 3,90 | 32 | 76 / 190 | não | `wide-bars` 3 barras grossas + emblema | `actros-mp4` com "sobrancelha" de DRL, y 290 |
| VW Meteor | 3,78 (degrau) | 30 | 78 / 192 | sim | `wide-bars` 4 barras grossas + emblema circular liso | `meteor` retangular, y 298 |
| Genérico | 3,70 | 42 | 86 / 194 | não | `horizontal-bars` 5 finas | `generic` retângulo arredondado |

Os emblemas são **círculos lisos** e os logotipos são texto genérico (como já é hoje) — não reproduzir
marcas registradas. As formas exatas de grade/farol estão em `front-families.svg` (ids `hl-scania`,
`hl-volvo`, `hl-daf`, `hl-mb`, `hl-vw`, `hl-gen`) para portar para `headlightPath()`.
Novo campo opcional sugerido: `front.signature?: string` (path do DRL desenhado sobre o farol, classe
`parking`), para que as assinaturas em L / martelo / sobrancelha acendam com a lanterna.

---

## 9. Reboques e cargas

### 9.1 Novos tipos

Ampliar `TrailerModelKey` (em `shared/vehicles.ts`, `shared/types.ts → trailerModel`,
`settingsService.ts` `pick(...)`, select de Configurações, `TruckSide.trailerBody`):

```ts
export type TrailerModelKey =
  | 'box' | 'curtain' | 'reefer' | 'tanker' | 'flatbed'          // existentes, redesenhados
  | 'container' | 'lowbed' | 'log' | 'bulk' | 'tipper' | 'car_transporter' | 'livestock';
```

| Chave | Rótulo (pt-BR) | Palavras-chave (regex sobre `body_type id accessory` em minúsculas) — ordem de avaliação |
|---|---|---|
| `car_transporter` | Cegonha | `car_?trans|autotrans|car_carrier|vehicles?` |
| `livestock` | Boiadeiro / gado | `livestock|cattle|animal|pig|sheep` |
| `container` | Porta-contêiner | `container|cont_|\b(20|40|45)ft\b|intermodal` |
| `lowbed` | Prancha rebaixada | `lowbed|lowloader|low_loader|lowboy|overweight|heavy|excavat|dozer` |
| `log` | Porta-toras | `\blog|timber|wood|trunk` |
| `bulk` | Graneleiro / silo | `silo|bulk|cement|powder|grain|pellet` |
| `tipper` | Basculante | `tipper|dumper|dump|gravel|sand|coal|aggregate` |
| `reefer` | Frigorífico | `reef|refrig|cool|frozen|chill|fridge` |
| `tanker` | Tanque | `tank|fuel|chem|food_tank|gas|petrol|diesel|adr` |
| `curtain` | Sider / lonado | `curtain|cs_|curtainsider|tautliner` |
| `flatbed` | Carga seca / prancha | `flat|platform|stake` |
| `box` | Baú seco | `box|dry|van|moving|insul` |

Observações: a ordem importa (`silo`/`cement` hoje caem em `tanker` — mover para `bulk` antes de
`tank`; `lowbed|log|container|car_trans` hoje caem em `flatbed` — agora têm desenho próprio). No ETS2 os
identificadores típicos vêm de `trailer.body_type` (ex.: `dryvan`, `curtainside`, `refrigerated`,
`insulated`, `flatbed`, `lowloader`, `log`, `container`, `silo`, `dumper`, `car_transporter`,
`livestock`, `fuel_tank`, `chemtank`, `foodtank`, `gastank`), de `trailer.id` (ex.:
`scs.lowloader…`, `scs.log…`, `scs.silo…`, `scs.car_transporter…`) e do `cargo accessory` (ex.:
`…excavator…`, `…logs…`). Escrever testes de `resolveTrailerModel` com esses exemplos. Quando nada casar,
manter `null` → desenho `box` com rótulo "aproximado".

### 9.2 Peças comuns (todas no SVG de cada tipo)

Chassi em pescoço de ganso (0,1–3,0 m raso; 3,4–8,4 m viga funda; 8,8–13,55 m sobre os eixos), placa do
pino-rei, pé de apoio com manivela e sapata, proteção lateral (2 trilhos), 3 eixos com braço arrastado e
bolsa de ar, rodas "super single", para-lamas por roda, para-barro, para-choque traseiro (RUPD),
conjunto de lanternas `tail` com as mesmas `data-lamp` do cavalo, marcadores laterais âmbar a cada
≤ 3 m (`side-marker`), **faixa refletiva de contorno** amarela tracejada (ECE 104) nas carrocerias
fechadas, marcador superior traseiro vermelho (`tail`).

### 9.3 Particularidades

- **box**: postes verticais finos, trilhos superior/inferior, quadro de porta com 4 dobradiças.
- **reefer**: carroceria branca lisa, **unidade de refrigeração** projetada à frente (grelhas + painel),
  tanque do equipamento sob o chassi.
- **curtain**: lona com dobras alternadas, catracas a cada 0,62 m, colunas de canto.
- **tanker**: cilindro com tampos abaulados, emendas de compartimento, passarela com corrimão rebatido,
  4 bocas de visita, escada, caixa de válvulas inferior, tubo porta-mangueira, **placa laranja ADR**.
- **flatbed**: piso com olhais de amarração, cabeceira em tela, carga de 2 caixotes + feixe de perfis
  com cintas e catracas.
- **container**: chassi esqueleto, contêiner 40' (12,19 × 2,59 m) corrugado, cantoneiras ISO com olhal,
  barras de travamento da porta, código de identificação genérico em mono.
- **lowbed**: pescoço alto → poço rebaixado com tábuas → deck traseiro; rampas erguidas; eixos menores
  (r 0,40 m); **escavadeira** com esteira (roletes, roda-motriz, tensora), casa, cabine envidraçada,
  lança/braço recolhidos, caçamba apoiada no deck e correntes de amarração.
- **log**: fueiros a cada ~2,5 m, duas pilhas de toras com topos à vista (anéis), cintas.
- **bulk**: silo cilíndrico com 3 funis em V, coletor de descarga, bocas no topo, escada.
- **tipper**: caçamba de fundo arredondado, cilindro telescópico frontal (3 estágios), protetor sobre o
  pescoço, lona enrolada no topo, tampa traseira articulada no alto.
- **car_transporter**: dois andares com colunas e cilindros, 6 carros genéricos em cores variadas
  (cores fixas no desenho, não temáticas), rodas pequenas (r 0,38 m).
- **livestock**: alumínio com 3 andares de fendas de ventilação, escotilhas no teto, rampa traseira.

Altura total limitada a 4,0 m (o contêiner 40' em chassi esqueleto chega a 4,04 m — por isso o
`viewBox` dos reboques começa em y −14).

---

## 10. Movimento

- Envolver o app em `<MotionConfig reducedMotion="user">` (framer-motion) — respeita o sistema.
- Durações: 120 ms (cor/opacidade), 150 ms (ponteiro, tween linear), 160 ms (fita DEMO),
  250 ms (escalas). Sem molas, sem `scale`, sem entrada de página animada.
- Animações contínuas permitidas: giroflex (`steps`), limpador (1,4 s), LED de "Conectando…".
  Todas desligam com `prefers-reduced-motion: reduce` (limpador fica parado a meio curso, LEDs fixos).
- `Badge pulse` deixa de usar `animate-pulse` (fade suave) e passa a piscar seco.

---

## 11. Acessibilidade

- Contraste: texto `--tp-text` sobre `--tp-panel` ≥ 12:1; `--tp-muted` ≥ 6:1; `--tp-dim` só para
  informação redundante (N/D tem `title`). Acento sobre painel ≥ 5:1.
- Estado nunca só por cor (indicadores têm rótulo, anunciadores têm código textual).
- Alvos de toque ≥ 44 px no celular; navegação por teclado com foco visível; `aria-current` mantido.
- Mostradores: `role="img"` + `aria-label="Velocidade: 84 km/h; limite 80"`.

---

## 12. Tarefas de implementação (ordem sugerida)

1. Fontes `@fontsource/*` + `index.css`: tokens §2 (3 temas + `--truck-*`/`--lamp-*`/`--trailer-*`),
   `.digits`, `.tp-label`, `.tp-hatch`, `.tp-tape`, `.tp-leader`, novo CSS de `.tp-lamp`/`.tp-beacon`;
   remover `.glow`. Rodar os testes.
2. `ui.tsx` (Card/Stat/Meter com `segments`/Badge/Row/Limitation) mantendo as classes de tom.
3. Shell `App.tsx`: trilho numerado, barra de status, fita DEMO, `MotionConfig`, barra inferior +
   folha "Mais" no celular, `viewport-fit=cover`/`100dvh`.
4. `Gauge.tsx` (ponteiro, escala, LCD) e `Telltales.tsx` (célula nova, `blue → --tp-info`).
5. `Widgets.tsx`, `WiperIndicator.tsx`, `Charts.tsx`.
6. `TruckSide.tsx` portando `trucks/side-4x2.svg` (lente + luz, sombras planas, rodas por tipo de eixo,
   6x2) e `TruckFront.tsx` portando `front-master.svg`; ajustar valores de `models/*.ts` (§8) e
   `headlightPath()` com as formas de `front-families.svg`.
7. Reboques: estender `TrailerModelKey` + regras §9.1 (com testes), extrair `TrailerSide` em
   `vehicles/trailers/<tipo>.tsx` portando `trailers/*.svg`; atualizar os testes `it.each` de tipos.
8. Dashboard (desktop e celular, §5.1).
9. Demais páginas (§5.2–5.9), incluindo "Acessar pelo celular" com `qrcode-generator`.
10. Revisão: `npm test`, typecheck, checklist do §1 ("o que evitar"), teste real num celular via IP da
    LAN em retrato e paisagem, e os três temas.
