# Spec Delta

## Purpose

Dar al administrador un panel protegido con una pestaña de cobros del día que liste todos los pedidos con sus totales, permitiendo marcar cada pedido como pagado o pendiente, con una contraseña de administrador editable.

## ADDED Requirements

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
