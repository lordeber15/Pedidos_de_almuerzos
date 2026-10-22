import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { firmarToken, requiereAdmin } from '../auth.js';
import { horaCierre, guardarHoraCierre } from '../logic/cierre.js';

export const routerAdmin = Router();

// GET /api/admin/hora-cierre  (admin)
// Hora diaria de cierre de pedidos configurada ("HH:MM") o null (sin corte).
routerAdmin.get('/hora-cierre', requiereAdmin, async (req, res) => {
  return res.json({ hora_cierre: await horaCierre() });
});

// PUT /api/admin/hora-cierre  { hora: "HH:MM" | null | "" }  (admin)
// Guarda la hora de corte; vacio o null la desactiva. Se aplica de
// inmediato: si la nueva hora ya pasó hoy, los pedidos quedan cortados.
routerAdmin.put('/hora-cierre', requiereAdmin, async (req, res) => {
  const { hora } = req.body || {};
  try {
    const guardada = await guardarHoraCierre(hora);
    return res.json({ hora_cierre: guardada });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/login  { usuario, password }
routerAdmin.post('/login', async (req, res) => {
  const { usuario, password } = req.body || {};
  const { rows } = await query('SELECT usuario, password_hash FROM config_admin WHERE id = 1');
  const admin = rows[0];
  if (!admin) {
    return res.status(500).json({ error: 'Administrador no configurado.' });
  }
  const usuarioOk = usuario === admin.usuario;
  const passwordOk = await bcrypt.compare(String(password ?? ''), admin.password_hash);
  if (!usuarioOk || !passwordOk) {
    return res.status(401).json({ error: 'Credenciales invalidas.' });
  }
  const token = firmarToken({ rol: 'admin', usuario: admin.usuario });
  return res.json({ token });
});

// POST /api/admin/cambiar-password  { password_actual, password_nuevo }  (admin)
routerAdmin.post('/cambiar-password', requiereAdmin, async (req, res) => {
  const { password_actual, password_nuevo } = req.body || {};
  if (!password_nuevo || String(password_nuevo).length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }
  const { rows } = await query('SELECT password_hash FROM config_admin WHERE id = 1');
  const admin = rows[0];
  const ok = await bcrypt.compare(String(password_actual ?? ''), admin.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
  }
  const hash = await bcrypt.hash(String(password_nuevo), 10);
  await query('UPDATE config_admin SET password_hash = $1 WHERE id = 1', [hash]);
  return res.json({ ok: true, mensaje: 'Contraseña actualizada.' });
});
