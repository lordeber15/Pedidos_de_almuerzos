import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularPrecioBase, esCeviche } from '../src/logic/precios.js';

const PRECIOS = {
  entrada_fondo: 15,
  ceviche_fondo: 18,
  solo_entrada: 6,
  solo_ceviche: 8,
};

test('entrada con fondo normal cuesta 15', () => {
  assert.equal(calcularPrecioBase('Sopa de casa', 'Pollo al horno', PRECIOS), 15);
});

test('ceviche con fondo cuesta 18', () => {
  assert.equal(calcularPrecioBase('Ceviche', 'Pollo al horno', PRECIOS), 18);
});

test('solo entrada normal cuesta 6', () => {
  assert.equal(calcularPrecioBase('Ocopa', null, PRECIOS), 6);
});

test('solo ceviche cuesta 8', () => {
  assert.equal(calcularPrecioBase('Ceviche', null, PRECIOS), 8);
});

test('detecta ceviche sin importar mayusculas', () => {
  assert.equal(esCeviche('CEVICHE'), true);
  assert.equal(calcularPrecioBase('Ceviche del dia', null, PRECIOS), 8);
});

test('fondo vacio cuenta como solo entrada', () => {
  assert.equal(calcularPrecioBase('Ensalada mixta', '', PRECIOS), 6);
});
