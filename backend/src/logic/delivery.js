// Reparto del delivery del dia.
// El monto total de delivery (DELIVERY_TOTAL, 5.00 por defecto) se divide
// entre TODOS los pedidos del dia. Cada cuenta recibe su parte redondeada
// HACIA ARRIBA (maximo) a 2 decimales: 15.8333333 -> 15.84.

export function repartirDelivery(montoTotal, totalPedidos) {
  if (!totalPedidos || totalPedidos <= 0) return 0;
  const crudo = montoTotal / totalPedidos;
  // ceil sobre centimos: 2 decimales redondeados al maximo
  return Math.ceil(crudo * 100) / 100;
}

export function totalCuenta(precioBase, porComensal) {
  // El total tambien se redondea HACIA ARRIBA (maximo) a 2 decimales:
  // 15.8333333 -> 15.84.
  // Se opera en centavos enteros: sumar los montos como float puede dar
  // 16.670000000000002 y ceil lo subiria a 16.68.
  const centavos = Math.ceil(Number(precioBase) * 100) + Math.ceil(porComensal * 100);
  return centavos / 100;
}
