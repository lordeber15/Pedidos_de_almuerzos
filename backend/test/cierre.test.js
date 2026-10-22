import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ahoraTZ,
  normalizarHora,
  corteAlcanzado,
  diaCerradoParaPedidos,
} from '../src/logic/cierre.js';

// --- diaCerradoParaPedidos: nucleo puro del corte ---

test('sin hora de cierre configurada el dia queda abierto', () => {
  assert.equal(
    diaCerradoParaPedidos({ cierresDia: false, horaCierre: null, ahora: '15:00' }),
    false
  );
});

test('antes de la hora de cierre el dia sigue abierto', () => {
  assert.equal(
    diaCerradoParaPedidos({ cierresDia: false, horaCierre: '12:30', ahora: '12:29' }),
    false
  );
});

test('en la hora de cierre exacta el dia esta cerrado', () => {
  assert.equal(
    diaCerradoParaPedidos({ cierresDia: false, horaCierre: '12:30', ahora: '12:30' }),
    true
  );
});

test('despues de la hora de cierre el dia esta cerrado', () => {
  assert.equal(
    diaCerradoParaPedidos({ cierresDia: false, horaCierre: '12:30', ahora: '13:00' }),
    true
  );
  // Cruce de mediodia: "09:59" >= "09:30" aunque "9" > "1" no aplica;
  // lexicografico con zero-padding es cronologico tambien despues de las 24h.
  assert.equal(corteAlcanzado('23:59', '00:00'), false);
  assert.equal(corteAlcanzado('23:59', '23:59'), true);
});

test('fila en cierres_dia cierra el dia aunque no haya hora de corte', () => {
  assert.equal(
    diaCerradoParaPedidos({ cierresDia: true, horaCierre: null, ahora: '08:00' }),
    true
  );
  assert.equal(
    diaCerradoParaPedidos({ cierresDia: true, horaCierre: '12:30', ahora: '08:00' }),
    true
  );
});

test('corteAlcanzado sin hora o sin ahora no cierra', () => {
  assert.equal(corteAlcanzado(null, '12:30'), false);
  assert.equal(corteAlcanzado('12:30', null), false);
  assert.equal(corteAlcanzado(null, null), false);
});

// --- ahoraTZ: la evaluacion usa la zona horaria configurada, no la UTC ---

test('ahoraTZ usa America/Lima por defecto (no la hora UTC del servidor)', () => {
  delete process.env.TZ;
  const instante = new Date('2026-01-15T12:00:00Z');
  // Lima es UTC-5 sin horario de verano: 12:00 UTC = 07:00 en Lima.
  assert.equal(ahoraTZ(instante), '07:00');
});

test('ahoraTZ respeta TZ configurada distinta de la del servidor', () => {
  const instante = new Date('2026-01-15T12:00:00Z');
  process.env.TZ = 'Asia/Tokyo';
  assert.equal(ahoraTZ(instante), '21:00');
  process.env.TZ = 'UTC';
  assert.equal(ahoraTZ(instante), '12:00');
  process.env.TZ = 'America/Lima';
  assert.equal(ahoraTZ(instante), '07:00');
  delete process.env.TZ;
});

test('ahoraTZ devuelve HH:MM del instante actual en la zona configurada', () => {
  process.env.TZ = 'America/Lima';
  const esperado = new Date().toLocaleTimeString('en-GB', {
    timeZone: 'America/Lima',
    hour12: false,
  }).slice(0, 5);
  assert.match(ahoraTZ(), /^([01]\d|2[0-3]):[0-5]\d$/);
  // Misimo minuto que el calculo independiente (podria cambiar si cruza el
  // minuto entre llamadas, por eso solo comparamos el formato arriba y
  // aqui el rango de minutos de diferencia).
  const [h1, m1] = ahoraTZ().split(':').map(Number);
  const [h2, m2] = esperado.split(':').map(Number);
  const dif = Math.abs(h1 * 60 + m1 - (h2 * 60 + m2));
  assert.ok(dif <= 1, `diferencia de ${dif} minutos`);
  delete process.env.TZ;
});

// --- normalizarHora: validacion de la hora configurada por el admin ---

test('normalizarHora acepta HH:MM valido', () => {
  assert.equal(normalizarHora('12:30'), '12:30');
  assert.equal(normalizarHora('00:00'), '00:00');
  assert.equal(normalizarHora('23:59'), '23:59');
  assert.equal(normalizarHora(' 13:00 '), '13:00');
});

test('normalizarHora vacio o null desactiva el corte', () => {
  assert.equal(normalizarHora(''), null);
  assert.equal(normalizarHora('   '), null);
  assert.equal(normalizarHora(null), null);
  assert.equal(normalizarHora(undefined), null);
});

test('normalizarHora rechaza formatos invalidos', () => {
  assert.deepEqual(normalizarHora('7:30'), { invalida: true });
  assert.deepEqual(normalizarHora('24:00'), { invalida: true });
  assert.deepEqual(normalizarHora('12:60'), { invalida: true });
  assert.deepEqual(normalizarHora('tarde'), { invalida: true });
  assert.deepEqual(normalizarHora('12-30'), { invalida: true });
});
