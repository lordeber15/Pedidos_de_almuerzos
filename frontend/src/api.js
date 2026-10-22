const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function pedir(ruta, opciones = {}) {
  const token = localStorage.getItem('token_admin');
  const res = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opciones.headers || {}),
    },
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(datos.error || `Error ${res.status}`);
    // El código HTTP y el `codigo` del backend permiten decidir el flujo sin
    // depender del texto del mensaje.
    error.status = res.status;
    error.codigo = datos.codigo;
    error.datos = datos;
    throw error;
  }
  return datos;
}

export const api = {
  menuVigente: () => pedir('/menu/vigente'),
  publicarMenu: (texto) =>
    pedir('/menu/publicar', { method: 'POST', body: JSON.stringify({ texto }) }),
  registrarComensal: (nombre, pin) =>
    pedir('/comensales/registro', { method: 'POST', body: JSON.stringify({ nombre, pin }) }),
  identificarPorPin: (pin) =>
    pedir('/comensales/identificar', { method: 'POST', body: JSON.stringify({ pin }) }),
  crearPedido: (comensal_id, entrada, fondo, instrucciones) =>
    pedir('/pedidos', {
      method: 'POST',
      body: JSON.stringify({ comensal_id, entrada, fondo, instrucciones }),
    }),
  loginAdmin: (usuario, password) =>
    pedir('/admin/login', { method: 'POST', body: JSON.stringify({ usuario, password }) }),
  cambiarPassword: (password_actual, password_nuevo) =>
    pedir('/admin/cambiar-password', {
      method: 'POST',
      body: JSON.stringify({ password_actual, password_nuevo }),
    }),
  obtenerHoraCierre: () => pedir('/admin/hora-cierre'),
  guardarHoraCierre: (hora) =>
    pedir('/admin/hora-cierre', { method: 'PUT', body: JSON.stringify({ hora }) }),
  obtenerPrecios: () => pedir('/precios'),
  guardarPrecios: (precios) =>
    pedir('/precios', { method: 'PUT', body: JSON.stringify(precios) }),
  cobrosDelDia: () => pedir('/cobros/dia'),
  listaPedidos: () => pedir('/cobros/lista'),
  cerrarDia: (fecha) =>
    pedir('/cobros/cerrar', {
      method: 'POST',
      body: JSON.stringify(fecha ? { fecha } : {}),
    }),
  cambiarEstadoPedido: (id, estado) =>
    pedir(`/cobros/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
  deudas: () => pedir('/cobros/deudas'),
  otorgarExcepcion: (comensal_id) =>
    pedir('/cobros/excepciones', { method: 'POST', body: JSON.stringify({ comensal_id }) }),
  quitarExcepcion: (comensal_id) =>
    pedir(`/cobros/excepciones/${comensal_id}`, { method: 'DELETE' }),
};
