# monto-comensal Specification

## Purpose

Mostrar al comensal identificado con su PIN, recién cuando el día quedó cerrado para pedidos, el monto exacto a pagar por su pedido (precio base más su parte del delivery), y ocultar ese monto mientras el día siga abierto.

## Requirements

### Requirement: El comensal ve su monto a pagar cuando el día cerró
El sistema SHALL mostrar al comensal que se identifica con su PIN, junto a su pedido del día, el monto a pagar (precio base más la parte que le corresponde del delivery del día) cuando el día ya no acepta pedidos, ya sea porque pasó la hora de cierre o porque el administrador cerró el día antes. El monto mostrado SHALL coincidir con el total que el administrador ve en los cobros de ese día.

#### Scenario: Comensal identificado después del corte ve su monto
- **WHEN** un comensal se identifica con su PIN después de que el día dejó de aceptar pedidos y tiene un pedido registrado
- **THEN** la pantalla muestra el pedido que hizo y el monto total a pagar, incluyendo su parte de delivery

#### Scenario: Monto igual al del administrador
- **WHEN** el día está cerrado y se compara el monto que ve el comensal con el total que ve el administrador para ese comensal
- **THEN** ambos montos coinciden

#### Scenario: Día cerrado manualmente por el administrador antes de la hora
- **WHEN** el administrador cierra el día antes de la hora de cierre y un comensal se identifica con su PIN
- **THEN** la pantalla muestra su pedido y su monto a pagar

### Requirement: El monto no se muestra mientras el día siga abierto
El sistema SHALL ocultar cualquier monto o precio al comensal identificado mientras el día siga aceptando pedidos, mostrándole únicamente su pedido (entrada, fondo e instrucciones) como hasta ahora.

#### Scenario: Comensal identificado antes del corte no ve monto
- **WHEN** un comensal se identifica con su PIN antes de la hora de cierre teniendo un pedido registrado
- **THEN** la pantalla muestra su pedido pero no muestra ningún monto ni precio a pagar

#### Scenario: Ninguna respuesta expone precios antes del cierre
- **WHEN** el comensal consulta su pedido antes de que el día se cierre
- **THEN** la respuesta del sistema no incluye precio base, parte de delivery ni total

### Requirement: El monto incluye el reparto final del delivery
El sistema SHALL calcular el monto del comensal con la parte de delivery correspondiente a la cantidad total de pedidos del día, que ya es definitiva cuando el día cerró, aplicando el mismo redondeo hacia arriba a 2 decimales definido para el reparto del delivery.

#### Scenario: Monto con reparto entre todos los pedidos
- **WHEN** el día cerró con 5 pedidos y un comensal tenía un pedido de S/15.00
- **THEN** su monto a pagar es S/16.00 (S/15.00 más S/1.00 de delivery)

#### Scenario: Monto de solo entradas con su parte de delivery
- **WHEN** el día cerró y un comensal registró solo entradas (S/6.00)
- **THEN** su monto a pagar incluye el precio de solo entrada más su parte del delivery del día
