// Totales del dia: un unico calculo para el administrador (pestaña de
// cobros) y para el comensal (monto a pagar), de modo que ambos montos
// coincidan exactamente.

import { repartirDelivery, totalCuenta } from './delivery.js';

// Suma los totales del día y separa lo cobrado de lo pendiente.
export function resumir(pedidos, deliveryTotal) {
  const porComensal = repartirDelivery(deliveryTotal, pedidos.length);

  let totalDia = 0;
  let totalPagado = 0;
  let totalPendiente = 0;

  const resultado = pedidos.map((p) => {
    const precioBase = Number(p.precio_base);
    const total = totalCuenta(precioBase, porComensal);
    totalDia += total;
    if (p.estado === 'pagado') totalPagado += total;
    else totalPendiente += total;
    return {
      ...p,
      precio_base: precioBase,
      delivery: porComensal,
      total,
    };
  });

  const red2 = (n) => Math.round(n * 100) / 100;
  return {
    pedidos: resultado,
    porComensal,
    totales: {
      total_dia: red2(totalDia),
      total_pagado: red2(totalPagado),
      total_pendiente: red2(totalPendiente),
      cantidad_pedidos: pedidos.length,
      cantidad_pendientes: pedidos.filter((p) => p.estado !== 'pagado').length,
    },
  };
}

// Pedido del comensal para la vista publica. Mientras el dia esta abierto
// (`cerrado = false`) no se expone precio alguno: el delivery se reparte
// entre el total de pedidos y aun pueden entrar mas comensales. Recien con
// el dia cerrado se agrega el monto a pagar, calculado con el mismo
// `resumir()` que ve el administrador (mismo reparto y mismo redondeo).
export function pedidoConMonto(pedido, pedidosDia, deliveryTotal, cerrado) {
  if (!pedido) return null;
  if (!cerrado) {
    // Sin ningun campo de precio (precio_base, delivery, total, monto).
    return { ...pedido };
  }
  const resumen = resumir(pedidosDia, deliveryTotal);
  const propio = resumen.pedidos.find((p) => p.id === pedido.id);
  if (!propio) return pedido;
  return {
    ...pedido,
    monto: propio.total,
    delivery: propio.delivery,
  };
}
