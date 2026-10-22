import bcrypt from 'bcryptjs';
import { query } from './pool.js';

// Crea el registro admin inicial desde .env si no existe aun.
// La contraseña puede cambiarse despues desde el panel (tabela config_admin).
export async function seedAdmin() {
  const usuario = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const { rowCount } = await query('SELECT 1 FROM config_admin WHERE id = 1');
  if (rowCount > 0) return;

  const hash = await bcrypt.hash(password, 10);
  await query(
    'INSERT INTO config_admin (id, usuario, password_hash) VALUES (1, $1, $2)',
    [usuario, hash]
  );
  console.log(`[seed] admin inicial creado: ${usuario}`);
}
