import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { pinLookup } from '../logic/pin.js';
import { pedidoConMonto } from '../logic/totales.js';
import { estadoCierre } from '../logic/cierre.js';
import { deudasPendientes, resumenDeuda, tieneExcepcion } from '../logic/deudas.js';
import { hoy } from './pedidos.js';

export const routerComensales = Router();

const FORMATO_PIN = /^\d{4}$/;

// POST /api/comensales/registro  { nombre, pin }
// Crea el comensal con el PIN hasheado. El PIN es unico e irrepetible:
// la llave de busqueda (pin_lookup) tiene indice unico en la base de datos.
routerComensales.post('/registro', async (req, res) => {
  const { nombre, pin } = req.body || {};
  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  }
  if (!FORMATO_PIN.test(String(pin))) {
    return res.status(400).json({ error: 'El PIN debe tener exactamente 4 digitos.' });
  }

  const hash = await bcrypt.hash(String(pin), 10);
  const lookup = pinLookup(String(pin));
  try {
    const { rows } = await query(
      'INSERT INTO comensales (nombre, pin_hash, pin_lookup) VALUES ($1, $2, $3) RETURNING id, nombre',
      [String(nombre).trim(), hash, lookup]
    );
    return res.status(201).json({ id: rows[0].id, nombre: rows[0].nombre });
  } catch (err) {
    // Unicidad de PIN garantizada por el indice unico sobre pin_lookup
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese PIN ya esta en uso. Elige otro PIN.' });
    }
    throw err;
  }
});

const PIN_NO_REGISTRADO = 'PIN_NO_REGISTRADO';

// POST /api/comensales/identificar  { pin }
// Reidentifica por PIN: devuelve el nombre asociado sin volver a registrarse.
routerComensales.post('/identificar', async (req, res) => {
  const { pin } = req.body || {};
  if (!FORMATO_PIN.test(String(pin))) {
    return res.status(400).json({ error: 'El PIN debe tener exactamente 4 digitos.' });
  }

  const lookup = pinLookup(String(pin));
  const { rows } = await query(
    'SELECT id, nombre, pin_hash FROM comensales WHERE pin_lookup = $1',
    [lookup]
  );
  const fila = rows[0];
  // `codigo` confirma que se consultó la base y el PIN no existe: el
  // frontend lo usa para dar la bienvenida y pedir el nombre, sin confundirlo
  // con cualquier otro 404 (por ejemplo una URL de API mal configurada).
  if (!fila) {
    return res.status(404).json({ error: 'PIN no registrado.', codigo: PIN_NO_REGISTRADO });
  }
  // Verificacion extra con bcrypt por si hubiera una colision de la llave
  const ok = await bcrypt.compare(String(pin), fila.pin_hash);
  if (!ok) {
    return res.status(404).json({ error: 'PIN no registrado.', codigo: PIN_NO_REGISTRADO });
  }

  // Devuelve el pedido del dia si ya existe: cada comensal solo puede pedir
  // un menu por dia, y la pantalla publica debe mostrarlo en vez del form.
  // No incluye precio_base mientras el dia esta abierto: el costo se expone
  // recien cuando el dia cerro (corte horario o cierre manual), porque el
  // delivery se reparte entre el total de pedidos y aun pueden entrar mas
  // comensales.
  const fecha = hoy();
  const { rows: pedidoHoy } = await query(
    'SELECT id, entrada, fondo, estado, fecha FROM pedidos WHERE comensal_id = $1 AND fecha = $2',
    [fila.id, fecha]
  );

  let pedido = pedidoHoy[0] || null;
  if (pedido) {
    const cierre = await estadoCierre(pedido.fecha);
    const pedidosDia = cierre.cerrado
      ? (
          await query(
            'SELECT id, precio_base, estado FROM pedidos WHERE fecha = $1',
            [pedido.fecha]
          )
        ).rows
      : [];
    const deliveryTotal = Number(process.env.DELIVERY_TOTAL || 5);
    pedido = pedidoConMonto(pedido, pedidosDia, deliveryTotal, cierre.cerrado);
  }

  // Deuda de dias anteriores: la pantalla avisa apenas se identifica, sin
  // esperar a que intente pedir. Con excepcion vigente puede pedir igual.
  const deudas = await deudasPendientes(fecha, fila.id);
  const excepcionHoy = await tieneExcepcion(fila.id, fecha, deudas);

  return res.json({
    id: fila.id,
    nombre: fila.nombre,
    pedido_hoy: pedido,
    deuda_pendiente: resumenDeuda(deudas),
    excepcion_hoy: excepcionHoy,
  });
});
