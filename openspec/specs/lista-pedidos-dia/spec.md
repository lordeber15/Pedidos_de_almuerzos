# lista-pedidos-dia Specification

## Purpose

Entregar al administrador la lista de pedidos del día en texto, agrupados por comensal y con sus instrucciones adicionales, lista para copiar y pegar en cocina o reparto.

## Requirements

### Requirement: La lista de pedidos del día agrupa por comensal
El sistema SHALL mostrar en la pestaña "Pedidos del día" los pedidos del día agrupados por comensal, con su pedido, listos para copiar y pegar como texto.

#### Scenario: Lista agrupada por comensal
- **WHEN** el administrador abre la pestaña "Pedidos del día" con pedidos registrados
- **THEN** se muestra un texto con los pedidos agrupados por comensal

#### Scenario: Lista sin pedidos
- **WHEN** el administrador abre la pestaña "Pedidos del día" en un día sin pedidos
- **THEN** el sistema informa que aún no hay pedidos, sin error

### Requirement: Las instrucciones adicionales aparecen bajo el nombre del comensal
El sistema SHALL mostrar las instrucciones adicionales de un pedido debajo del nombre del comensal al que pertenecen, antes del siguiente comensal en la lista; los comensales sin instrucciones no muestran esa línea.

#### Scenario: Comensal con instrucciones
- **WHEN** un comensal registró instrucciones adicionales con su pedido y se genera la lista del día
- **THEN** las instrucciones aparecen debajo del nombre de ese comensal y antes del pedido del siguiente comensal

#### Scenario: Comensal sin instrucciones
- **WHEN** un comensal registró su pedido sin instrucciones y se genera la lista del día
- **THEN** su bloque muestra solo el nombre y el pedido, sin línea de instrucciones
