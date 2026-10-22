-- 002_seeds.sql
-- Precios por defecto (S/) segun la propuesta del negocio

INSERT INTO precios (tipo, monto) VALUES
    ('entrada_fondo',   15.00),
    ('ceviche_fondo',   18.00),
    ('solo_entrada',     6.00),
    ('solo_ceviche',     8.00)
ON CONFLICT (tipo) DO NOTHING;
