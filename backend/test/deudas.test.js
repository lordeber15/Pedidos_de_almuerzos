import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  agruparPorComensal,
  calcularDeudas,
  mensajeDeuda,
  pendientesSinExcepcion,
  resumenDeuda,
} from '../src/logic/deudas.js';
import { resumir } from '../src/logic/totales.js';

const DELIVERY = 5;
const HOY = '2026-10-22';

// Dos dias anteriores y hoy. Ana (1) debe el 20 y el 21; Luis (2) pago.
const PEDIDOS = [
  // 20/10: 2 pedidos -> delivery 2.50 c/u
  { id: 1, comensal_id: 1, comensal: 'Ana', fecha: '2026-10-20', entrada: 'Sopa', fondo: 'Lomo', precio_base: 15, estado: 'pendiente' },
  { id: 2, comensal_id: 2, comensal: 'Luis', fecha: '2026-10-20', entrada: 'Sopa', fondo: 'Pollo', precio_base: 15, estado: 'pagado' },
  // 21/10: 3 pedidos -> delivery 1.67 c/u (ceil)
  { id: 3, comensal_id: 1, comensal: 'Ana', fecha: '2026-10-21', entrada: 'Ceviche', fondo: null, precio_base: 8, estado: 'pendiente' },
  { id: 4, comensal_id: 2, comensal: 'Luis', fecha: '2026-10-21', entrada: 'Sopa', fondo: 'Pollo', precio_base: 15, estado: 'pagado' },
  { id: 5, comensal_id: 3, comensal: 'Bea', fecha: '2026-10-21', entrada: 'Sopa', fondo: 'Pollo', precio_base: 15, estado: 'pendiente' },
  // Hoy: pendiente, pero todavia no es deuda.
  { id: 6, comensal_id: 2, comensal: 'Luis', fecha: HOY, entrada: 'Sopa', fondo: 'Pollo', precio_base: 15, estado: 'pendiente' },
];

test('deuda de varios dias: suma los pedidos pendientes anteriores a hoy', () => {
  const deudas = calcularDeudas(PEDIDOS, DELIVERY, { hoy: HOY, comensalId: 1 });
  assert.deepEqual(deudas.map((d) => d.id), [1, 3]);
  assert.equal(deudas[0].monto, 17.5); // 15 + 2.50
  assert.equal(deudas[1].monto, 9.67); // 8 + 1.67
  assert.equal(resumenDeuda(deudas).total, 27.17);
});

test('el monto coincide con el que ve el administrador en cobros', () => {
  const dia21 = PEDIDOS.filter((p) => p.fecha === '2026-10-21');
  const admin = resumir(dia21, DELIVERY).pedidos.find((p) => p.id === 3);
  const [, deuda] = calcularDeudas(PEDIDOS, DELIVERY, { hoy: HOY, comensalId: 1 });
  assert.equal(deuda.monto, admin.total);
});

test('el pedido pendiente de hoy no cuenta como deuda', () => {
  const deudas = calcularDeudas(PEDIDOS, DELIVERY, { hoy: HOY, comensalId: 2 });
  assert.deepEqual(deudas, []);
  assert.equal(resumenDeuda(deudas), null);
});

test('los pedidos pagados no son deuda', () => {
  const pagado = PEDIDOS.map((p) => (p.comensal_id === 1 ? { ...p, estado: 'pagado' } : p));
  assert.equal(resumenDeuda(calcularDeudas(pagado, DELIVERY, { hoy: HOY, comensalId: 1 })), null);
});

test('comensal id como texto tambien se reconoce', () => {
  const deudas = calcularDeudas(PEDIDOS, DELIVERY, { hoy: HOY, comensalId: '1' });
  assert.equal(deudas.length, 2);
});

test('sin comensal: agrupa las deudas de todos por comensal', () => {
  const grupos = agruparPorComensal(calcularDeudas(PEDIDOS, DELIVERY, { hoy: HOY }));
  assert.deepEqual(
    grupos.map((g) => [g.comensal, g.total, g.pedidos.length]),
    [
      ['Ana', 27.17, 2],
      ['Bea', 16.67, 1],
    ]
  );
});

test('mensaje con uno y con varios dias', () => {
  const uno = resumenDeuda(calcularDeudas(PEDIDOS, DELIVERY, { hoy: HOY, comensalId: 3 }));
  assert.equal(
    mensajeDeuda(uno),
    'Tienes una deuda pendiente de S/ 16.67 (pedido del 21/10). Para hacer tu pedido debes cancelarla.'
  );
  const varios = resumenDeuda(calcularDeudas(PEDIDOS, DELIVERY, { hoy: HOY, comensalId: 1 }));
  assert.match(mensajeDeuda(varios), /S\/ 27\.17 \(pedidos del 20\/10 y 21\/10\)/);
});

test('cierre: un pendiente sin excepcion bloquea, con excepcion no', () => {
  const dia = [
    { id: 1, comensal: 'Ana', estado: 'pendiente', excepcion: true },
    { id: 2, comensal: 'Luis', estado: 'pagado', excepcion: false },
  ];
  assert.deepEqual(pendientesSinExcepcion(dia), []);

  const conBloqueo = [...dia, { id: 3, comensal: 'Bea', estado: 'pendiente', excepcion: false }];
  assert.deepEqual(pendientesSinExcepcion(conBloqueo).map((p) => p.id), [3]);
});
