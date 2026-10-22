import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resumir, pedidoConMonto } from '../src/logic/totales.js';

// Dia de ejemplo: 5 pedidos, delivery 5.00 -> 1.00 por cuenta.
const PEDIDOS_DIA = [
  { id: 1, precio_base: 15, estado: 'pagado' },   // entrada con fondo
  { id: 2, precio_base: 6, estado: 'pendiente' }, // solo entrada
  { id: 3, precio_base: 18, estado: 'pagado' },   // ceviche con fondo
  { id: 4, precio_base: 15, estado: 'pagado' },
  { id: 5, precio_base: 8, estado: 'pendiente' }, // solo ceviche
];
const DELIVERY = 5;

const pedidoPublico = {
  id: 1,
  entrada: 'Sopa de casa',
  fondo: 'Pollo al horno',
  estado: 'pagado',
  fecha: '2026-10-14',
};

// --- 4.2: visibilidad del monto segun el estado del dia ---

test('dia abierto: la respuesta no contiene monto ni ningun precio', () => {
  const visto = pedidoConMonto(pedidoPublico, PEDIDOS_DIA, DELIVERY, false);
  assert.equal(visto.monto, undefined);
  assert.equal(visto.precio_base, undefined);
  assert.equal(visto.delivery, undefined);
  assert.equal(visto.total, undefined);
  // El pedido en si se conserva igual.
  assert.equal(visto.entrada, pedidoPublico.entrada);
  assert.equal(visto.fondo, pedidoPublico.fondo);
  assert.equal(visto.id, pedidoPublico.id);
});

test('dia abierto: no se expone precio aunque se pasen los pedidos del dia', () => {
  const visto = pedidoConMonto(pedidoPublico, PEDIDOS_DIA, DELIVERY, false);
  const claves = Object.keys(visto).sort();
  assert.deepEqual(claves, ['entrada', 'estado', 'fecha', 'fondo', 'id']);
});

test('dia cerrado: incluye monto y delivery del reparto', () => {
  const visto = pedidoConMonto(pedidoPublico, PEDIDOS_DIA, DELIVERY, true);
  // 15.00 + 1.00 (5 pedidos) = 16.00
  assert.equal(visto.monto, 16);
  assert.equal(visto.delivery, 1);
});

test('sin pedido no hay monto que mostrar', () => {
  assert.equal(pedidoConMonto(null, PEDIDOS_DIA, DELIVERY, true), null);
  assert.equal(pedidoConMonto(null, PEDIDOS_DIA, DELIVERY, false), null);
});

// --- 4.3: el monto del comensal coincide con el total del administrador ---

test('monto del comensal = total del mismo comensal en la vista de cobros', () => {
  const vistaAdmin = resumir(PEDIDOS_DIA, DELIVERY);
  for (const fila of vistaAdmin.pedidos) {
    const pedido = {
      id: fila.id,
      entrada: 'x',
      fondo: null,
      estado: fila.estado,
      fecha: '2026-10-14',
    };
    const visto = pedidoConMonto(pedido, PEDIDOS_DIA, DELIVERY, true);
    assert.equal(
      visto.monto,
      fila.total,
      `monto del comensal ${fila.id} debe ser igual al total del admin`
    );
  }
});

test('monto con 5 pedidos: 15.00 + 1.00 = 16.00 (reparto final)', () => {
  const visto = pedidoConMonto(
    { ...pedidoPublico, id: 1, precio_base: undefined },
    PEDIDOS_DIA,
    DELIVERY,
    true
  );
  assert.equal(visto.monto, 16);
});

test('monto de solo entradas incluye su parte de delivery', () => {
  const soloEntrada = { ...pedidoPublico, id: 2 };
  const visto = pedidoConMonto(soloEntrada, PEDIDOS_DIA, DELIVERY, true);
  // 6.00 + 1.00 = 7.00
  assert.equal(visto.monto, 7);
});

test('redondeo hacia arriba del delivery tambien llega al comensal', () => {
  // 3 pedidos: 5.00/3 = 1.666... -> 1.67 por cuenta.
  const tres = [
    { id: 1, precio_base: 15, estado: 'pendiente' },
    { id: 2, precio_base: 6, estado: 'pendiente' },
    { id: 3, precio_base: 8, estado: 'pendiente' },
  ];
  const visto = pedidoConMonto({ ...pedidoPublico, id: 1 }, tres, DELIVERY, true);
  assert.equal(visto.monto, 16.67);
  assert.equal(visto.monto, resumir(tres, DELIVERY).pedidos[0].total);
});
