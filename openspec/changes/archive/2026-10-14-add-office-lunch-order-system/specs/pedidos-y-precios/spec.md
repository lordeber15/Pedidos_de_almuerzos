# Spec Delta

## Purpose

Registrar los pedidos de los comensales (entrada con fondo, o solo entradas) y calcular el precio base según la combinación elegida, incluyendo el caso especial del ceviche, con precios configurables por el administrador.

## ADDED Requirements

### Requirement: Pedido de entrada y fondo
El sistema SHALL permitir a un comensal identificado seleccionar una entrada y un fondo del menú vigente y confirmar el pedido, registrándolo asociado a su nombre con el precio del menú.

#### Scenario: Pedido de entrada y fondo
- **WHEN** un comensal identificado selecciona una entrada y un fondo y confirma
- **THEN** el sistema registra el pedido asociado a su nombre con el precio de entrada+fondo (S/15.00 por defecto)

### Requirement: Pedido de solo entradas
El sistema SHALL permitir registrar un pedido de solo entradas (sin fondo), con su propio precio.

#### Scenario: Pedido de solo entradas
- **WHEN** un comensal identificado selecciona solo entradas sin incluir ceviche
- **THEN** el sistema registra el pedido con el precio de solo entrada (S/6.00 por defecto)

### Requirement: Ceviche como entrada con precio especial
El sistema SHALL aplicar el precio especial cuando el pedido incluye ceviche, tanto en la combinación con fondo como en solo entrada.

#### Scenario: Ceviche en la combinación entrada y fondo
- **WHEN** el comensal selecciona ceviche como entrada junto con un fondo
- **THEN** el sistema aplica el precio de ceviche con fondo (S/18.00 por defecto)

#### Scenario: Ceviche como solo entrada
- **WHEN** el comensal selecciona solo ceviche como su pedido
- **THEN** el sistema aplica el precio de solo ceviche (S/8.00 por defecto)

### Requirement: El administrador configura los precios generales
El sistema SHALL permitir al administrador ver y modificar los precios de entrada+fondo, ceviche con fondo, solo entrada y solo ceviche; los nuevos precios SHALL aplicarse a los pedidos registrados a partir de ese momento.

#### Scenario: El administrador configura los precios generales
- **WHEN** el administrador modifica uno o más precios y guarda
- **THEN** los nuevos precios se aplican a los pedidos posteriores
- **AND** los pedidos ya registrados conservan el precio con el que se hicieron
