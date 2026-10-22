# Spec Delta

## ADDED Requirements

### Requirement: Instrucciones adicionales opcionales en el pedido
El sistema SHALL permitir al comensal indicar, al confirmar su pedido, instrucciones adicionales opcionales de texto libre (por ejemplo, "sin cebolla"), y SHALL guardarlas asociadas al pedido sin alterar su precio.

#### Scenario: Pedido con instrucciones adicionales
- **WHEN** un comensal confirma su pedido indicando instrucciones adicionales
- **THEN** el pedido se registra con esas instrucciones guardadas
- **AND** el precio base del pedido no cambia por incluir instrucciones

#### Scenario: Pedido sin instrucciones adicionales
- **WHEN** un comensal confirma su pedido sin indicar instrucciones
- **THEN** el pedido se registra correctamente con el campo de instrucciones vacío
