// Deudas pendientes de los comensales.
// Una deuda es un pedido `pendiente` de un dia anterior a hoy, este o no
// cerrado ese dia. Quien tiene deuda no puede pedir, salvo que el
// administrador le de una excepcion para hoy (se puede repetir cada dia).
// El monto de cada deuda sale del mismo `resumir()` de cobros, asi coincide
// con lo que ve el administrador (precio base + parte del delivery).

import { query } from '../db/pool.js';
import { resumir } from './totales.js';

function deliveryTotal() {
  return Number(process.env.DELIVERY_TOTAL || 5);
}

// Nucleo puro: a partir de TODOS los pedidos de los dias involucrados (el
// reparto del delivery depende del dia completo) devuelve las deudas de
// fechas anteriores a `hoy`, opcionalmente de un solo comensal.
export function calcularDeudas(pedidos, delivery, { hoy, comensalId = null } = {}) {
  const porFecha = new Map();
  for (const p of pedidos) {
    if (!porFecha.has(p.fecha)) porFecha.set(p.fecha, []);
    porFecha.get(p.fecha).push(p);
  }

  const deudas = [];
  for (const [fecha, lista] of [...porFecha].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (hoy && fecha >= hoy) continue;
    for (const p of resumir(lista, delivery).pedidos) {
      if (p.estado !== 'pendiente') continue;
      if (comensalId !== null && Number(p.comensal_id) !== Number(comensalId)) continue;
      deudas.push({
        id: p.id,
        comensal_id: p.comensal_id,
        comensal: p.comensal,
        fecha,
        entrada: p.entrada,
        fondo: p.fondo,
        monto: p.total,
      });
    }
  }
  return deudas;
}

// Suma en centavos enteros para no arrastrar errores de punto flotante.
export function sumarMontos(deudas) {
  return deudas.reduce((acc, d) => acc + Math.round(d.monto * 100), 0) / 100;
}

// { total, detalle } o null si no hay deuda.
export function resumenDeuda(deudas) {
  if (!deudas.length) return null;
  return {
    total: sumarMontos(deudas),
    detalle: deudas.map(({ id, fecha, entrada, fondo, monto }) => ({
      id,
      fecha,
      entrada,
      fondo,
      monto,
    })),
  };
}

// Agrupa las deudas por comensal para la vista del administrador.
export function agruparPorComensal(deudas) {
  const grupos = new Map();
  for (const d of deudas) {
    if (!grupos.has(d.comensal_id)) {
      grupos.set(d.comensal_id, { comensal_id: d.comensal_id, comensal: d.comensal, pedidos: [] });
    }
    grupos.get(d.comensal_id).pedidos.push(d);
  }
  return [...grupos.values()]
    .map((g) => ({ ...g, total: sumarMontos(g.pedidos) }))
    .sort((a, b) => a.comensal.localeCompare(b.comensal, 'es'));
}

// "21/10" a partir de "2026-10-21".
function diaMes(fecha) {
  const [, mes, dia] = fecha.split('-');
  return `${dia}/${mes}`;
}

// Mensaje para el comensal bloqueado por deuda.
export function mensajeDeuda(resumen) {
  const fechas = [...new Set(resumen.detalle.map((d) => diaMes(d.fecha)))];
  const dias =
    fechas.length === 1
      ? `pedido del ${fechas[0]}`
      : `pedidos del ${fechas.slice(0, -1).join(', ')} y ${fechas[fechas.length - 1]}`;
  return `Tienes una deuda pendiente de S/ ${resumen.total.toFixed(2)} (${dias}). Para hacer tu pedido debes cancelarla.`;
}

// Nucleo puro: pedidos pendientes que impiden cerrar un dia. Un pedido
// pendiente no bloquea si su comensal tiene una excepcion (`excepcion`
// true): queda como deuda acumulada.
export function pendientesSinExcepcion(pedidos) {
  return pedidos.filter((p) => p.estado !== 'pagado' && !p.excepcion);
}

// Deudas (fecha < hoy) desde la base; con `comensalId` solo las suyas.
export async function deudasPendientes(hoy, comensalId = null) {
  const { rows } = await query(
    `SELECT p.id, p.comensal_id, c.nombre AS comensal,
            to_char(p.fecha, 'YYYY-MM-DD') AS fecha,
            p.entrada, p.fondo, p.precio_base, p.estado
     FROM pedidos p
     JOIN comensales c ON c.id = p.comensal_id
     WHERE p.fecha IN (
       SELECT DISTINCT fecha FROM pedidos
       WHERE estado = 'pendiente' AND fecha < $1
         AND ($2::int IS NULL OR comensal_id = $2)
     )
     ORDER BY p.fecha, p.id`,
    [hoy, comensalId]
  );
  return calcularDeudas(rows, deliveryTotal(), { hoy, comensalId });
}

// El comensal tiene excepcion para pedir en esa fecha?
export async function tieneExcepcion(comensalId, fecha) {
  const { rows } = await query(
    'SELECT 1 FROM excepciones_deuda WHERE comensal_id = $1 AND fecha = $2',
    [comensalId, fecha]
  );
  return Boolean(rows[0]);
}
