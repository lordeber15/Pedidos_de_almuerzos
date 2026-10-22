-- 006_instrucciones_pedido.sql
-- Instrucciones adicionales opcionales del pedido (ej. "sin cebolla").
-- Se guardan con el pedido y no alteran su precio.

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS instrucciones TEXT;
