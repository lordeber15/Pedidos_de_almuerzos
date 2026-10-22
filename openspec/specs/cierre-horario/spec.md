# cierre-horario Specification

## Purpose

Permitir que el administrador defina la hora diaria a la que se dejan de aceptar pedidos, aplicar ese corte en el servidor y mostrar en la pantalla pública un countdown con el tiempo que queda para pedir.

## Requirements

### Requirement: El administrador configura la hora de cierre de pedidos
El sistema SHALL permitir al administrador configurar una hora diaria (hora y minuto) a la que se dejan de aceptar pedidos del día, y SHALL aplicar esa hora a partir del momento en que se guarda. Si la hora de cierre aún no ha sido configurada, no SHALL haber corte automático y los pedidos se seguirán aceptando como hasta ahora.

#### Scenario: El administrador guarda la hora de cierre
- **WHEN** el administrador configura la hora de cierre (por ejemplo, 12:30) y guarda
- **THEN** a partir de ese momento el sistema usará esa hora como corte de pedidos del día

#### Scenario: Cambio de la hora de cierre
- **WHEN** el administrador modifica la hora de corte de 12:30 a 13:00 estando pedidos ya abiertos
- **THEN** el sistema aplica inmediatamente la nueva hora (13:00) como límite de pedidos del día

#### Scenario: Sin hora de cierre configurada
- **WHEN** el administrador nunca ha configurado la hora de cierre
- **THEN** el sistema no aplica corte automático por hora y sigue aceptando pedidos hasta que el administrador cierre el día manualmente

### Requirement: Rechazo de pedidos después de la hora de cierre
El sistema SHALL rechazar el registro de nuevos pedidos cuando la hora actual ya alcance (o supere) la hora de cierre configurada para el día, informando claramente que los pedidos están cerrados. La hora de cierre SHALL interpretarse en la zona horaria configurada del sistema.

#### Scenario: Intento de pedido después de la hora de cierre
- **WHEN** un comensal intenta registrar un pedido después de la hora de cierre configurada
- **THEN** el sistema rechaza el pedido e informa que los pedidos del día ya están cerrados
- **AND** no se crea ningún pedido nuevo

#### Scenario: Pedido justo antes de la hora de cierre
- **WHEN** un comensal confirma su pedido antes de la hora de cierre configurada
- **THEN** el pedido se registra normalmente

#### Scenario: Corte según la hora del servidor
- **WHEN** la hora del dispositivo del comensal está desincronizada respecto de la hora real
- **THEN** la decisión de aceptar o rechazar el pedido se toma según la hora del servidor, no según la hora del dispositivo

### Requirement: Countdown de tiempo restante en la pantalla pública
El sistema SHALL mostrar en la pantalla pública, mientras los pedidos sigan abiertos y exista una hora de cierre configurada, el tiempo restante hasta esa hora, calculado con la hora del servidor y actualizándose periódicamente. Al llegar el tiempo a cero, SHALL mostrar que los pedidos ya están cerrados.

#### Scenario: Countdown visible con pedidos abiertos
- **WHEN** un comensal abre la pantalla pública antes de la hora de cierre configurada y hay una hora configurada
- **THEN** se muestra el tiempo restante hasta la hora de cierre, contando hacia atrás

#### Scenario: El countdown llega a cero
- **WHEN** llega la hora de cierre configurada mientras el comensal tiene la pantalla abierta
- **THEN** el countdown llega a cero y la pantalla informa que los pedidos ya no se aceptan

#### Scenario: Sin hora de cierre no hay countdown
- **WHEN** el administrador no ha configurado hora de cierre
- **THEN** la pantalla pública no muestra countdown ni límite de hora

#### Scenario: Un comensal con dispositivo con hora desactualizada
- **WHEN** la hora del dispositivo del comensal es diferente a la hora real
- **THEN** el countdown mostrado corresponde al tiempo restante según la hora del servidor
