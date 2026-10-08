-- incremento_8b_catalogos.sql
-- Catalogos que el superadministrador gestiona sin programar:
-- 1. categoria_servicio (categorias de servicio = especialidades medicas):
--    se le agrega "activo". Una categoria desactivada deja de ofrecerse en
--    registros nuevos; los servicios y medicos que ya la usan la conservan.
-- 2. especie y raza: pasan del codigo (frontend/src/utils/razas.js) a tablas.
--    mascota.especie / mascota.raza siguen guardando el TEXTO (sin llave
--    foranea): las mascotas ya registradas no cambian, y desactivar una
--    especie o raza no las afecta. Una especie sin razas activas pide la
--    raza como texto libre (asi funciona "Otro").
-- Nada se elimina: todo se desactiva.

ALTER TABLE categoria_servicio ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS especie (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    -- Dibujo del boton de especie. Una especie nueva usa uno de estos.
    icono VARCHAR(20) NOT NULL DEFAULT 'pata' CHECK (icono IN ('perro', 'gato', 'ave', 'pata')),
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raza (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    especie_id UUID NOT NULL REFERENCES especie(id),
    nombre VARCHAR(80) NOT NULL,
    -- 0 y 1: "Criollo / mestizo" y "No sé la raza" van primero; el resto, alfabetico.
    orden INTEGER NOT NULL DEFAULT 100,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMP DEFAULT NOW(),
    UNIQUE (especie_id, nombre)
);

CREATE INDEX IF NOT EXISTS idx_raza_especie_id ON raza(especie_id);

-- Datos semilla: exactamente lo que estaba en el codigo.
INSERT INTO especie (nombre, icono, orden) VALUES
    ('Canino', 'perro', 0),
    ('Felino', 'gato', 1),
    ('Ave', 'ave', 2),
    ('Otro', 'pata', 3)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO raza (especie_id, nombre, orden)
SELECT e.id, v.nombre, v.orden
FROM especie e, (VALUES
    ('Criollo / mestizo', 0),
    ('No sé la raza', 1),
    ('Akita', 100),
    ('American bully', 100),
    ('Basset hound', 100),
    ('Beagle', 100),
    ('Bichón frisé', 100),
    ('Border collie', 100),
    ('Bóxer', 100),
    ('Bull terrier', 100),
    ('Bulldog francés', 100),
    ('Bulldog inglés', 100),
    ('Cane corso', 100),
    ('Caniche (poodle)', 100),
    ('Chihuahua', 100),
    ('Chow chow', 100),
    ('Cocker spaniel', 100),
    ('Corgi', 100),
    ('Dachshund (salchicha)', 100),
    ('Dálmata', 100),
    ('Doberman', 100),
    ('Golden retriever', 100),
    ('Gran danés', 100),
    ('Husky siberiano', 100),
    ('Jack Russell terrier', 100),
    ('Labrador retriever', 100),
    ('Maltés', 100),
    ('Mastín', 100),
    ('Pastor alemán', 100),
    ('Pastor belga', 100),
    ('Pinscher miniatura', 100),
    ('Pitbull', 100),
    ('Pomerania', 100),
    ('Pug', 100),
    ('Rottweiler', 100),
    ('Samoyedo', 100),
    ('San Bernardo', 100),
    ('Schnauzer', 100),
    ('Shar pei', 100),
    ('Shih tzu', 100),
    ('Weimaraner', 100),
    ('Yorkshire terrier', 100)
) AS v(nombre, orden)
WHERE e.nombre = 'Canino'
ON CONFLICT (especie_id, nombre) DO NOTHING;

INSERT INTO raza (especie_id, nombre, orden)
SELECT e.id, v.nombre, v.orden
FROM especie e, (VALUES
    ('Criollo / mestizo', 0),
    ('No sé la raza', 1),
    ('Abisinio', 100),
    ('Angora turco', 100),
    ('Azul ruso', 100),
    ('Bengalí', 100),
    ('Bombay', 100),
    ('British shorthair', 100),
    ('Esfinge (sphynx)', 100),
    ('Exótico de pelo corto', 100),
    ('Himalayo', 100),
    ('Maine coon', 100),
    ('Persa', 100),
    ('Ragdoll', 100),
    ('Sagrado de Birmania', 100),
    ('Scottish fold', 100),
    ('Siamés', 100)
) AS v(nombre, orden)
WHERE e.nombre = 'Felino'
ON CONFLICT (especie_id, nombre) DO NOTHING;

INSERT INTO raza (especie_id, nombre, orden)
SELECT e.id, v.nombre, v.orden
FROM especie e, (VALUES
    ('No sé la raza', 1),
    ('Agapornis', 100),
    ('Cacatúa', 100),
    ('Canario', 100),
    ('Gallina', 100),
    ('Guacamaya', 100),
    ('Loro', 100),
    ('Ninfa (cocotilla)', 100),
    ('Paloma', 100),
    ('Periquito australiano', 100),
    ('Pinzón', 100)
) AS v(nombre, orden)
WHERE e.nombre = 'Ave'
ON CONFLICT (especie_id, nombre) DO NOTHING;
