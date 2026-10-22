import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from './pool.js';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

// Aplica las migraciones pendientes en orden y registra las ya aplicadas.
export async function runMigrations() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre TEXT PRIMARY KEY,
      aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const archivos = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const archivo of archivos) {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE nombre = $1',
      [archivo]
    );
    if (rowCount > 0) continue;

    const sql = readFileSync(join(MIGRATIONS_DIR, archivo), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (nombre) VALUES ($1)', [archivo]);
      await client.query('COMMIT');
      console.log(`[migraciones] aplicada: ${archivo}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migracion fallida ${archivo}: ${err.message}`);
    } finally {
      client.release();
    }
  }
}
