-- 007_hora_cierre.sql
-- Hora diaria de cierre de pedidos configurable por el administrador.
-- NULL = sin corte automatico (comportamiento actual: solo el cierre
-- manual de cobros cierra el dia).

ALTER TABLE config_admin ADD COLUMN IF NOT EXISTS hora_cierre TIME;
