# Spec Delta

## Purpose

Publicar el menú del día de la oficina extrayéndolo del texto que pega el administrador, y exponer ese menú vigente en la pantalla pública donde los comensales hacen sus pedidos.

## ADDED Requirements

### Requirement: Publicación del menú pegando el texto del día
El sistema SHALL permitir al administrador publicar el menú del día pegando el texto del día (formato libre con secciones) y SHALL extraer las entradas entre las marcas ENTRADAS y FONDOS, y los platos de fondo entre las marcas FONDOS y REFRESCO, publicándolos como el menú vigente.

#### Scenario: El administrador publica el menú pegando el texto del día
- **WHEN** el administrador pega el texto del menú (por ejemplo, "MENU CRIOLLO. 15.00 ... *ENTRADAS* Sopa de casa ... Ceviche ... *FONDOS* Pollo al horno con lentejas ... *REFRESCO* maracuya") y confirma
- **THEN** el sistema extrae las entradas entre las secciones ENTRADAS y FONDOS, y los fondos entre FONDOS y REFRESCO
- **AND** ese menú queda publicado como el menú vigente en la pantalla pública

#### Scenario: El texto pegado sin las secciones válidas se rechaza
- **WHEN** el administrador pega un texto que no contiene las marcas ENTRADAS y FONDOS en el orden esperado
- **THEN** el sistema informa el error y no modifica el menú vigente

### Requirement: La pantalla pública muestra el menú vigente con radio buttons
El sistema SHALL mostrar en la pantalla pública el menú vigente, presentando las entradas y los fondos como listas donde cada opción se selecciona con radio buttons (una entrada y un fondo por pedido).

#### Scenario: La pantalla pública muestra el menú vigente con radio buttons
- **WHEN** un comensal abre la pantalla pública con un menú publicado
- **THEN** se muestran las entradas y los fondos del menú vigente, cada uno seleccionable con radio buttons
- **AND** solo puede seleccionarse una entrada y un fondo a la vez

### Requirement: El menú vigente permanece hasta ser reemplazado
El sistema SHALL mantener el menú publicado visible hasta que el administrador publique un menú nuevo; no SHALL archivarse automáticamente por cambio de día.

#### Scenario: El menú permanece hasta que se publique uno nuevo
- **WHEN** pasa un día sin que el administrador pegue un menú nuevo
- **THEN** el menú publicado sigue visible en la pantalla pública hasta ser reemplazado
