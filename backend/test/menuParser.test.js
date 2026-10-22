import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMenu, MenuFormatError } from '../src/logic/menuParser.js';

// Texto de ejemplo tal como lo pega el administrador (del brief del usuario)
const TEXTO_EJEMPLO = `!Buenos dias

          MENU CRIOLLO.  15.00

 *ENTRADAS* 

Sopa de casa
Alita broaster
Ocopa
Ensalada mixta
Ceviche.... 18

 *FONDOS*
 
Pollo al horno con lentejas
Pescado frito con lentejas
Corvina en salsa alfredo
Jalea marina
Churrasco a la ocopa
Chicharron de pescado
Pollo a la plancha 

REFRESCO
maracuya



*Los pagos con yape son previo al envio de su pedido, requerimos la captura para confirmar la veracidad del pago.

Pagos con tarjeta recarga de 5%

INDICAR POR FAVOR
DIRECCION EXACTA
MEDIO DE PAGO
Efectivo 
Tarjeta, pos
Yape

#fuerzaPeru💪`;

test('extrae entradas entre ENTRADAS y FONDOS', () => {
  const { entradas } = parseMenu(TEXTO_EJEMPLO);
  assert.ok(entradas.includes('Sopa de casa'));
  assert.ok(entradas.includes('Alita broaster'));
  assert.ok(entradas.includes('Ocopa'));
  assert.ok(entradas.includes('Ensalada mixta'));
  assert.ok(entradas.some((e) => e.startsWith('Ceviche')));
});

test('extrae fondos entre FONDOS y REFRESCO', () => {
  const { fondos } = parseMenu(TEXTO_EJEMPLO);
  assert.ok(fondos.includes('Pollo al horno con lentejas'));
  assert.ok(fondos.includes('Jalea marina'));
  assert.ok(fondos.includes('Pollo a la plancha'));
});

test('no incluye el encabezado ni las notas al pie en platos', () => {
  const { entradas, fondos } = parseMenu(TEXTO_EJEMPLO);
  assert.ok(!entradas.some((e) => e.includes('MENU CRIOLLO')));
  assert.ok(!fondos.some((f) => f.includes('Los pagos con yape')));
  assert.ok(!fondos.some((f) => f.includes('DIRECCION EXACTA')));
  assert.ok(!fondos.some((f) => f.includes('fuerzaPeru')));
  assert.ok(!fondos.some((f) => f.includes('maracuya'))); // REFRESCO no es fondo
});

test('rechaza texto sin la marca ENTRADAS', () => {
  assert.throws(() => parseMenu('MENU CRIOLLO\n*FONDOS*\nPollo'), MenuFormatError);
});

test('rechaza texto sin la marca FONDOS', () => {
  assert.throws(() => parseMenu('*ENTRADAS*\nSopa'), MenuFormatError);
});

test('rechaza texto donde FONDOS viene antes de ENTRADAS', () => {
  assert.throws(
    () => parseMenu('*FONDOS*\nPollo\n*ENTRADAS*\nSopa'),
    MenuFormatError
  );
});

test('rechaza texto vacio', () => {
  assert.throws(() => parseMenu('   '), MenuFormatError);
});

test('acepta texto sin REFRESCO (fondos hasta el final)', () => {
  const { fondos } = parseMenu('*ENTRADAS*\nSopa\nCeviche\n*FONDOS*\nPollo al horno\nPescado frito');
  assert.deepEqual(fondos, ['Pollo al horno', 'Pescado frito']);
});
