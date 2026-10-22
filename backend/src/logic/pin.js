import { createHash, timingSafeEqual } from 'node:crypto';

// Pepper compartido (secreto del servidor) para la llave de busqueda del PIN.
// Permite unicidad y busqueda rapida sin guardar el PIN en texto plano.
function pepper() {
  return process.env.JWT_SECRET || 'dev-secret';
}

export function pinLookup(pin) {
  return createHash('sha256')
    .update(`${pepper()}:${pin}`)
    .digest('hex');
}

// Compara dos llaves de busqueda de forma constante en tiempo.
export function igualesLookup(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
