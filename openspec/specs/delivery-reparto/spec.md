# delivery-reparto Specification

## Purpose

Repartir el costo de delivery del día entre todos los comensales que pidieron, sumando a cada cuenta su parte con redondeo hacia arriba a 2 decimales, para que el total de cada pedido sea exacto y verificable.

## Requirements

### Requirement: Reparto del delivery del día
El sistema SHALL agregar S/5.00 de delivery al día y SHALL dividir ese monto entre todos los pedidos registrados en el día, agregando a cada cuenta la parte que le corresponde.

#### Scenario: Reparto del delivery entre los pedidos del día
- **WHEN** el sistema calcula los totales de un día con pedidos registrados
- **THEN** el delivery del día (S/5.00) se divide entre todos los pedidos de ese día
- **AND** cada cuenta recibe su parte agregada al total

#### Scenario: Reparto con cinco pedidos
- **WHEN** hay 5 pedidos en el día y el delivery del día es S/5.00
- **THEN** a cada cuenta se le agrega S/1.00 de delivery

### Requirement: Redondeo hacia arriba a 2 decimales por cuenta
El sistema SHALL calcular la parte de delivery de cada cuenta con al menos 2 decimales, redondeando hacia arriba (al máximo) cuando haya más decimales.

#### Scenario: Redondeo hacia arriba del total de una cuenta
- **WHEN** la parte de delivery de una cuenta produce un total con más de 2 decimales (por ejemplo, 15.8333333)
- **THEN** el sistema redondea el total hacia arriba a 2 decimales (15.84)

### Requirement: Pedido solo entradas también suma delivery
El sistema SHALL agregar la parte de delivery también a los pedidos de solo entradas.

#### Scenario: Solo entradas incluye su parte de delivery
- **WHEN** un comensal registró un pedido de solo entradas y se calculan los cobros del día
- **THEN** su total incluye el precio de solo entrada más su parte del delivery del día
