import { describe, expect, it } from 'vitest';
import { adapterFor, readHeader, rev12Adapter, SUPPORTED_REVISIONS } from '../src/sdk/adapters.js';
import { makeRev12Buffer } from './helpers.js';

describe('SDK adapter', () => {
  it('lê o cabeçalho', () => {
    const { buf, w } = makeRev12Buffer();
    w.set('paused', true).set('time', 123456n);
    expect(readHeader(buf)).toEqual({ sdkActive: true, paused: true, time: 123456n, pluginRevision: 12 });
  });

  it('seleciona adaptador pela revisão', () => {
    expect(SUPPORTED_REVISIONS).toContain(12);
    expect(adapterFor(12)).toBe(rev12Adapter);
    expect(adapterFor(9)).toBeNull();
  });

  it('interpreta canais do caminhão, rodas, reboque e strings', () => {
    const { buf, w, trailer } = makeRev12Buffer();
    w.set('speed', 25).set('engineRpm', 1450).set('gearDashboard', -2).set('fuel', 300.5).set('fuelCapacity', 800)
      .set('truckOdometer', 123456.5).set('speedLimit', 22.2222).set('wipers', true).set('blinkerLeftOn', true)
      .set('lightsAuxRoof', 2).set('truckBrandId', 'scania').set('truckId', 'vehicle.scania.s_2016').set('truckName', 'S')
      .set('truckWheelCount', 2).set('truck_wheelSuspDeflection', 0.031, 1).set('truckWheelPositionZ', 3.4, 1)
      .set('substance', 'road', 1).set('truck_wheelSubstance', 1, 1).set('truck_wheelOnGround', true, 1)
      .set('time_abs', 1500).set('onJob', true).set('jobIncome', 12345n);
    trailer(0).set('attached', true).set('id', 'scs.box').set('wheelCount', 2).set('wheelSuspDeflection', 0.05, 0).set('wearBody', 0.2);
    const raw = rev12Adapter.parse(buf);
    expect(raw.speed).toBeCloseTo(25);
    expect(raw.engineRpm).toBeCloseTo(1450);
    expect(raw.gearDashboard).toBe(-2);
    expect(raw.fuel).toBeCloseTo(300.5);
    expect(raw.odometer).toBeCloseTo(123456.5, 1);
    expect(raw.wipers).toBe(true);
    expect(raw.blinkerLeftOn).toBe(true);
    expect(raw.blinkerRightOn).toBe(false);
    expect(raw.lightsAuxRoof).toBe(2);
    expect(raw.truckId).toBe('vehicle.scania.s_2016');
    expect(raw.wheels).toHaveLength(2);
    expect(raw.wheels[1].suspDeflection).toBeCloseTo(0.031);
    expect(raw.wheels[1].positionZ).toBeCloseTo(3.4);
    expect(raw.substances[1]).toBe('road');
    expect(raw.timeAbs).toBe(1500);
    expect(raw.jobIncome).toBe(12345);
    expect(raw.trailers[0].attached).toBe(true);
    expect(raw.trailers[0].id).toBe('scs.box');
    expect(raw.trailers[0].wheels[0].suspDeflection).toBeCloseTo(0.05);
    expect(raw.trailers[0].wearBody).toBeCloseTo(0.2);
    expect(raw.trailers[1].attached).toBe(false);
  });

  it('expõe frete, prazo, placas e eventos de gameplay (rev12)', () => {
    const { buf, w } = makeRev12Buffer();
    w.set('cargoId', 'dryfruit').set('unitCount', 24).set('citySrcId', 'calais').set('compSrcId', 'tradeaux').set('cityDstId', 'lyon')
      .set('compDstId', 'agrominta').set('time_abs_delivery', 9000).set('jobStartingTime', 7000).set('truckLicensePlate', 'TP-517-RJ')
      .set('truckLicensePlateCountryId', 'france').set('jobDelivered', true).set('jobDeliveredRevenue', 3210n)
      .set('jobDeliveredCargoDamage', 0.087).set('jobDeliveredDistanceKm', 751.5).set('jobDeliveredDeliveryTime', 1200)
      .set('jobDeliveredEarnedXp', 410).set('jobDeliveredAutoparkUsed', true).set('jobCancelled', true).set('jobCancelledPenalty', 1250n)
      .set('fined', true).set('fineOffence', 'speeding').set('fineAmount', 650n).set('tollgate', true).set('tollgatePayAmount', 42n)
      .set('ferry', true).set('ferrySourceName', 'Dover').set('ferryTargetName', 'Calais').set('ferryPayAmount', 186n)
      .set('train', true).set('trainSourceName', 'Folkestone').set('trainTargetName', 'Calais').set('trainPayAmount', 300n)
      .set('refuel', true).set('refuelPayed', true).set('refuelAmount', 412.6);
    const raw = rev12Adapter.parse(buf);
    expect(raw.cargoId).toBe('dryfruit');
    expect(raw.unitCount).toBe(24);
    expect([raw.citySrcId, raw.compSrcId, raw.cityDstId, raw.compDstId]).toEqual(['calais', 'tradeaux', 'lyon', 'agrominta']);
    expect(raw.timeAbsDelivery).toBe(9000);
    expect(raw.jobStartingTime).toBe(7000);
    expect(raw.truckLicensePlate).toBe('TP-517-RJ');
    expect(raw.truckLicensePlateCountryId).toBe('france');
    expect(raw.jobDelivered).toBe(true);
    expect(raw.jobDeliveredRevenue).toBe(3210);
    expect(raw.jobDeliveredCargoDamage).toBeCloseTo(0.087);
    expect(raw.jobDeliveredDistanceKm).toBeCloseTo(751.5);
    expect(raw.jobDeliveredDeliveryTime).toBe(1200);
    expect(raw.jobDeliveredEarnedXp).toBe(410);
    expect(raw.jobDeliveredAutoparkUsed).toBe(true);
    expect(raw.jobCancelled).toBe(true);
    expect(raw.jobCancelledPenalty).toBe(1250);
    expect(raw.fined).toBe(true);
    expect(raw.fineOffence).toBe('speeding');
    expect(raw.fineAmount).toBe(650);
    expect(raw.tollgate && raw.tollgatePayAmount).toBe(42);
    expect([raw.ferrySourceName, raw.ferryTargetName, raw.ferryPayAmount]).toEqual(['Dover', 'Calais', 186]);
    expect([raw.trainSourceName, raw.trainTargetName, raw.trainPayAmount]).toEqual(['Folkestone', 'Calais', 300]);
    expect(raw.refuelPayed).toBe(true);
    expect(raw.refuelAmount).toBeCloseTo(412.6, 1);
  });

  it('limita a contagem de rodas a 16 (proteção contra lixo)', () => {
    const { buf, w } = makeRev12Buffer();
    w.set('truckWheelCount', 9999);
    expect(rev12Adapter.parse(buf).wheels).toHaveLength(16);
  });
});
