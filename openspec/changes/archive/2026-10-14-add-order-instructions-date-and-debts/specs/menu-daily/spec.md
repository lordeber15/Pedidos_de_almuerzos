# Spec Delta

## ADDED Requirements

### Requirement: La pantalla pública muestra la fecha del día junto al saludo
El sistema SHALL mostrar en la pantalla pública, al lado derecho del saludo con el nombre del comensal (vista donde se elige el almuerzo), la fecha actual del día, para que el comensal sepa de qué día es el menú.

#### Scenario: Fecha junto al saludo en la vista de selección
- **WHEN** un comensal identificado ve la pantalla de selección de su almuerzo
- **THEN** junto al saludo con su nombre se muestra la fecha actual del día

#### Scenario: La fecha refleja el día en curso
- **WHEN** se consulta la pantalla pública
- **THEN** la fecha mostrada corresponde al día actual según la zona horaria configurada
