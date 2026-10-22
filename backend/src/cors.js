// Origenes permitidos para CORS, configurados desde .env.
//
// El frontend (nginx) corre en un puerto distinto al backend, asi que el
// navegador hace peticiones cross-origin. Sin estos headers el navegador
// bloquearia la llamada al API.
//
// CORS_ORIGINS: lista separada por comas de origenes permitidos.
//   Ej: CORS_ORIGINS=http://localhost:8080,http://localhost:5173
// Si no se define, se deriva del puerto del frontend y del puerto de desarrollo.

export function origenesPermitidos() {
  const crudo = process.env.CORS_ORIGINS;
  if (crudo && crudo.trim()) {
    return crudo
      .split(',')
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean);
  }

  // Por defecto: el frontend publicado y el dev server de Vite.
  const frontendPort = process.env.FRONTEND_PORT || '8080';
  return [
    `http://localhost:${frontendPort}`,
    `http://127.0.0.1:${frontendPort}`,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
}

// Callback de `cors` para la opcion `origin`.
// La libreria pasa (origin, cb), donde origin es el string del header
// Origin del navegador (o undefined si no es cross-origin).
export function callbackCors(origin, cb) {
  const permitidos = origenesPermitidos();
  const origen = String(origin || '').replace(/\/+$/, '');

  // Sin Origin (misma origen o request no navegador) se permite.
  if (!origen) return cb(null, true);

  const permitido = permitidos.includes(origen);
  cb(null, permitido ? origen : false);
}
