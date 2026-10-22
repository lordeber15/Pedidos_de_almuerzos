// Reglas de precios del negocio.
// Una entrada con fondo cuesta 'entrada_fondo' (15.00 por defecto),
// pero si la entrada es ceviche cuesta 'ceviche_fondo' (18.00).
// Solo entradas cuesta 'solo_entrada' (6.00), o 'solo_ceviche' (8.00) si es ceviche.

export function esCeviche(nombre) {
  return String(nombre || '').toLowerCase().includes('ceviche');
}

// precios: objeto con los montos vigentes, ej: { entrada_fondo: 15, ceviche_fondo: 18, solo_entrada: 6, solo_ceviche: 8 }
export function calcularPrecioBase(entrada, fondo, precios) {
  if (fondo) {
    return esCeviche(entrada) ? precios.ceviche_fondo : precios.entrada_fondo;
  }
  return esCeviche(entrada) ? precios.solo_ceviche : precios.solo_entrada;
}
