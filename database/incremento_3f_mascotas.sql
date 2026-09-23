-- Incremento 3 (ampliacion): mascota como entidad real.
-- Motivado por la pantalla de Pacientes del mockup (4.6): un dueño
-- (cliente) tiene una o varias mascotas registradas, con su propia
-- ficha (nombre, especie, raza, foto). Antes, cita.nombre_mascota era
-- texto libre sin identidad propia. Sin historial clinico (sigue
-- vigente la restriccion del alcance del proyecto) — mascota es solo identidad,
-- no expediente medico.
CREATE TABLE mascota (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES usuario(id),
    nombre VARCHAR(100) NOT NULL,
    especie VARCHAR(50),
    raza VARCHAR(80),
    foto_url VARCHAR(255),
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mascota_cliente_id ON mascota(cliente_id);

ALTER TABLE cita ADD COLUMN mascota_id UUID REFERENCES mascota(id);

-- Backfill: una mascota por cada combinacion distinta (cliente_id,
-- nombre_mascota) que ya existia en cita, y se enlaza esa cita.
INSERT INTO mascota (cliente_id, nombre)
SELECT DISTINCT cliente_id, nombre_mascota FROM cita;

UPDATE cita c
SET mascota_id = m.id
FROM mascota m
WHERE m.cliente_id = c.cliente_id AND m.nombre = c.nombre_mascota;

-- Migracion limpia: sin columna de compatibilidad (entorno local, sin
-- datos de produccion que preservar en el formato viejo).
ALTER TABLE cita ALTER COLUMN mascota_id SET NOT NULL;
ALTER TABLE cita DROP COLUMN nombre_mascota;
