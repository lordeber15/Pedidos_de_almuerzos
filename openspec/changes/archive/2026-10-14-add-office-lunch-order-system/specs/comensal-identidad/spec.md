# Spec Delta

## Purpose

Identificar a cada comensal con su nombre y un PIN de 4 dígitos único, de modo que pueda pedir nuevamente sin registrarse otra vez y todos sus pedidos queden relacionados con su nombre.

## ADDED Requirements

### Requirement: Registro de comensal con nombre y PIN
El sistema SHALL permitir registrarse ingresando un nombre y un PIN de 4 dígitos, creando un registro que asocia nombre y PIN.

#### Scenario: Registro de comensal con nombre y PIN
- **WHEN** un comensal ingresa su nombre y un PIN de 4 dígitos por primera vez
- **THEN** el sistema crea su registro asociando nombre y PIN
- **AND** queda identificado para hacer su pedido

### Requirement: Los PIN son únicos e irrepetibles
El sistema SHALL garantizar que ningún PIN de 4 dígitos esté asociado a más de un comensal, rechazando el registro cuando el PIN ya esté en uso.

#### Scenario: Los PIN son únicos e irrepetibles
- **WHEN** un comensal intenta registrarse con un PIN que ya está en uso
- **THEN** el sistema rechaza el registro e informa que el PIN ya está en uso

### Requirement: Reidentificación por PIN para pedir nuevamente
El sistema SHALL permitir identificarse ingresando únicamente un PIN ya registrado, asociando al comensal su nombre sin volver a registrarlo.

#### Scenario: Reidentificación por PIN para pedir nuevamente
- **WHEN** un comensal ingresa un PIN ya registrado
- **THEN** el sistema lo identifica y lo asocia a su nombre
- **AND** no es necesario registrarse de nuevo para hacer otro pedido

### Requirement: Los PIN no se almacenan en texto plano
El sistema SHALL almacenar los PIN de forma protegida (no legible directamente desde la base de datos).

#### Scenario: El PIN almacenado no es legible en texto plano
- **WHEN** se consulta el almacén de datos de comensales
- **THEN** los PIN aparecen guardados de forma protegida, no como los 4 dígitos originales
