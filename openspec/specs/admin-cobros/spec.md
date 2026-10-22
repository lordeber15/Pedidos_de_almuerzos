# admin-cobros Specification

## Purpose

Dar al administrador un panel protegido con una pestaña de cobros del día que liste todos los pedidos con sus totales, permitiendo marcar cada pedido como pagado o pendiente, con una contraseña de administrador editable.

## Requirements

### Requirement: Acceso al panel de administración
El sistema SHALL permitir el acceso al panel de administración mediante un usuario y contraseña administradores, con una contraseña inicial configurable; la sesión de administración SHALL proteger las funciones de administración.

#### Scenario: Login de administración
- **WHEN** se ingresa el usuario y la contraseña administradores válidos
- **THEN** se accede al panel de administración

#### Scenario: Credenciales administradores incorrectas
- **WHEN** se ingresa una contraseña administradora incorrecta
- **THEN** el sistema deniega el acceso e informa credenciales inválidas

### Requirement: Cambio de contraseña de administrador
El sistema SHALL permitir al administrador cambiar su contraseña; la nueva contraseña SHALL ser la única válida para el próximo inicio de sesión.

#### Scenario: Cambio de contraseña de administrador
- **WHEN** el administrador cambia su contraseña
- **THEN** la nueva contraseña queda activa para el próximo inicio de sesión
- **AND** la contraseña anterior deja de ser válida

### Requirement: Cobros del día lista los pedidos con totales
El sistema SHALL mostrar en la pestaña de cobros del día la lista de todos los comensales que hicieron un pedido en el día, con su pedido y su total (precio base más parte de delivery).

#### Scenario: Cobros del día lista los pedidos
- **WHEN** el administrador abre la pestaña de cobros del día
- **THEN** se listan todos los comensales que pidieron ese día, con su pedido y su total

#### Scenario: Cobros del día sin pedidos
- **WHEN** el administrador abre la pestaña de cobros de un día sin pedidos
- **THEN** el sistema muestra la lista vacía sin error

### Requirement: Estado de pago por pedido
El sistema SHALL permitir al administrador marcar cada pedido como pagado o pendiente, y SHALL conservar ese estado visible en la lista de cobros del día.

#### Scenario: Marcar pedido como pagado
- **WHEN** el administrador marca un pedido como pagado
- **THEN** el estado queda guardado y se muestra como pagado en la lista de cobros del día

#### Scenario: Marcar pedido como pendiente
- **WHEN** el administrador marca un pedido como pendiente
- **THEN** el estado queda guardado y se muestra como pendiente en la lista de cobros del día

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
