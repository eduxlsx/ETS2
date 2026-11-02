# TRUCKPULSE — Advanced Truck Telemetry

Painel de telemetria em tempo real para **Euro Truck Simulator 2**, rodando localmente no Windows.
Lê os dados **reais** do jogo pelo SCS Telemetry SDK (plugin *scs-sdk-plugin*, memória compartilhada),
transmite por WebSocket e mostra tudo num painel web/desktop estilo cluster digital.

- Funciona 100% offline.
- Nada é inventado: canal indisponível aparece como **N/D**, com a limitação explicada na tela.
- **Modo DEMO** para testar sem o jogo — sempre identificado e nunca misturado ao histórico real.

---

## Requisitos

| Item | Versão |
|---|---|
| Windows 10/11 64 bits | — |
| [Node.js](https://nodejs.org) | **22.13 ou mais recente** (usa o módulo nativo `node:sqlite`) |
| Euro Truck Simulator 2 | versão atual (64 bits) |
| Plugin [scs-sdk-plugin](https://github.com/RenCloud/scs-sdk-plugin) | **V.1.12.x** (instalado pelo script) |

## Instalação rápida

1. Instale o Node.js 22 LTS (ou mais recente).
2. Dê dois cliques em **`INSTALAR.bat`**. Ele:
   - verifica o Node.js;
   - instala as dependências (`npm install`) e compila servidor + painel;
   - roda os testes unitários;
   - localiza o ETS2 (processo aberto, Steam e `libraryfolders.vdf`) e instala o plugin de telemetria.
3. **Feche e abra o ETS2** (o plugin só é carregado na inicialização). Na primeira vez o jogo mostra um
   aviso sobre "SDK features" — confirme com **OK**.
4. Dê dois cliques em **`INICIAR.bat`**. O painel abre em <http://localhost:5170>.

Na primeira abertura aparece o **assistente de configuração** (verificação do plugin/jogo, unidades e
seleção do veículo). Ele pode ser reaberto em *Configurações → Assistente inicial*.

### Atalhos

| Arquivo | O que faz |
|---|---|
| `INSTALAR.bat` | instalação completa (inclui o plugin) |
| `INICIAR.bat` | inicia o servidor e abre o painel no navegador |
| `INICIAR-DEMO.bat` | inicia já no MODO DEMO |
| `VERIFICAR.bat` | verificação do SDK: Node, plugin, jogo, revisão do plugin e uma amostra de dados reais |

### Scripts PowerShell (`scripts\`)

```powershell
.\scripts\install.ps1 [-WithPlugin] [-WithElectron] [-SkipTests]
.\scripts\install-plugin.ps1 [-GamePath "D:\SteamLibrary\steamapps\common\Euro Truck Simulator 2"]
.\scripts\start.ps1 [-Demo] [-NoBrowser] [-Electron] [-Port 5170]
.\scripts\check.ps1
.\scripts\autostart.ps1 [-Disable]
```

## Instalação manual do plugin

1. Baixe `release_v_1_12_1.zip` em <https://github.com/RenCloud/scs-sdk-plugin/releases>.
2. Copie `Win64\scs-telemetry.dll` para
   `...\steamapps\common\Euro Truck Simulator 2\bin\win_x64\plugins\` (crie a pasta `plugins`).
3. Reinicie o jogo.

O script `install-plugin.ps1` faz exatamente isso e confere o SHA-256 do DLL
(`1D03DBC7A975E72203C60A7B9998021CEB8800B836BF28A131279979AD386CD4`).

## Uso

- **Painel** — velocidade (analógica + digital), limite da via, RPM e marcha, freio motor/retarder,
  combustível, temperaturas e pressões, caminhão 2D, luzes, trip, gráficos de velocidade/combustível/consumo,
  clima/ambiente e limpadores.
- **Caminhão** — desenho 2D grande (lateral/frontal), identificação, todos os indicadores de iluminação,
  limpador animado e suspensão por roda.
- **Viagem** — trip (com botão *Zerar trip*), odômetro real, sessão, tempo, médias, entrega atual.
- **Reboque** — engate, tipo, carga, desgaste, distância com o reboque, suspensão.
- **Manutenção** — desgaste de motor, transmissão, chassi, cabine, rodas e reboque, com alertas.
- **Histórico** — viagens, sessões, caminhões e reboques usados, gráficos das últimas 24 h, exportação CSV/JSON.
- **Configurações** — unidades, tema, modelo do caminhão/reboque (auto/manual), capacidade do tanque,
  taxa de atualização, alertas, limite de velocidade, inicialização com o Windows.
- **Diagnóstico** — verificação do SDK, estado da conexão e tabela de canais disponíveis.

**Tela cheia:** botão no canto superior direito (ou F11). Ideal para deixar o painel num segundo monitor.
O layout se adapta a 16:9, ultrawide e telas pequenas (a navegação vai para a parte de baixo no celular).

**Acesso por outro dispositivo da rede (tablet/celular):** com o celular no mesmo Wi-Fi, abra
`http://<ip-do-pc>:5170` — o endereço aparece no log ao iniciar e em Configurações → Acessar pelo celular.
Na primeira vez o Firewall do Windows pergunta se o Node.js pode usar a rede: permita em **redes privadas**.
Para aceitar só conexões do próprio PC, inicie com `TRUCKPULSE_HOST=127.0.0.1`.

### Aplicativo desktop (Electron, opcional)

```powershell
.\scripts\start.ps1 -Electron
```

Instala o Electron na primeira execução. F11 alterna tela cheia; **Ctrl+Shift+M** move a janela para o
próximo monitor.

### Iniciar com o Windows

Ative em *Configurações → Iniciar o TRUCKPULSE com o Windows* (ou `scripts\autostart.ps1`). Cria
`TruckPulse.cmd` na pasta *Inicializar* do usuário, que sobe o servidor minimizado sem abrir o navegador.

## O que é real e o que é N/D

Tudo vem do SDK. Resumo das limitações (detalhes em [docs/SDK-CHANNELS.md](docs/SDK-CHANNELS.md)):

| Recurso | Situação |
|---|---|
| Chuva / intensidade / visibilidade | **N/D** — o SCS SDK não tem canais de clima. O limpador **não** é usado para "adivinhar" chuva. |
| Estágio do limpador | **N/D** — o SDK só informa ligado/desligado. |
| Suspensão | **real** — deflexão por roda (`wheel.susp.deflection`). Elevação pneumática do chassi e carga por eixo: **N/D**. |
| Capacidade do tanque | **real** (`config.fuel.capacity`), com opção de valor manual. |
| Condição da pista | **real** — material sob as rodas (asfalto, terra, grama…). |
| Distância com o reboque | calculada localmente (o SDK não tem odômetro de reboque). |
| Modelo 2D | identificado por `brand_id`/`id`/`name`; sem correspondência → "aproximado" e seleção manual. |
| Giroflex | ligado/desligado real; a rotação desenhada é apenas visual. |

## Modelos 2D

Scania R, Scania S, Volvo FH (3ª, 4ª e 5ª geração), Mercedes-Benz Actros, Actros MP4, Volkswagen Meteor
(mod), DAF XF, DAF XG — e uma silhueta genérica para modelos não identificados. São representações
vetoriais estilizadas para identificação visual, não desenhos oficiais dos fabricantes. Cada modelo é um
arquivo independente em `web/src/vehicles/models/`; veja como adicionar outro em
[docs/ARQUITETURA.md](docs/ARQUITETURA.md#caminhões-2d).

## Desenvolvimento

```powershell
npm install
npm run dev          # servidor com recarga (tsx watch) em :5170
npm run dev:web      # painel Vite em :5173 (proxy para :5170)
npm test             # testes do servidor e do painel (Vitest)
npm run typecheck
npm run build
npm run check        # verificação do SDK pela linha de comando
```

Variáveis de ambiente: `TRUCKPULSE_PORT` (5170), `TRUCKPULSE_HOST` (0.0.0.0), `TRUCKPULSE_DATA`
(pasta do banco e logs, padrão `data\`), `TRUCKPULSE_LOG` (`debug|info|warn|error`), `TRUCKPULSE_DEMO=1`.

Estrutura:

```
shared/      tipos e catálogo de veículos compartilhados (servidor + painel)
server/      Node.js + TypeScript — SDK adapter, parser, engine, managers, SQLite, HTTP/WebSocket
web/         React + Vite + Tailwind + Framer Motion + Recharts — painel e caminhões SVG
electron/    wrapper desktop opcional
scripts/     instalação, inicialização, verificação, plugin, autostart
docs/        arquitetura e canais do SDK
data/        banco SQLite e logs (criado na primeira execução)
```

## Solução de problemas

| Sintoma | O que fazer |
|---|---|
| "Jogo fechado" com o jogo aberto | O TRUCKPULSE procura `eurotrucks2.exe`; verifique se é a versão 64 bits. |
| "Plugin ausente" | Rode `scripts\install-plugin.ps1` e **reinicie o jogo**. Confira `bin\win_x64\plugins\scs-telemetry.dll`. |
| "Aguardando SDK" | Normal no carregamento/menu inicial. Entre no perfil. |
| "Incompatível" | Revisão do plugin diferente da 12. Instale o scs-sdk-plugin V.1.12.x. |
| "Sem atualização" | O jogo travou, está carregando ou o plugin foi descarregado. Reconecta sozinho. |
| Porta 5170 ocupada | `.\scripts\start.ps1 -Port 5180` |
| Logs | `data\logs\truckpulse-AAAA-MM-DD.log` |

## Créditos

- SCS Software — SCS Telemetry SDK.
- RenCloud e colaboradores — [scs-sdk-plugin](https://github.com/RenCloud/scs-sdk-plugin) (licença MIT).
- TRUCKPULSE não é afiliado à SCS Software nem aos fabricantes citados.
