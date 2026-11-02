# Canais do SDK usados pelo TRUCKPULSE

Fonte: **SCS Telemetry SDK** (via plugin [scs-sdk-plugin](https://github.com/RenCloud/scs-sdk-plugin) V.1.12.x,
`PLUGIN_REVID 12`), lido da memória compartilhada `Local\SCSTelemetry` (32 KiB, layout em
`scs-telemetry/inc/scs-telemetry-common.hpp`, transcrito em `server/src/sdk/layouts/rev12.ts`).

Legenda: **Tipo** = tipo no struct C; **Unid.** = unidade entregue pelo SDK; **Painel** = como aparece.
Quando um valor falha na validação (NaN, infinito, fora da faixa física) ele vira `null` → **N/D**.

## Controle / jogo

| Informação | Campo (rev12) | Tipo | Unid. | Observações |
|---|---|---|---|---|
| SDK ativo | `sdkActive` (offset 0) | bool | — | false no carregamento → estado "Aguardando SDK" |
| Pausado | `paused` (4) | bool | — | também true no menu |
| Timestamp do plugin | `time` (8) | u64 | µs | parado sem pausa por > 3 s → estado "stale" |
| Revisão do plugin | `telemetry_plugin_revision` (40) | u32 | — | escolhe o adaptador de layout |
| Jogo | `game` | u32 | — | 1 = ETS2, 2 = ATS |
| Versões | `version_major/minor`, `telemetry_version_game_*` | u32 | — | versão da API de telemetria do jogo e do SDK (não a versão "1.5x" do jogo) |
| Horário do jogo | `time_abs` (`game.time`) | u32 | min | 0 = segunda 00:00 |
| Escala de tempo | `scale` | float | — | |
| Próximo descanso | `restStop` | int | min | |
| Multiplayer | `multiplayerTimeOffset` | i64 | — | ≠ 0 em sessões multiplayer |

## Velocidade, motor e transmissão

| Informação | Campo | Tipo | Unid. | Painel |
|---|---|---|---|---|
| Velocidade | `speed` (`truck.speed`) | float | m/s | km/h ou mph; negativo = ré (mostrado em módulo) |
| Limite da via | `speedLimit` (`truck.navigation.speed.limit`) | float | m/s | 0 = desconhecido → N/D |
| Piloto automático | `cruiseControl`, `cruiseControlSpeed` | bool / float | m/s | |
| RPM / RPM máx. | `engineRpm`, `engineRpmMax` | float | rpm | |
| Marcha real / do painel | `gear`, `gearDashboard` | int | — | 0 = N, negativo = ré (R, R1, R2…) |
| Nº de marchas | `gears`, `gears_reverse` | u32 | — | |
| Freio motor | `motorBrake` | bool | — | |
| Retarder | `retarderBrake` / `retarderStepCount` | u32 | estágio | |
| Temp. água | `waterTemperature` | float | °C | |
| Temp. óleo | `oilTemperature` | float | °C | |
| Pressão do óleo | `oilPressure` | float | psi | convertida para bar se configurado |
| Bateria | `batteryVoltage` | float | V | |
| Pressão de ar | `airPressure` | float | psi | |
| Temp. freios | `brakeTemperature` | float | °C | |
| Motor / elétrica | `engineEnabled`, `electricEnabled` | bool | — | |
| Freio de estacionamento | `parkBrake` | bool | — | |
| Avisos do jogo | `*WarningOn`, `fuelWarning`, `adblueWarning` | bool | — | limiares em `*Warning` (config) |

## Combustível

| Informação | Campo | Tipo | Unid. | Observações |
|---|---|---|---|---|
| Combustível | `fuel` | float | L | |
| Capacidade do tanque | `fuelCapacity` (`config.truck.fuel.capacity`) | float | L | canal direto do SDK; pode ser substituída manualmente em Configurações |
| Reserva | `fuelWarning`, `fuelWarningFactor` | bool / float | fração | |
| Consumo médio | `fuelAvgConsumption` | float | L/km | ×100 → L/100 km (média calculada pelo jogo) |
| Autonomia | `fuelRange` | float | km | estimativa do jogo |
| AdBlue | `adblue`, `adblueCapacity` | float | L | |

O **consumo do trip** é calculado localmente: soma das quedas do nível de combustível (aumentos =
reabastecimento são ignorados) dividida pela distância do trip.

## Odômetro e rota

| Informação | Campo | Tipo | Unid. |
|---|---|---|---|
| Odômetro do caminhão | `truckOdometer` | float | km |
| Rota restante (GPS) | `routeDistance` | float | m |
| Tempo de rota | `routeTime` | float | s |

## Iluminação e limpador

| Informação | Campo | Tipo | Observações |
|---|---|---|---|
| Posição | `lightsParking` | bool | |
| Farol baixo / alto | `lightsBeamLow`, `lightsBeamHigh` | bool | |
| Aux. dianteiro / teto | `lightsAuxFront`, `lightsAuxRoof` | u32 | 0 = desligado, 1 = reduzido, 2 = máximo |
| Seta (alavanca) | `blinkerLeftActive`, `blinkerRightActive` | bool | |
| Seta (lâmpada acesa agora) | `blinkerLeftOn`, `blinkerRightOn` | bool | usado para piscar sincronizado com o jogo |
| Pisca-alerta | `lightsHazard` | bool | |
| Freio / ré | `lightsBrake`, `lightsReverse` | bool | |
| Giroflex | `lightsBeacon` | bool | só ligado/desligado; a rotação desenhada é visual |
| Iluminação do painel | `lightsDashboard` | float | 0..1 |
| Limpador | `wipers` | bool | **só ligado/desligado** — o SDK não informa velocidade/estágio → "Estágio: N/D" |

## Suspensão, rodas e eixos

| Informação | Campo | Tipo | Unid. | Observações |
|---|---|---|---|---|
| Nº de rodas | `truckWheelCount` / trailer `wheelCount` | u32 | — | limitado a 16 |
| Posição da roda | `truckWheelPosition{X,Y,Z}` | float | m | espaço do veículo (+Z = para trás) — usada para posicionar os eixos no desenho |
| **Deflexão da suspensão** | `truck_wheelSuspDeflection` / trailer `wheelSuspDeflection` | float | m | deslocamento vertical real da roda em relação ao eixo |
| No chão | `truck_wheelOnGround` | bool | — | |
| Elevação do eixo | `truck_wheelLift`, `liftAxle*` | float / bool | 0..1 | eixos elevatórios |
| Superfície | `truck_wheelSubstance` + `substance[]` | u32 / string | — | "Condição da pista" (asfalto, terra, grama…) |

> **Importante:** as coordenadas do caminhão no mundo (`coordinateX/Y/Z`) **não** são usadas como altura de
> suspensão. A "elevação" pneumática do chassi (subir/baixar pelo comando do jogo), carga por eixo e
> indicadores de estabilidade **não existem** no SDK → N/D. A interface já tem os campos previstos.

## Desgaste

`wearEngine`, `wearTransmission`, `wearCabin`, `wearChassis`, `wearWheels` (float 0..1) e, por reboque,
`wearChassis`, `wearWheels`, `wearBody`, `cargoDamage`.

## Identificação

| Informação | Campo |
|---|---|
| Caminhão | `truckBrandId`, `truckBrand`, `truckId`, `truckName`, `truckLicensePlate*` |
| Reboque | `id`, `brandId`, `brand`, `name`, `bodyType`, `chainType`, `cargoAcessoryId`, `licensePlate`, `attached` |
| Carga | `cargo`, `cargoMass` (kg), `isCargoLoaded`, `cargoDamage` |

## O que o SDK **não** fornece (e o painel mostra N/D)

- Chuva, intensidade da chuva, neblina, visibilidade (não há canal de clima no SCS SDK).
  O TRUCKPULSE **não** deduz chuva a partir do limpador.
- Estágio/velocidade do limpador.
- Altura/elevação pneumática da suspensão, carga por eixo.
- Cor da pintura do caminhão (o desenho usa uma cor padrão por modelo).
- Odômetro do reboque (a distância com cada reboque é somada localmente).
