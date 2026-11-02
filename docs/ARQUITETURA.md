# Arquitetura técnica

```
 Euro Truck Simulator 2
   └─ scs-telemetry.dll (scs-sdk-plugin V.1.12)  ──escreve──►  Memória compartilhada "Local\SCSTelemetry"
                                                                         │ (OpenFileMappingW / MapViewOfFile via koffi)
 server/ (Node.js + TypeScript)                                          ▼
   sdk/sharedMemory.ts ── snapshot (Buffer) ──► sdk/adapters.ts ──► RawTelemetry (unidades do SDK)
   sdk/gameProcess.ts  (processo do jogo, caminho do exe)              │
   sdk/layouts/rev12.ts (layout binário)                               ▼
                                                parser/dataParser.ts + validate.ts  (conversão + validação → N/D)
                                                               │
   engine/telemetryEngine.ts  ◄─────────────────────────────────┘  máquina de estados, reconexão, alertas
      ├─ managers/tripManager.ts     (Trip / sessão, SQLite)
      ├─ managers/vehicleManager.ts  (modelo 2D, caminhões usados)
      ├─ managers/trailerManager.ts  (reboque, distância local)
      └─ engine/demoSimulator.ts     (MODO DEMO, pipeline separado e não persistente)
   net/server.ts  ── HTTP (REST + arquivos do painel) + WebSocket /ws ──►  web/ (React)
   db/database.ts (node:sqlite)   managers/settingsService.ts   managers/historyService.ts
```

## Módulos

| Módulo pedido | Onde |
|---|---|
| Telemetry Engine | `server/src/engine/telemetryEngine.ts` |
| SDK Adapter | `server/src/sdk/adapters.ts`, `layout.ts`, `layouts/rev12.ts`, `sharedMemory.ts` |
| Data Parser | `server/src/parser/dataParser.ts`, `validate.ts` |
| WebSocket Server | `server/src/net/server.ts` |
| Trip Manager | `server/src/managers/tripManager.ts` |
| Vehicle Manager | `server/src/managers/vehicleManager.ts`, `shared/vehicles.ts` |
| Trailer Manager | `server/src/managers/trailerManager.ts` |
| Database | `server/src/db/database.ts`, `managers/historyService.ts` |
| Settings | `server/src/managers/settingsService.ts`, `web/src/pages/Settings.tsx` |
| Dashboard | `web/src/pages/*`, `web/src/components/*` |
| SVG Vehicle Renderer | `web/src/vehicles/TruckSide.tsx`, `TruckFront.tsx`, `models/*.ts` |

## Leitura da memória compartilhada

O Node.js não abre Memory Mapped Files nativamente. Avaliamos:

- **ffi-napi / ref-napi** — sem manutenção e quebrado em Node ≥ 18.
- **Addon C++ próprio (node-gyp)** — exige Visual Studio Build Tools na máquina do usuário.
- **trucksim-telemetry (npm)** — addon nativo pré-compilado para versões antigas do Node.
- **Servidor intermediário em C# (Funbit ets2-telemetry-server)** — projeto abandonado, layout antigo.
- **koffi** ✅ — FFI moderna com binários pré-compilados para Windows x64; chama `OpenFileMappingW`,
  `MapViewOfFile`, `UnmapViewOfFile`, `CloseHandle` direto da kernel32.

A cada tick o bloco inteiro (21 600 bytes) é copiado para um `Buffer` (snapshot) e interpretado. O plugin
escreve sem trava, mas como a cópia é rápida e cada campo é validado, uma leitura "rasgada" no máximo
gera um valor fora de faixa (descartado) por um frame.

## Camada de adaptação de versões

`readHeader()` lê `sdkActive`, `paused`, `time` e a revisão do plugin (offset 40), que é estável entre
revisões recentes. `adapterFor(revision)` devolve o adaptador; revisões sem adaptador geram o estado
`incompatible` com mensagem explicando quais são suportadas. Para suportar outra revisão:

1. Copie `layouts/rev12.ts` → `layouts/revNN.ts` e ajuste conforme o header da nova versão.
2. Crie o adaptador em `adapters.ts` e inclua em `ADAPTERS`.
3. O teste `layout.test.ts` garante que nenhuma zona extrapola o espaço do header.

## Estados de conexão

| Estado | Condição |
|---|---|
| `game-not-running` | `eurotrucks2.exe`/`amtrucks.exe` não está na lista de processos (o handle da memória é fechado para não segurar dados antigos) |
| `plugin-missing` | jogo aberto, mas `OpenFileMappingW` falha (plugin ausente ou não carregado). Nova tentativa a cada 1 s |
| `waiting-sdk` | memória existe, `sdkActive = false` |
| `incompatible` | revisão do plugin sem adaptador, ou FFI indisponível |
| `stale` | `time` do plugin não muda há > 3 s sem pausa |
| `connected` | dados válidos |
| `demo` | simulador ativo |

Atividade (`activity`): `paused`, `engine-off`, `stopped`, `driving`.

## Trip, sessão e histórico

- A distância usa o **delta do odômetro real** (soma telescópica, sem erro acumulado). Deltas negativos
  ou acima de 300 km/h (troca de caminhão, teleporte, lixo) são descartados e a linha de base reinicia.
- Combustível usado = soma das quedas do nível (< 5 L por tick); aumentos são reabastecimento.
- Tempo dirigindo conta apenas com velocidade > 1 km/h e jogo não pausado.
- Persistência: tabela `trips` (linha `is_current = 1`), `sessions` (uma por conexão), `samples` (a cada
  10 s, poda após 90 dias), `trucks`, `trailers`, `settings`. Banco em `data/truckpulse.db`.
- Zerar o trip fecha a linha atual e cria outra — o odômetro do jogo nunca é tocado.

## DEMO isolado

`setMode('demo')` encerra a sessão real e cria um pipeline novo com `TripManager(null)`,
`VehicleManager(null)` e `TrailerManager(null)` — sem banco. Os frames saem com `source: 'demo'`; o painel
mostra a faixa "MODO DEMO" e descarta as séries dos gráficos ao trocar de origem.

## Caminhões 2D

Cada modelo é um arquivo independente em `web/src/vehicles/models/` com o perfil lateral (em metros) e a
vista frontal (caixa 300×400): perfil da cabine, inclinação do para-brisa, estilo da grade e formato dos
faróis. Os renderizadores compõem chassi, rodas, reboque e a camada de luzes, controlada pelos dados reais:

- eixos posicionados pelas posições reais das rodas (`truck.wheel.position`);
- suspensão: a altura do chassi em cada eixo usa a variação da deflexão real (exagerada, configurável);
- o pisca acende pela lâmpada real do jogo (`blinkerLeftOn/RightOn`), portanto em sincronia;
- na vista frontal, a seta esquerda do caminhão fica à direita de quem olha.

Identificação automática: regras em `shared/vehicles.ts` sobre `brand_id`, `id` e `name`. Sem regra → silhueta
"genérica" marcada como **aproximada**; o usuário pode escolher o modelo manualmente.

## API

| Método | Rota | Descrição |
|---|---|---|
| WS | `/ws` | `hello`, `frame` (TelemetryFrame), `settings`; cliente pode enviar `setMode` |
| GET | `/api/status` | versão, modo, conexão |
| GET | `/api/frame` | último frame |
| GET/PUT | `/api/settings` | configurações (validadas no servidor) |
| POST | `/api/mode` | `{ "mode": "live" \| "demo" }` |
| POST | `/api/trip/reset` | zera o trip |
| GET | `/api/history/{trips,sessions,trucks,trailers,samples}` | histórico |
| GET | `/api/history/summary` | totais |
| GET | `/api/export?kind=trips&format=csv\|json` | exportação |
| GET | `/api/diagnostics` | verificação do SDK/plugin/jogo |
| GET | `/api/vehicles` | modelos 2D disponíveis |

## Testes

- `server/test`: layout binário (offsets e tamanhos de zona conferidos contra o header), adaptador
  (buffer sintético), parser/validação, Trip (odômetro, saltos, reabastecimento, pausa, persistência),
  máquina de estados do engine (com memória e processo falsos), isolamento do DEMO, alertas,
  identificação de modelos.
- `web/test`: os 12 indicadores de luz, limpador, gauges, placa de limite, gráficos, store (DEMO não se
  mistura) e **todos os 11 modelos 2D** nas vistas frontal e lateral (luzes acesas/apagadas, orientação
  das setas, 5 tipos de reboque, eixos a partir das posições reais, rótulos de deflexão).
