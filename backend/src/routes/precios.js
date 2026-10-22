import { Router } from 'express';
import { query } from '../db/pool.js';
import { requiereAdmin } from '../auth.js';

export const routerPrecios = Router();

const TIPOS = ['entrada_fondo', 'ceviche_fondo', 'solo_entrada', 'solo_ceviche'];

// GET /api/precios  (admin)
routerPrecios.get('/', requiereAdmin, async (req, res) => {
  const { rows } = await query('SELECT tipo, monto FROM precios ORDER BY id');
  return res.json(rows);
});

// PUT /api/precios  { entrada_fondo, ceviche_fondo, solo_entrada, solo_ceviche }  (admin)
routerPrecios.put('/', requiereAdmin, async (req, res) => {
  const cuerpo = req.body || {};
  const actualizaciones = TIPOS.filter((t) => cuerpo[t] !== undefined);
  if (actualizaciones.length === 0) {
    return res.status(400).json({ error: 'No se recibio ningun precio para actualizar.' });
  }
  for (const tipo of actualizaciones) {
    const monto = Number(cuerpo[tipo]);
    if (!Number.isFinite(monto) || monto < 0) {
      return res.status(400).json({ error: `Precio invalido para ${tipo}.` });
    }
  }
  const client = await (await import('../db/pool.js')).getPool().connect();
  try {
    await client.query('BEGIN');
    for (const tipo of actualizaciones) {
      await client.query('UPDATE precios SET monto = $1 WHERE tipo = $2', [
        Number(cuerpo[tipo]).toFixed(2),
        tipo,
      ]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  const { rows } = await query('SELECT tipo, monto FROM precios ORDER BY id');
  return res.json(rows);
});
