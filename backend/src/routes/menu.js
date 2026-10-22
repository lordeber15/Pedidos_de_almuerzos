import { Router } from 'express';
import { query } from '../db/pool.js';
import { parseMenu, MenuFormatError } from '../logic/menuParser.js';
import { estadoCierre } from '../logic/cierre.js';
import { requiereAdmin } from '../auth.js';

export const routerMenu = Router();

// POST /api/menu/publicar  { texto }  (admin)
// Publica el menú del día pegando el texto. Desactiva el anterior y activa el nuevo.
routerMenu.post('/publicar', requiereAdmin, async (req, res) => {
  const { texto } = req.body || {};
  let menu;
  try {
    menu = parseMenu(texto);
  } catch (err) {
    if (err instanceof MenuFormatError) {
      return res.status(422).json({ error: err.message });
    }
    throw err;
  }

  const client = await (await import('../db/pool.js')).getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE menus SET activo = false WHERE activo = true');
    const { rows } = await client.query(
      `INSERT INTO menus (texto_original, entradas, fondos, activo)
       VALUES ($1, $2, $3, true) RETURNING id, entradas, fondos, creado_en`,
      [texto, JSON.stringify(menu.entradas), JSON.stringify(menu.fondos)]
    );
    await client.query('COMMIT');
    return res.status(201).json({
      id: rows[0].id,
      entradas: rows[0].entradas,
      fondos: rows[0].fondos,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /api/menu/vigente  (publico)
// Devuelve el menú del día para la pantalla pública, e indica si el día ya
// fue cerrado para no ofrecer el formulario de pedidos. Incluye la hora de
// corte y el estado del corte para el countdown (con `ahora` del servidor
// como referencia, para no depender del reloj del dispositivo).
// `estado` distingue los casos para la pantalla: 'abierto' (con menú),
// 'sin_publicar' (hoy aún no se publica: hay que esperar) o 'cerrado' (el
// día se cerró, lo que además retira el menú, o pasó la hora de corte).
// Sin menú no se incluyen platos ni countdown.
routerMenu.get('/vigente', async (req, res) => {
  const { hoy, menuDelDia } = await import('./pedidos.js');
  const fecha = hoy();
  const [menu, cierre] = await Promise.all([menuDelDia(fecha), estadoCierre(fecha)]);
  if (!menu) {
    return res.json({
      estado: cierre.cerrado ? 'cerrado' : 'sin_publicar',
      fecha,
      dia_cerrado: cierre.cierresDia,
      hora_cierre: cierre.horaCierre,
    });
  }
  return res.json({
    ...menu,
    estado: cierre.cerrado ? 'cerrado' : 'abierto',
    fecha,
    dia_cerrado: cierre.cierresDia,
    hora_cierre: cierre.horaCierre,
    pedidos_abiertos: !cierre.cerrado,
    ahora: new Date().toISOString(),
  });
});
