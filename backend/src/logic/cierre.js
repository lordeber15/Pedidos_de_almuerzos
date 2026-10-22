// Corte horario diario de pedidos.
// El administrador configura una hora fija (HH:MM); a partir de ella (y en
// la zona horaria configurada, TZ por defecto America/Lima) el dia deja de
// aceptar pedidos. NULL = sin corte automatico. El cierre manual de cobros
// (fila en cierres_dia) tambien cierra el dia para pedidos.

import { query } from '../db/pool.js';

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function zonaHoraria() {
  return process.env.TZ || 'America/Lima';
}

// "HH:MM" del instante dado en la zona horaria configurada.
// Acepta un Date para poder probar con instantes fijos.
export function ahoraTZ(fecha = new Date()) {
  return fecha.toLocaleTimeString('en-GB', {
    timeZone: zonaHoraria(),
    hour12: false,
  }).slice(0, 5);
}

// Normaliza un valor enviado por el administrador: "HH:MM" valido se
// devuelve igual; vacio/`null` se devuelve como `null` (sin corte);
// cualquier otra cosa es invalida.
export function normalizarHora(valor) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  if (!texto) return null;
  if (!FORMATO_HORA.test(texto)) return { invalida: true };
  return texto;
}

// Hora de cierre configurada: "HH:MM" o null (sin corte).
export async function horaCierre() {
  const { rows } = await query('SELECT hora_cierre FROM config_admin WHERE id = 1');
  const valor = rows[0] ? rows[0].hora_cierre : null;
  if (!valor) return null;
  // pg devuelve TIME como "HH:MM:SS"; el sistema trabaja en "HH:MM".
  return String(valor).slice(0, 5);
}

// Guarda (o desactiva con vacio/null) la hora de cierre. Lanza si el
// formato no es HH:MM.
export async function guardarHoraCierre(valor) {
  const normalizada = normalizarHora(valor);
  if (normalizada && normalizada.invalida) {
    throw new Error('La hora debe tener formato HH:MM, por ejemplo 12:30.');
  }
  await query('UPDATE config_admin SET hora_cierre = $1 WHERE id = 1', [normalizada]);
  return normalizada;
}

// Nucleo puro: la hora de corte ya se alcanzo? Ambos valores en "HH:MM"
// (zero-padded, la comparacion lexicografica es cronologica).
export function corteAlcanzado(horaCierreValor, ahora) {
  if (!horaCierreValor || !ahora) return false;
  return ahora >= horaCierreValor;
}

// Nucleo puro: el dia quedo cerrado para pedidos? Por cierre manual
// (fila en cierres_dia) o por haber alcanzado la hora de corte.
export function diaCerradoParaPedidos({ cierresDia = false, horaCierre: hora = null, ahora = null } = {}) {
  return Boolean(cierresDia) || corteAlcanzado(hora, ahora);
}

// Estado de cierre de una fecha para los rutas: combina la fila de
// cierres_dia con la hora de corte configurada.
export async function estadoCierre(fecha) {
  const [cierre, hora] = await Promise.all([
    query('SELECT 1 FROM cierres_dia WHERE fecha = $1', [fecha]),
    horaCierre(),
  ]);
  const cierresDia = Boolean(cierre.rows[0]);
  const ahora = ahoraTZ();
  return {
    cierresDia,
    horaCierre: hora,
    ahora,
    cerrado: diaCerradoParaPedidos({ cierresDia, horaCierre: hora, ahora }),
  };
}
