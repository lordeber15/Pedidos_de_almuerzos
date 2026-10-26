import { Router } from 'express';
import { query } from '../db/pool.js';
import { calcularPrecioBase } from '../logic/precios.js';
import { estadoCierre } from '../logic/cierre.js';
import { deudasPendientes, mensajeDeuda, resumenDeuda, tieneExcepcion } from '../logic/deudas.js';

export const routerPedidos = Router();

async function cargarPrecios() {
  const { rows } = await query('SELECT tipo, monto FROM precios');
  const precios = {};
  for (const fila of rows) {
    precios[fila.tipo] = Number(fila.monto);
  }
  return precios;
}

// Fecha "hoy" segun la zona horaria configurada (TZ, por defecto America/Lima)
function hoy() {
  const tz = process.env.TZ || 'America/Lima';
  return new Date().toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
}

// Menu del dia: el activo publicado en la fecha dada (zona horaria TZ). Un
// menu de un dia anterior que no se llego a cerrar no vale para pedir hoy.
async function menuDelDia(fecha) {
  const tz = process.env.TZ || 'America/Lima';
  const { rows } = await query(
    `SELECT id, entradas, fondos, creado_en FROM menus
     WHERE activo = true AND (creado_en AT TIME ZONE $1)::date = $2
     LIMIT 1`,
    [tz, fecha]
  );
  return rows[0] || null;
}

// Longitud maxima de las instrucciones adicionales del pedido.
const MAX_INSTRUCCIONES = 300;

// Normaliza las instrucciones opcionales: una sola linea y hasta 300
// caracteres. Devuelve { error } cuando no son validas.
function normalizarInstrucciones(valor) {
  if (valor === undefined || valor === null) return { instrucciones: null };
  const limpias = String(valor).replace(/\s+/g, ' ').trim();
  if (!limpias) return { instrucciones: null };
  if (limpias.length > MAX_INSTRUCCIONES) {
    return {
      error: `Las instrucciones no pueden superar ${MAX_INSTRUCCIONES} caracteres.`,
    };
  }
  return { instrucciones: limpias };
}

// POST /api/pedidos  { comensal_id, entrada, fondo?, instrucciones? }
// Registra el pedido con el precio segun la combinación elegida.
routerPedidos.post('/', async (req, res) => {
  const { comensal_id, entrada, fondo, instrucciones } = req.body || {};
  if (!comensal_id) {
    return res.status(400).json({ error: 'El comensal es obligatorio.' });
  }
  if (!entrada || !String(entrada).trim()) {
    return res.status(400).json({ error: 'Debes seleccionar una entrada.' });
  }

  const instruccionNormalizada = normalizarInstrucciones(instrucciones);
  if (instruccionNormalizada.error) {
    return res.status(400).json({ error: instruccionNormalizada.error });
  }

  const comensal = await query('SELECT id FROM comensales WHERE id = $1', [comensal_id]);
  if (!comensal.rows[0]) {
    return res.status(404).json({ error: 'Comensal no encontrado.' });
  }

  // Cada comensal solo puede pedir un menu por dia.
  const fecha = hoy();

  const menu = await menuDelDia(fecha);
  if (!menu) {
    return res.status(409).json({ error: 'Aún no se ha publicado el menú del día.' });
  }

  // Dia cerrado: no se aceptan mas pedidos; el resumen ya quedo fijado.
  // Cierre manual (fila en cierres_dia) o corte por la hora configurada.
  const cierre = await estadoCierre(fecha);
  if (cierre.cerrado) {
    return res.status(409).json({
      error: cierre.cierresDia
        ? 'El día ya fue cerrado; no se pueden registrar más pedidos.'
        : `Los pedidos de hoy ya están cerrados (cierre a ${cierre.horaCierre}).`,
    });
  }

  const existente = await query(
    'SELECT entrada, fondo FROM pedidos WHERE comensal_id = $1 AND fecha = $2',
    [comensal_id, fecha]
  );
  if (existente.rows[0]) {
    const p = existente.rows[0];
    return res.status(409).json({
      error: `Ya registraste tu pedido de hoy: ${p.entrada}${
        p.fondo ? ` + ${p.fondo}` : ' (solo entrada)'
      }. Cada persona puede pedir un solo menú al día.`,
    });
  }

  // Deuda de dias anteriores: bloquea el pedido salvo excepcion vigente
  // otorgada por el administrador (el nuevo pedido se suma a la deuda).
  const deudas = await deudasPendientes(fecha, Number(comensal_id));
  const deuda = resumenDeuda(deudas);
  if (deuda && !(await tieneExcepcion(comensal_id, fecha, deudas))) {
    return res.status(409).json({
      error: mensajeDeuda(deuda),
      codigo: 'DEUDA_PENDIENTE',
      deuda,
    });
  }

  const precios = await cargarPrecios();
  const precioBase = calcularPrecioBase(String(entrada), fondo ? String(fondo) : null, precios);

  try {
    const { rows } = await query(
      `INSERT INTO pedidos (comensal_id, menu_id, entrada, fondo, precio_base, fecha, instrucciones, con_excepcion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, entrada, fondo, estado, fecha, instrucciones`,
      [
        comensal_id,
        menu.id,
        String(entrada).trim(),
        fondo ? String(fondo).trim() : null,
        precioBase.toFixed(2),
        fecha,
        instruccionNormalizada.instrucciones,
        Boolean(deuda),
      ]
    );
    // No se devuelve precio_base: el costo se calcula recién al cerrar el día.
    return res.status(201).json(rows[0]);
  } catch (err) {
    // Indice unico (comensal_id, fecha): dos pedidos simultaneos del mismo
    // comensal no pueden colar.
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Ya registraste tu pedido de hoy. Cada persona puede pedir un solo menú al día.',
      });
    }
    throw err;
  }
});

export { hoy, cargarPrecios, menuDelDia };
