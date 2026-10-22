-- 004_cierres_dia.sql
-- Registro de cierres de dia: cuando el administrador cierra el dia se
-- guarda el resumen (total cobrado, pedidos) para tener historial y para
-- evitar cerrar dos veces el mismo dia.

CREATE TABLE IF NOT EXISTS cierres_dia (
    id             SERIAL PRIMARY KEY,
    fecha          DATE NOT NULL UNIQUE,
    total_dia      NUMERIC(8,2) NOT NULL,
    total_pagado   NUMERIC(8,2) NOT NULL,
    total_pendiente NUMERIC(8,2) NOT NULL,
    cantidad_pedidos INTEGER NOT NULL,
    cerrado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);
