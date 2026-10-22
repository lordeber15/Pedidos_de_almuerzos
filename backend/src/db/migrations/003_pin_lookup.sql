-- 003_pin_lookup.sql
-- Unicidad de PIN: bcrypt usa sal aleatoria, asi que el mismo PIN produce
-- hashes distintos y el indice sobre pin_hash no puede garantizar unicidad.
-- Se agrega una llave de busqueda deterministica (SHA-256 del PIN + pepper)
-- unica e indexada, que sirve para buscar y verificar la unicidad.
-- El PIN sigue sin guardarse en texto plano.

ALTER TABLE comensales ADD COLUMN IF NOT EXISTS pin_lookup TEXT;

UPDATE comensales SET pin_lookup = NULL WHERE pin_lookup IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_comensales_pin_lookup
    ON comensales (pin_lookup);

-- La columna pin_hash deja de ser la llave de unicidad (queda como respaldo)
DROP INDEX IF EXISTS idx_comensales_pin_hash;
