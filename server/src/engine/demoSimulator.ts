/**
 * Simulador de telemetria (MODO DEMO).
 *
 * Gera RawTelemetry plausível para testar o painel sem o ETS2. Os frames
 * produzidos a partir daqui são SEMPRE marcados com source = 'demo' pelo
 * Telemetry Engine e nunca são persistidos no histórico real.
 */
import type { RawTelemetry, RawTrailer, RawWheel } from '../sdk/raw.js';

export function emptyWheel(): RawWheel {
  return {
    positionX: 0, positionY: 0, positionZ: 0, radius: 0.5, suspDeflection: 0, onGround: true, lift: 0,
    liftable: false, powered: false, steerable: false, simulated: true, substance: 0,
  };
}

export function emptyTrailer(): RawTrailer {
  return {
    attached: false, id: '', cargoAccessoryId: '', bodyType: '', brandId: '', brand: '', name: '', chainType: '',
    licensePlate: '', licensePlateCountry: '', wheelCount: 0, cargoDamage: 0, wearChassis: 0, wearWheels: 0, wearBody: 0,
    wheels: [],
  };
}

export function emptyRaw(): RawTelemetry {
  return {
    sdkActive: true, paused: false, time: 0n, pluginRevision: 12, simulatedTime: 0n, renderTime: 0n,
    multiplayerTimeOffset: 0n, game: 1, versionMajor: 1, versionMinor: 0, telemetryVersionMajor: 1,
    telemetryVersionMinor: 0, timeAbs: 0, scale: 19, restStop: 0, gears: 12, gearsReverse: 4, retarderStepCount: 0,
    truckWheelCount: 0, fuelCapacity: 0, fuelWarningFactor: 0.15, adblueCapacity: 0, airPressureWarning: 0,
    airPressureEmergency: 0, oilPressureWarning: 0, waterTemperatureWarning: 0, batteryVoltageWarning: 0,
    engineRpmMax: 0, cargoMass: 0, isCargoLoaded: false, truckBrandId: '', truckBrand: '', truckId: '', truckName: '',
    truckLicensePlate: '', truckLicensePlateCountry: '', shifterType: '', speed: 0, engineRpm: 0, gear: 0,
    gearDashboard: 0, throttle: 0, brake: 0, clutch: 0, cruiseControlSpeed: 0, cruiseControl: false, airPressure: 0,
    brakeTemperature: 0, fuel: 0, fuelAvgConsumption: 0, fuelRange: 0, adblue: 0, oilPressure: 0, oilTemperature: 0,
    waterTemperature: 0, batteryVoltage: 0, lightsDashboard: 0, wearEngine: 0, wearTransmission: 0, wearCabin: 0,
    wearChassis: 0, wearWheels: 0, odometer: 0, routeDistance: 0, routeTime: 0, speedLimit: 0, retarderBrake: 0,
    lightsAuxFront: 0, lightsAuxRoof: 0, accelerationZ: 0, parkBrake: false, motorBrake: false,
    airPressureWarningOn: false, airPressureEmergencyOn: false, fuelWarning: false, adblueWarning: false,
    oilPressureWarningOn: false, waterTemperatureWarningOn: false, batteryVoltageWarningOn: false,
    electricEnabled: false, engineEnabled: false, wipers: false, blinkerLeftActive: false, blinkerRightActive: false,
    blinkerLeftOn: false, blinkerRightOn: false, lightsParking: false, lightsBeamLow: false, lightsBeamHigh: false,
    lightsBeacon: false, lightsBrake: false, lightsReverse: false, lightsHazard: false, differentialLock: false,
    liftAxle: false, liftAxleIndicator: false, trailerLiftAxle: false, trailerLiftAxleIndicator: false, wheels: [],
    onJob: false, cargo: '', citySrc: '', compSrc: '', cityDst: '', compDst: '', jobIncome: 0, jobMarket: '',
    plannedDistanceKm: 0, cargoDamage: 0, substances: [], trailers: [],
    cargoId: '', unitCount: 0, citySrcId: '', compSrcId: '', cityDstId: '', compDstId: '', timeAbsDelivery: 0,
    jobStartingTime: 0, jobFinishedTime: 0, truckLicensePlateCountryId: '',
    jobDelivered: false, jobDeliveredRevenue: 0, jobDeliveredCargoDamage: 0, jobDeliveredDistanceKm: 0,
    jobDeliveredDeliveryTime: 0, jobDeliveredEarnedXp: 0, jobDeliveredAutoparkUsed: false, jobDeliveredAutoloadUsed: false,
    jobCancelled: false, jobCancelledPenalty: 0, jobFinished: false, fined: false, fineOffence: '', fineAmount: 0,
    tollgate: false, tollgatePayAmount: 0, ferry: false, ferrySourceName: '', ferryTargetName: '', ferryPayAmount: 0,
    train: false, trainSourceName: '', trainTargetName: '', trainPayAmount: 0, refuel: false, refuelPayed: false, refuelAmount: 0,
  };
}

const DEMO_TRUCKS = [
  { brandId: 'scania', brand: 'Scania', id: 'vehicle.scania.s_2016', name: 'S' },
  { brandId: 'volvo', brand: 'Volvo', id: 'vehicle.volvo.fh16_2012', name: 'FH16 2012' },
  { brandId: 'daf', brand: 'DAF', id: 'vehicle.daf.xg', name: 'XG+' },
  { brandId: 'mercedes', brand: 'Mercedes-Benz', id: 'vehicle.mercedes.actros', name: 'Actros' },
  { brandId: 'scania', brand: 'Scania', id: 'vehicle.scania.r_2016', name: 'R' },
  { brandId: 'volkswagen', brand: 'Volkswagen', id: 'vehicle.volkswagen.meteor', name: 'Meteor' },
  { brandId: 'volvo', brand: 'Volvo', id: 'vehicle.volvo.fh_2021', name: 'FH 2021' },
];

/**
 * Fretes do modo DEMO: cada um usa um tipo de reboque diferente, para que todos
 * os desenhos possam ser vistos. Os identificadores imitam os do ETS2
 * (trailer.body_type / trailer.id / cargo accessory) e passam pela mesma
 * identificação automática (shared/vehicles.ts → resolveTrailerModel).
 */
export interface DemoFreight {
  cargo: string;
  massKg: number;
  bodyType: string;
  trailerId: string;
  accessory: string;
  /** cargo_id (tabela de NCM simulada em shared/docs/cargo-tax.ts). */
  cargoId: string;
  trailerName: string;
  trailerBrand: string;
  from: [city: string, company: string];
  to: [city: string, company: string];
  km: number;
  income: number;
  /** raio das rodas do reboque (m) e posições z dos eixos (m) */
  wheelR?: number;
  axleZ?: number[];
}

export const DEMO_FREIGHTS: DemoFreight[] = [
  { cargo: 'Eletrônicos', cargoId: 'electronics', massKg: 18500, bodyType: 'dryvan', trailerId: 'scs.box.single_3', accessory: 'cargo.electronics', trailerName: 'Baú Seco', trailerBrand: 'Krone', from: ['Curitiba', 'Transcargo'], to: ['São Paulo', 'LogMax'], km: 412, income: 48200 },
  { cargo: 'Carne congelada', cargoId: 'frozen_meat', massKg: 21000, bodyType: 'refrigerated', trailerId: 'scs.reefer.single_3', accessory: 'cargo.frozen_meat', trailerName: 'Frigorífico', trailerBrand: 'Schmitz', from: ['Chapecó', 'Frigosul'], to: ['Santos', 'Porto Frio'], km: 860, income: 92400 },
  { cargo: 'Bobinas de papel', cargoId: 'paper_rolls', massKg: 24000, bodyType: 'curtainside', trailerId: 'scs.curtainside.single_3', accessory: 'cargo.paper_rolls', trailerName: 'Sider', trailerBrand: 'Randon', from: ['Telêmaco Borba', 'Papel & Cia'], to: ['Joinville', 'Gráfica Litoral'], km: 290, income: 31800 },
  { cargo: 'Óleo diesel', cargoId: 'diesel', massKg: 30000, bodyType: 'fuel_tank', trailerId: 'scs.fuel_tank.single_3', accessory: 'cargo.diesel', trailerName: 'Tanque', trailerBrand: 'Facchini', from: ['Paulínia', 'Refinaria Planalto'], to: ['Ribeirão Preto', 'Posto Estrela'], km: 210, income: 27500 },
  { cargo: 'Vigas de aço', cargoId: 'steel_beams', massKg: 26500, bodyType: 'flatbed', trailerId: 'scs.flatbed.single_3', accessory: 'cargo.steel_beams', trailerName: 'Carga seca', trailerBrand: 'Guerra', from: ['Ipatinga', 'Siderúrgica Vale do Aço'], to: ['Belo Horizonte', 'Construtora Horizonte'], km: 215, income: 26100 },
  { cargo: 'Contêiner de café', cargoId: 'coffee_container', massKg: 22000, bodyType: 'container', trailerId: 'scs.container.40ft', accessory: 'cargo.container_coffee', trailerName: 'Porta-contêiner', trailerBrand: 'Librelato', from: ['Varginha', 'Cooperativa Sul de Minas'], to: ['Santos', 'Terminal Portuário'], km: 470, income: 55300 },
  { cargo: 'Escavadeira hidráulica', cargoId: 'excavator', massKg: 38000, bodyType: 'lowloader', trailerId: 'scs.lowloader.double', accessory: 'cargo.excavator', trailerName: 'Prancha rebaixada', trailerBrand: 'Noma', from: ['Sorocaba', 'Máquinas Pesadas SP'], to: ['Goiânia', 'Mineração Cerrado'], km: 920, income: 134000, wheelR: 0.4, axleZ: [7.9, 8.9, 9.9] },
  { cargo: 'Toras de eucalipto', cargoId: 'logs', massKg: 32000, bodyType: 'log', trailerId: 'scs.log.single_3', accessory: 'cargo.logs', trailerName: 'Porta-toras', trailerBrand: 'Rodotécnica', from: ['Três Lagoas', 'Florestal MS'], to: ['Mogi Guaçu', 'Celulose Paulista'], km: 640, income: 61200 },
  { cargo: 'Cimento a granel', cargoId: 'cement', massKg: 29000, bodyType: 'silo', trailerId: 'scs.silo.cement', accessory: 'cargo.cement', trailerName: 'Silo', trailerBrand: 'Rossetti', from: ['Itaú de Minas', 'Cimentos Gerais'], to: ['Campinas', 'Concreteira Campinas'], km: 380, income: 40500 },
  { cargo: 'Brita', cargoId: 'gravel', massKg: 31000, bodyType: 'dumper', trailerId: 'scs.dumper.gravel', accessory: 'cargo.gravel', trailerName: 'Basculante', trailerBrand: 'Rossetti', from: ['Mairiporã', 'Pedreira Serra Azul'], to: ['Guarulhos', 'Obras Viárias'], km: 48, income: 9800 },
  { cargo: 'Automóveis 0 km', cargoId: 'cars', massKg: 12000, bodyType: 'car_transporter', trailerId: 'scs.car_transporter.single', accessory: 'cargo.cars', trailerName: 'Cegonha', trailerBrand: 'Rodofort', from: ['São Bernardo do Campo', 'Montadora ABC'], to: ['Rio de Janeiro', 'Concessionária Guanabara'], km: 440, income: 52700, wheelR: 0.38, axleZ: [7.9, 8.9, 9.9] },
  { cargo: 'Gado de corte', cargoId: 'cattle', massKg: 17000, bodyType: 'livestock', trailerId: 'scs.livestock.cattle', accessory: 'cargo.cattle', trailerName: 'Boiadeiro', trailerBrand: 'Pastre', from: ['Barretos', 'Fazenda Boa Vista'], to: ['Presidente Prudente', 'Frigorífico Oeste'], km: 330, income: 36900 },
];

/** Duração de um frete no DEMO: um ciclo completo de condução (parado → estrada → parada). */
export const DEMO_JOB_SECONDS = 300; // 4 min de viagem + 1 min parado na doca (tempo para assinar o canhoto)

/** Gerador pseudo-aleatório determinístico (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class DemoSimulator {
  private t = 0; // segundos simulados
  private speed = 0; // m/s
  private odometer = 284_512.3;
  private fuel = 612;
  private gameMinutes = 3 * 1440 + 17 * 60 + 40; // quinta 17:40
  private truckIndex = 0;
  private freightIndex = 0;
  private jobStartOdometer = 284_512.3;
  private lastCycle = 0;
  private jobStartGame = -1;
  private suspPhase = 0;
  private readonly random: () => number;

  constructor(seed = 42) {
    this.random = rng(seed);
  }

  /** Frete atual do DEMO (troca a cada entrega simulada). */
  get freight(): DemoFreight {
    return DEMO_FREIGHTS[this.freightIndex];
  }

  setFreight(index: number) {
    this.freightIndex = ((index % DEMO_FREIGHTS.length) + DEMO_FREIGHTS.length) % DEMO_FREIGHTS.length;
    this.jobStartOdometer = this.odometer;
  }

  setTruck(index: number) {
    this.truckIndex = ((index % DEMO_TRUCKS.length) + DEMO_TRUCKS.length) % DEMO_TRUCKS.length;
  }

  /** Avança dt segundos e retorna o novo estado. */
  next(dt: number): RawTelemetry {
    this.t += dt;
    const cycle = this.t % DEMO_JOB_SECONDS; // ciclo de 5 min: parado → acelera → cruzeiro → freia → doca
    // fim do ciclo = entrega concluída → próximo frete (outra carga, outro reboque); outro caminhão a cada 3 fretes
    const cycleIndex = Math.floor(this.t / DEMO_JOB_SECONDS);
    if (cycleIndex !== this.lastCycle) {
      this.lastCycle = cycleIndex;
      this.setFreight(this.freightIndex + 1);
      if (this.freightIndex % 3 === 0) this.setTruck(this.truckIndex + 1);
    }
    const fr = DEMO_FREIGHTS[this.freightIndex];
    // ── eventos de gameplay simulados (mesmos canais do SDK; o servidor detecta a borda de subida) ──
    const job = cycleIndex; // nº do frete desde o início do DEMO
    const win = (a: number, b: number) => cycle >= a && cycle < b;
    const onJob = cycle >= 3 && cycle < 237;
    if (cycle < 3 && this.jobStartGame !== -1) this.jobStartGame = -1;
    if (onJob && this.jobStartGame === -1) this.jobStartGame = Math.floor(this.gameMinutes);
    const jobStart = this.jobStartGame > 0 ? this.jobStartGame : Math.floor(this.gameMinutes);
    const damage = job % 4 === 3 ? 0.087 : 0.004 + (job % 3) * 0.006;
    const refuelPhase = job % 2 === 0 ? (win(5, 9) ? 'filling' : win(9, 9.6) ? 'paid' : null) : null;
    const events = {
      jobDelivered: win(235, 236),
      jobDeliveredRevenue: Math.round(fr.income / 15),
      jobDeliveredCargoDamage: damage,
      jobDeliveredDistanceKm: fr.km * 0.98,
      jobDeliveredDeliveryTime: Math.round(fr.km / 70 * 60 * 1.05),
      jobDeliveredEarnedXp: Math.round(fr.km * 0.9),
      jobDeliveredAutoparkUsed: job % 5 === 4,
      jobDeliveredAutoloadUsed: false,
      jobFinished: win(235, 236),
      fined: job % 3 === 1 && win(215, 215.6),
      fineOffence: job % 6 === 4 ? 'red_signal' : 'speeding',
      fineAmount: job % 6 === 4 ? 1200 : 650,
      tollgate: win(95, 95.6) || (fr.km > 400 && win(175, 175.6)),
      tollgatePayAmount: 18 + (job % 5) * 7,
      ferry: job % 4 === 2 && win(40, 40.6),
      ferrySourceName: 'Niterói',
      ferryTargetName: 'Rio de Janeiro',
      ferryPayAmount: 74,
      refuel: refuelPhase === 'filling',
      refuelPayed: refuelPhase === 'paid',
      refuelAmount: refuelPhase ? 286.4 + (job % 4) * 31.2 : 0,
    };
    let target: number;
    if (cycle < 12) target = 0;
    else if (cycle < 70) target = 24; // ~86 km/h
    else if (cycle < 150) target = 22.2; // 80 km/h (cruzeiro)
    else if (cycle < 200) target = 16.6; // 60 km/h
    else if (cycle < 228) target = 25.5; // acima do limite
    else target = 0;
    const accel = target > this.speed ? 1.1 : -2.4;
    const prev = this.speed;
    this.speed = Math.max(0, Math.min(target > this.speed ? target : 40, this.speed + accel * dt));
    if ((accel > 0 && this.speed > target) || (accel < 0 && this.speed < target)) this.speed = target;
    const kmh = this.speed * 3.6;

    this.odometer += (this.speed * dt) / 1000;
    const lPerKm = 0.29 + (accel > 0 && this.speed < target ? 0.18 : 0);
    this.fuel = Math.max(0, this.fuel - (this.speed * dt / 1000) * lPerKm - (kmh < 1 ? 0.0005 * dt : 0));
    if (this.fuel < 30) this.fuel = 612; // "reabastece"
    this.gameMinutes += (dt * 19) / 60;

    const gearsFwd = 12;
    const gear = kmh < 0.5 ? 0 : Math.min(gearsFwd, Math.max(1, Math.ceil(kmh / 7.5)));
    const ratioInGear = (kmh % 7.5) / 7.5;
    const rpm = gear === 0 ? 650 : 1000 + ratioInGear * 700 + (gear > 10 ? 120 : 0);

    const hour = Math.floor((this.gameMinutes % 1440) / 60);
    const night = hour >= 19 || hour < 6;
    const braking = accel < 0 && this.speed > 0.1;
    const blinkPhase = Math.floor(this.t / 0.4) % 2 === 0;
    const leftSignal = cycle > 60 && cycle < 68;
    const rightSignal = cycle > 196 && cycle < 204;
    const hazard = cycle > 228 && cycle < 236;
    const wipers = Math.floor(this.t / 90) % 2 === 1;

    // suspensão: ondulação da pista + ruído, proporcional à velocidade
    this.suspPhase += dt * (1.2 + kmh / 40);
    const bump = () => (Math.sin(this.suspPhase) * 0.012 + (this.random() - 0.5) * 0.006) * Math.min(1, kmh / 30);
    const truckDef = DEMO_TRUCKS[this.truckIndex];
    const wheelZ = [-1.9, -1.9, 1.7, 1.7, 3.05, 3.05];
    const wheels: RawWheel[] = wheelZ.map((z, i) => ({
      ...emptyWheel(),
      positionX: i % 2 === 0 ? -1.05 : 1.05,
      positionY: 0.52,
      positionZ: z,
      radius: 0.52,
      suspDeflection: -0.012 + (i >= 2 ? 0.018 : 0) + bump(),
      powered: i === 2 || i === 3,
      steerable: i < 2,
      liftable: i >= 4,
      substance: 1,
    }));
    const trailerZ = (fr.axleZ ?? [6.4, 7.7, 9.0]).flatMap((z) => [z, z]);
    const tR = fr.wheelR ?? 0.5;
    const trailer: RawTrailer = {
      ...emptyTrailer(),
      attached: true,
      id: fr.trailerId,
      cargoAccessoryId: fr.accessory,
      bodyType: fr.bodyType,
      brandId: fr.trailerBrand.toLowerCase(),
      brand: fr.trailerBrand,
      name: fr.trailerName,
      chainType: 'single',
      licensePlate: 'DEMO-1234',
      wheelCount: 6,
      wearChassis: 0.06,
      wearWheels: 0.11,
      wearBody: 0.04,
      wheels: trailerZ.map((z, i) => ({
        ...emptyWheel(),
        positionX: i % 2 === 0 ? -1.0 : 1.0,
        positionY: tR,
        positionZ: z,
        radius: tR,
        suspDeflection: 0.02 + bump() * 1.4,
        substance: 1,
      })),
    };

    const raw: RawTelemetry = {
      ...emptyRaw(),
      time: BigInt(Math.round(this.t * 1e6)),
      simulatedTime: BigInt(Math.round(this.t * 1e6)),
      versionMajor: 1,
      versionMinor: 18,
      telemetryVersionMajor: 1,
      telemetryVersionMinor: 14,
      timeAbs: Math.floor(this.gameMinutes),
      restStop: 512 - Math.floor(this.t / 6),
      gears: gearsFwd,
      gearsReverse: 4,
      retarderStepCount: 4,
      truckWheelCount: wheels.length,
      fuelCapacity: 800,
      fuelWarningFactor: 0.15,
      adblueCapacity: 80,
      airPressureWarning: 65,
      airPressureEmergency: 40,
      oilPressureWarning: 10,
      waterTemperatureWarning: 105,
      batteryVoltageWarning: 22,
      engineRpmMax: 2500,
      cargoMass: fr.massKg,
      isCargoLoaded: true,
      truckBrandId: truckDef.brandId,
      truckBrand: truckDef.brand,
      truckId: truckDef.id,
      truckName: truckDef.name,
      truckLicensePlate: 'TPL-1D23',
      truckLicensePlateCountry: 'Brasil',
      truckLicensePlateCountryId: 'brazil',
      shifterType: 'automatic',
      speed: this.speed,
      engineRpm: rpm,
      gear,
      gearDashboard: gear,
      throttle: accel > 0 && this.speed < target ? 0.75 : this.speed > 0 ? 0.25 : 0,
      brake: braking ? 0.4 : 0,
      cruiseControl: cycle >= 70 && cycle < 150,
      cruiseControlSpeed: cycle >= 70 && cycle < 150 ? 22.2 : 0,
      airPressure: 120 - (braking ? 6 : 0),
      brakeTemperature: 40 + (braking ? 60 : 0),
      fuel: this.fuel,
      fuelAvgConsumption: 0.312,
      fuelRange: this.fuel / 0.312,
      adblue: 61,
      oilPressure: 52 + rpm / 100,
      oilTemperature: 92 + Math.min(10, this.t / 30),
      waterTemperature: 86 + Math.min(6, this.t / 40),
      batteryVoltage: 27.8,
      lightsDashboard: night ? 0.8 : 0,
      wearEngine: 0.031,
      wearTransmission: 0.027,
      wearCabin: 0.012,
      wearChassis: 0.044,
      wearWheels: 0.083,
      odometer: this.odometer,
      // DEMO: o percurso inteiro "passa" em um ciclo de 4 min, para os avisos do despachante aparecerem
      routeDistance: onJob ? Math.max(0, fr.km * 1000 * (1 - Math.min(1, (cycle - 3) / 230))) : 0,
      routeTime: onJob ? Math.round((fr.km / 70) * 3600 * (1 - Math.min(1, (cycle - 3) / 230))) : 0,
      speedLimit: cycle < 150 ? 22.22 : 16.67,
      retarderBrake: braking && kmh > 40 ? 2 : 0,
      lightsAuxFront: night ? 1 : 0,
      lightsAuxRoof: night && kmh > 60 ? 2 : 0,
      accelerationZ: -(this.speed - prev) / Math.max(dt, 0.001),
      parkBrake: kmh < 0.1 && cycle < 6,
      motorBrake: braking && kmh > 30,
      electricEnabled: true,
      engineEnabled: true,
      wipers,
      blinkerLeftActive: leftSignal || hazard,
      blinkerRightActive: rightSignal || hazard,
      blinkerLeftOn: (leftSignal || hazard) && blinkPhase,
      blinkerRightOn: (rightSignal || hazard) && blinkPhase,
      lightsParking: true,
      lightsBeamLow: true,
      lightsBeamHigh: night && kmh > 70,
      lightsBeacon: cycle > 228,
      lightsBrake: braking,
      lightsReverse: false,
      lightsHazard: hazard,
      wheels,
      onJob,
      cargo: fr.cargo,
      citySrc: fr.from[0],
      compSrc: fr.from[1],
      cityDst: fr.to[0],
      compDst: fr.to[1],
      jobIncome: Math.round(fr.income / 15), // tabela em R$ → € aproximado (o jogo informa em €)
      jobMarket: 'freight_market',
      plannedDistanceKm: fr.km,
      cargoDamage: onJob ? damage * Math.min(1, Math.max(0, (cycle - 3) / 220)) : 0,
      cargoId: fr.cargoId,
      unitCount: 24,
      citySrcId: fr.from[0].toLowerCase(),
      compSrcId: fr.from[1].toLowerCase(),
      cityDstId: fr.to[0].toLowerCase(),
      compDstId: fr.to[1].toLowerCase(),
      timeAbsDelivery: jobStart + Math.round((fr.km / 60) * 60 * 1.6 + 240),
      jobStartingTime: jobStart,
      ...events,
      substances: ['static', 'road', 'dirt', 'grass'],
      trailers: [trailer],
    };
    return raw;
  }
}
