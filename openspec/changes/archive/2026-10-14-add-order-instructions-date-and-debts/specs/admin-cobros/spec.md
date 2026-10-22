# Spec Delta

## ADDED Requirements

### Requirement: Los días no cerrados conservan sus deudas pendientes en la vista de cobros
El sistema SHALL mostrar en la vista de cobros los pedidos pendientes de pago de cualquier día que aún no haya sido cerrado, aunque ya haya cambiado la fecha, hasta que ese día sea cerrado por el administrador.

#### Scenario: Deudas de ayer sin cerrar siguen visibles hoy
- **WHEN** un día anterior quedó con pedidos sin pagar y sin cerrar, y el administrador abre la vista de cobros al día siguiente
- **THEN** los pedidos pendientes de ese día siguen listados con sus totales
- **AND** la vista identifica a qué fecha pertenece cada día sin cerrar

#### Scenario: El día cerrado deja de mostrar sus deudas como pendientes
- **WHEN** el administrador cierra un día que tenía pedidos pendientes ya pagados
- **THEN** ese día deja de aparecer como deuda pendiente en la vista de cobros

### Requirement: Cierre de un día pendiente desde la vista de cobros
El sistema SHALL permitir al administrador cerrar un día no cerrado desde la vista de cobros, SHALL exigir que todos los pedidos de ese día estén marcados como pagados y SHALL reservar el resumen del cierre de ese día.

#### Scenario: Cerrar un día pendiente con todo pagado
- **WHEN** el administrador solicita cerrar un día no cerrado cuyos pedidos están todos pagados
- **THEN** el día queda cerrado y su resumen se conserva

#### Scenario: Cerrar un día con pedidos sin pagar
- **WHEN** el administrador solicita cerrar un día no cerrado que aún tiene pedidos sin pagar
- **THEN** el sistema rechaza el cierre e informa cuántos pedidos siguen sin pagar
