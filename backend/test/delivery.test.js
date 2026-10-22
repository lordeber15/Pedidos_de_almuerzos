import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repartirDelivery, totalCuenta } from '../src/logic/delivery.js';

test('5 pedidos con delivery 5.00 reparten 1.00 cada uno', () => {
  assert.equal(repartirDelivery(5.0, 5), 1.0);
});

test('3 pedidos con delivery 5.00 reparten 1.67 (redondeo hacia arriba)', () => {
  assert.equal(repartirDelivery(5.0, 3), 1.67);
});

test('7 pedidos con delivery 5.00 reparten 0.72', () => {
  assert.equal(repartirDelivery(5.0, 7), 0.72);
});

test('total de cuenta con 2 decimales (15.8333333 -> 15.84)', () => {
  // 5 pedidos: 1.00 c/u; precio 14.8333333 -> total 15.84 tras redondeo
  const porComensal = repartirDelivery(5.0, 5);
  assert.equal(totalCuenta(14.8333333, porComensal), 15.84);
});

test('sin pedidos el reparto es 0', () => {
  assert.equal(repartirDelivery(5.0, 0), 0);
});

test('total de cuenta suma precio base y delivery', () => {
  assert.equal(totalCuenta(15, 1), 16);
  assert.equal(totalCuenta(6, 0.72), 6.72);
});
