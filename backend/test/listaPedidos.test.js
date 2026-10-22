import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textoListaPedidos } from '../src/logic/listaPedidos.js';

const EJEMPLO = [
  { comensal: 'KELLY', entrada: 'Ocopa', fondo: 'Corvina en salsa alfredo' },
  { comensal: 'KAREN', entrada: 'Sopa de casa', fondo: 'Pollo a la plancha' },
  { comensal: 'EBER', entrada: 'Ocopa', fondo: 'Pollo al horno con lentejas' },
  { comensal: 'Janett', entrada: 'Ensalada mixta', fondo: 'Pollo a la plancha' },
  { comensal: 'Brissa', entrada: 'Ensalada mixta', fondo: 'Pollo al horno con lentejas' },
  { comensal: 'Ruben', entrada: 'Alita broaster', fondo: null },
];

test('cuenta menus criollos y entradas en la cabecera', () => {
  const texto = textoListaPedidos(EJEMPLO);
  assert.equal(texto.split('\n')[0], '5 Menus Criollos + 1 entrada');
});

test('agrupa el menu completo por comensal', () => {
  const texto = textoListaPedidos(EJEMPLO);
  assert.ok(texto.includes('Menus Criollos (KELLY)\n1 Ocopa\n1 Corvina en salsa alfredo'));
});

test('marca la orden sin fondo como Solo entrada', () => {
  const texto = textoListaPedidos(EJEMPLO);
  assert.ok(texto.includes('Solo entrada (Ruben)\n1 Alita broaster'));
});

test('separa cada comensal con una linea de guiones', () => {
  const texto = textoListaPedidos(EJEMPLO);
  const separadores = texto.split('\n').filter((l) => /^_+$/.test(l));
  assert.equal(separadores.length, 6);
  assert.equal(separadores[0].length, 12);
});

test('cabecera pluraliza entradas', () => {
  const texto = textoListaPedidos([
    { comensal: 'ANA', entrada: 'Ocopa', fondo: null },
    { comensal: 'LUIS', entrada: 'Huancaina', fondo: null },
  ]);
  assert.equal(texto.split('\n')[0], '2 entradas');
});

test('cabecera de un solo menu completo', () => {
  const texto = textoListaPedidos([
    { comensal: 'ANA', entrada: 'Ocopa', fondo: 'Arroz con pollo' },
  ]);
  assert.equal(texto.split('\n')[0], '1 Menus Criollos');
});

test('sin pedidos devuelve un aviso', () => {
  assert.equal(textoListaPedidos([]), '0 pedidos');
});

test('las instrucciones aparecen debajo del nombre y antes del siguiente comensal', () => {
  const texto = textoListaPedidos([
    { comensal: 'KELLY', entrada: 'Ocopa', fondo: 'Arroz con pollo', instrucciones: 'sin cebolla' },
    { comensal: 'RUBEN', entrada: 'Alita broaster', fondo: null },
  ]);
  assert.ok(
    texto.includes('Menus Criollos (KELLY)\n> sin cebolla\n1 Ocopa\n1 Arroz con pollo')
  );
  // La línea de instrucciones queda antes del separador del siguiente comensal.
  const lineas = texto.split('\n');
  const separador = '_'.repeat(12);
  assert.ok(lineas.indexOf('> sin cebolla') < lineas.lastIndexOf(separador));
  assert.ok(lineas.indexOf('> sin cebolla') < lineas.indexOf('Solo entrada (RUBEN)'));
});

test('un pedido sin instrucciones no muestra la línea de instrucciones', () => {
  const texto = textoListaPedidos([
    { comensal: 'KELLY', entrada: 'Ocopa', fondo: 'Arroz con pollo' },
    { comensal: 'RUBEN', entrada: 'Alita broaster', fondo: null, instrucciones: '   ' },
  ]);
  assert.ok(!texto.includes('>'));
  assert.ok(texto.includes('Menus Criollos (KELLY)\n1 Ocopa'));
});
