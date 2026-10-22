-- 005_un_pedido_por_dia.sql
-- Cada comensal solo puede tener un pedido por dia.
-- Se elimina primero cualquier duplicado existente (conservando el pedido
-- mas reciente de cada comensal y fecha) y luego se refuerza con un indice
-- unico, para que la restriccion tambien valga ante peticiones simultaneas.

DELETE FROM pedidos p
USING pedidos k
WHERE p.comensal_id = k.comensal_id
  AND p.fecha = k.fecha
  AND p.id < k.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_comensal_fecha
    ON pedidos (comensal_id, fecha);
