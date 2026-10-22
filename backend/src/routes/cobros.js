import { Router } from 'express';
import { query } from '../db/pool.js';
import { requiereAdmin } from '../auth.js';
import { textoListaPedidos } from '../logic/listaPedidos.js';
import { resumir } from '../logic/totales.js';
import {
  agruparPorComensal,
  deudasPendientes,
  pendientesSinExcepcion,
} from '../logic/deudas.js';
import { hoy } from './pedidos.js';

export const routerCobros = Router();

// Pedidos de una fecha para cobros. `excepcion` indica que el comensal tiene
// una excepcion de esa fecha o posterior: su pedido impago no impide cerrar
// el dia y queda como deuda.
async function pedidosDeFecha(fecha) {
  const { rows } = await query(
    `SELECT p.id, p.comensal_id, p.entrada, p.fondo, p.precio_base, p.estado,
            p.con_excepcion, c.nombre AS comensal,
            EXISTS (
              SELECT 1 FROM excepciones_deuda e
              WHERE e.comensal_id = p.comensal_id AND e.fecha >= p.fecha
            ) AS excepcion
     FROM pedidos p
     JOIN comensales c ON c.id = p.comensal_id
     WHERE p.fecha = $1
     ORDER BY p.id`,
    [fecha]
  );
  return rows;
}

// GET /api/cobros/dia  (admin)
// Lista los pedidos del día con el precio de cada uno, el reparto del delivery
// y los totales, más el estado de cierre del día.
// Los montos se muestran desde el primer pedido: el cierre exige que todos
// estén pagados (o con excepción, que los deja como deuda), así que el administrador necesita saber cuánto cobra a cada
// comensal y cuál es el total antes de poder cerrar. El comensal, en cambio,
// nunca ve el precio.
routerCobros.get('/dia', requiereAdmin, async (req, res) => {
  const fecha = hoy();
  const pedidos = await pedidosDeFecha(fecha);

  const { rows: cierres } = await query(
    'SELECT id, total_dia, total_pagado, total_pendiente, cantidad_pedidos, cerrado_en FROM cierres_dia WHERE fecha = $1',
    [fecha]
  );
  const cierre = cierres[0] || null;
  const deliveryTotal = Number(process.env.DELIVERY_TOTAL || 5);

  // Dias anteriores a hoy que quedaron sin cerrar: conservan sus pedidos en
  // la vista (aunque ya esten pagados) hasta que el administrador los cierre.
  const { rows: fechasPendientes } = await query(
    `SELECT DISTINCT to_char(p.fecha, 'YYYY-MM-DD') AS fecha
     FROM pedidos p
     WHERE p.fecha < $1
       AND NOT EXISTS (SELECT 1 FROM cierres_dia c WHERE c.fecha = p.fecha)
     ORDER BY 1`,
    [fecha]
  );

  const diasPendientes = [];
  for (const fila of fechasPendientes) {
    const pedidosDia = await pedidosDeFecha(fila.fecha);
    const resumen = resumir(pedidosDia, deliveryTotal);
    diasPendientes.push({
      fecha: fila.fecha,
      pedidos: resumen.pedidos,
      por_comensal: resumen.porComensal,
      delivery_total: deliveryTotal,
      totales: resumen.totales,
    });
  }

  const { pedidos: resultado, porComensal, totales } = resumir(pedidos, deliveryTotal);

  return res.json({
    fecha,
    delivery_total: pedidos.length ? deliveryTotal : 0,
    por_comensal: porComensal,
    cerrado: !!cierre,
    cierre,
    totales,
    pedidos: resultado,
    dias_pendientes: diasPendientes,
  });
});

// GET /api/cobros/lista  (admin)
// Pedidos del día agrupados por comensal en texto, listo para copiar y pegar.
routerCobros.get('/lista', requiereAdmin, async (req, res) => {
  const fecha = hoy();
  const { rows: pedidos } = await query(
    `SELECT c.nombre AS comensal, p.entrada, p.fondo, p.instrucciones
     FROM pedidos p
     JOIN comensales c ON c.id = p.comensal_id
     WHERE p.fecha = $1
     ORDER BY p.id`,
    [fecha]
  );
  return res.json({
    fecha,
    cantidad: pedidos.length,
    texto: textoListaPedidos(pedidos),
    pedidos,
  });
});

// GET /api/cobros/deudas  (admin)
// Deudas de dias anteriores (cerrados o no) agrupadas por comensal, con el
// total acumulado y si ya tiene excepcion para pedir hoy.
routerCobros.get('/deudas', requiereAdmin, async (req, res) => {
  const fecha = hoy();
  const [deudas, excepciones] = await Promise.all([
    deudasPendientes(fecha),
    query('SELECT comensal_id FROM excepciones_deuda WHERE fecha = $1', [fecha]),
  ]);
  const conExcepcion = new Set(excepciones.rows.map((e) => e.comensal_id));
  const comensales = agruparPorComensal(deudas).map((g) => ({
    ...g,
    excepcion_hoy: conExcepcion.has(g.comensal_id),
  }));
  return res.json({ fecha, comensales });
});

// POST /api/cobros/excepciones  { comensal_id }  (admin)
// Excepcion de hoy: el comensal puede pedir aunque tenga deuda (el pedido se
// suma a lo que debe) y sus pedidos impagos no impiden cerrar el dia. Se
// puede otorgar cada dia, todas las veces que haga falta.
routerCobros.post('/excepciones', requiereAdmin, async (req, res) => {
  const comensalId = Number((req.body || {}).comensal_id);
  if (!Number.isInteger(comensalId) || comensalId <= 0) {
    return res.status(400).json({ error: 'El comensal es obligatorio.' });
  }
  const { rows: comensal } = await query('SELECT nombre FROM comensales WHERE id = $1', [
    comensalId,
  ]);
  if (!comensal[0]) {
    return res.status(404).json({ error: 'Comensal no encontrado.' });
  }
  const fecha = hoy();
  await query(
    `INSERT INTO excepciones_deuda (comensal_id, fecha) VALUES ($1, $2)
     ON CONFLICT (comensal_id, fecha) DO NOTHING`,
    [comensalId, fecha]
  );
  return res.status(201).json({ comensal_id: comensalId, fecha, excepcion_hoy: true });
});

// DELETE /api/cobros/excepciones/:comensal_id  (admin)
// Retira la excepcion de hoy, salvo que el comensal ya la haya usado para
// pedir con deuda.
routerCobros.delete('/excepciones/:comensal_id', requiereAdmin, async (req, res) => {
  const comensalId = Number(req.params.comensal_id);
  const fecha = hoy();
  const { rows: usada } = await query(
    'SELECT 1 FROM pedidos WHERE comensal_id = $1 AND fecha = $2 AND con_excepcion',
    [comensalId, fecha]
  );
  if (usada[0]) {
    return res.status(409).json({
      error: 'El comensal ya pidió hoy usando la excepción; no se puede retirar.',
    });
  }
  await query('DELETE FROM excepciones_deuda WHERE comensal_id = $1 AND fecha = $2', [
    comensalId,
    fecha,
  ]);
  return res.json({ comensal_id: comensalId, fecha, excepcion_hoy: false });
});

// PATCH /api/cobros/:id/estado  { estado: 'pagado' | 'pendiente' }  (admin)
// En un dia ya cerrado solo se permite cobrar una deuda (pendiente ->
// pagado); el resumen del cierre no cambia.
routerCobros.patch('/:id/estado', requiereAdmin, async (req, res) => {
  const { estado } = req.body || {};
  if (!['pagado', 'pendiente'].includes(estado)) {
    return res.status(400).json({ error: "El estado debe ser 'pagado' o 'pendiente'." });
  }

  const { rows: pedido } = await query(
    "SELECT to_char(fecha, 'YYYY-MM-DD') AS fecha, estado FROM pedidos WHERE id = $1",
    [req.params.id]
  );
  if (!pedido[0]) {
    return res.status(404).json({ error: 'Pedido no encontrado.' });
  }

  const { rows: cerrado } = await query('SELECT 1 FROM cierres_dia WHERE fecha = $1', [
    pedido[0].fecha,
  ]);
  if (cerrado[0] && !(pedido[0].estado === 'pendiente' && estado === 'pagado')) {
    return res.status(409).json({
      error: `El día ${pedido[0].fecha} ya fue cerrado; solo se puede marcar como pagada una deuda pendiente.`,
    });
  }

  const { rows } = await query(
    `UPDATE pedidos
     SET estado = $1, pagado_en = CASE WHEN $1 = 'pagado' THEN now() ELSE NULL END
     WHERE id = $2 RETURNING id, estado`,
    [estado, req.params.id]
  );
  return res.json(rows[0]);
});

// POST /api/cobros/cerrar  { fecha? }  (admin)
// Cierra el dia (por defecto hoy): exige que haya pedidos y que todos
// esten pagados, salvo los de comensales con excepcion, que quedan como
// deuda pendiente. Admite cerrar un dia anterior que quedo pendiente.
routerCobros.post('/cerrar', requiereAdmin, async (req, res) => {
  const { fecha } = req.body || {};
  if (fecha !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
    return res.status(400).json({ error: 'La fecha debe tener formato YYYY-MM-DD.' });
  }
  const fechaCierre = fecha || hoy();

  const { rows: existente } = await query(
    'SELECT id, total_dia, cerrado_en FROM cierres_dia WHERE fecha = $1',
    [fechaCierre]
  );
  if (existente[0]) {
    return res.status(409).json({ error: 'Este día ya fue cerrado.' });
  }

  const pedidos = await pedidosDeFecha(fechaCierre);
  if (pedidos.length === 0) {
    return res.status(409).json({ error: 'No hay pedidos para cerrar el día.' });
  }

  const deliveryTotal = Number(process.env.DELIVERY_TOTAL || 5);
  const { totales } = resumir(pedidos, deliveryTotal);

  const bloqueantes = pendientesSinExcepcion(pedidos);
  if (bloqueantes.length > 0) {
    const nombres = [...new Set(bloqueantes.map((p) => p.comensal))].join(', ');
    return res.status(409).json({
      error: `Quedan ${bloqueantes.length} pedido(s) sin pagar (${nombres}). Márcalos como pagados o déjalos como deuda.`,
      pendientes: bloqueantes.length,
    });
  }

  // En la misma sentencia (atomica) se retira el menu publicado ese dia o
  // antes: al cerrar hoy la pantalla publica deja de mostrarlo. Cerrar un
  // dia anterior no toca el menu ya publicado hoy.
  const { rows } = await query(
    `WITH cierre AS (
       INSERT INTO cierres_dia (fecha, total_dia, total_pagado, total_pendiente, cantidad_pedidos)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (fecha) DO NOTHING
       RETURNING id, fecha, total_dia, total_pagado, total_pendiente, cantidad_pedidos, cerrado_en
     ), retiro AS (
       UPDATE menus SET activo = false
       WHERE activo = true
         AND (creado_en AT TIME ZONE $6)::date <= $1::date
         AND EXISTS (SELECT 1 FROM cierre)
     )
     SELECT * FROM cierre`,
    [
      fechaCierre,
      totales.total_dia.toFixed(2),
      totales.total_pagado.toFixed(2),
      totales.total_pendiente.toFixed(2),
      totales.cantidad_pedidos,
      process.env.TZ || 'America/Lima',
    ]
  );
  if (!rows[0]) {
    return res.status(409).json({ error: 'Este día ya fue cerrado.' });
  }

  return res.status(201).json({ cerrado: true, cierre: rows[0] });
});
