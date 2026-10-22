// Texto de los pedidos del dia, agrupados por comensal, para que el
// administrador pueda copiar y pegar (cocina / reparto).
//
// 5 Menus Criollos + 1 entrada
// ____________
// Menus Criollos (KELLY)
// > sin cebolla
// 1 Ocopa
// 1 Corvina en salsa alfredo
// ____________
// Solo entrada (Ruben)
// 1 Alita broaster

const SEPARADOR = '_'.repeat(12);

// pedidos: [{ comensal, entrada, fondo, instrucciones? }]
export function textoListaPedidos(pedidos) {
  const conFondo = pedidos.filter((p) => p.fondo);
  const soloEntrada = pedidos.filter((p) => !p.fondo);

  const cabecera = [];
  if (conFondo.length) cabecera.push(`${conFondo.length} Menus Criollos`);
  if (soloEntrada.length) {
    cabecera.push(`${soloEntrada.length} entrada${soloEntrada.length === 1 ? '' : 's'}`);
  }

  const lineas = [cabecera.join(' + ') || '0 pedidos'];
  for (const p of pedidos) {
    lineas.push(SEPARADOR);
    lineas.push(p.fondo ? `Menus Criollos (${p.comensal})` : `Solo entrada (${p.comensal})`);
    // Instrucciones adicionales: debajo del nombre y antes del pedido
    // siguiente (del propio bloque o del siguiente comensal).
    if (p.instrucciones && String(p.instrucciones).trim()) {
      lineas.push(`> ${String(p.instrucciones).trim()}`);
    }
    lineas.push(`1 ${p.entrada}`);
    if (p.fondo) lineas.push(`1 ${p.fondo}`);
  }
  return lineas.join('\n');
}
