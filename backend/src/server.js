import express from 'express';
import cors from 'cors';
import { runMigrations } from './db/migrate.js';
import { seedAdmin } from './db/seedAdmin.js';
import { callbackCors } from './cors.js';
import { routerComensales } from './routes/comensales.js';
import { routerMenu } from './routes/menu.js';
import { routerPrecios } from './routes/precios.js';
import { routerPedidos } from './routes/pedidos.js';
import { routerCobros } from './routes/cobros.js';
import { routerAdmin } from './routes/admin.js';

const PORT = Number(process.env.PORT || 3000);

async function main() {
  await runMigrations();
  await seedAdmin();

  const app = express();

  // CORS: el frontend corre en otro puerto, asi que el navegador hace
  // peticiones cross-origin. Origenes permitidos via CORS_ORIGINS (.env).
  app.use(cors({ origin: callbackCors }));

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/comensales', routerComensales);
  app.use('/api/menu', routerMenu);
  app.use('/api/precios', routerPrecios);
  app.use('/api/pedidos', routerPedidos);
  app.use('/api/cobros', routerCobros);
  app.use('/api/admin', routerAdmin);

  // Manejador de errores: nunca filtra stack trace al cliente
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  });

  app.listen(PORT, () => {
    console.log(`[backend] escuchando en el puerto ${PORT}`);
  });
}

main().catch((err) => {
  console.error('[backend] fallo al iniciar:', err);
  process.exit(1);
});
