-- Campos personalizados administrables: el administrador agrega campos a
-- ciertos formularios sin programar (Configuracion > Campos). Por ahora
-- solo para la mascota; la arquitectura sirve para otras entidades.
--
-- Diseño (acordado con la usuaria): tabla de DEFINICIONES + una columna
-- JSONB con los VALORES en cada tabla que los use.
--
-- REGLA DE NEGOCIO: un campo NUNCA se elimina, solo se desactiva
-- (activo = false). Desactivado deja de pedirse en registros nuevos, pero
-- los valores ya guardados se conservan y siguen siendo legibles. Por lo
-- mismo:
--   - `clave` (la llave del JSON) y `tipo` no cambian despues de crear;
--   - las opciones de un campo de seleccion tampoco se eliminan: cada una
--     lleva su propio `activo`.
-- No existe ningun DELETE sobre esta tabla en la aplicacion.
--
-- entidad: a que formulario aplica ('mascota').
-- tipo: texto_corto | texto_largo | numero | fecha | booleano | seleccion
--       | archivo (PDF o imagen; el archivo vive en backend/uploads/adjuntos
--       y en el JSON se guarda { url, nombre, tipo }).
-- opciones (solo seleccion): [{ "valor": "al_dia", "etiqueta": "Al día",
--       "activo": true }]. En el registro se guarda `valor`.
CREATE TABLE definicion_campo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entidad VARCHAR(40) NOT NULL,
    clave VARCHAR(60) NOT NULL,
    etiqueta VARCHAR(80) NOT NULL,
    tipo VARCHAR(20) NOT NULL
        CHECK (tipo IN ('texto_corto', 'texto_largo', 'numero', 'fecha', 'booleano', 'seleccion', 'archivo')),
    ayuda VARCHAR(160),
    opciones JSONB NOT NULL DEFAULT '[]',
    requerido BOOLEAN NOT NULL DEFAULT FALSE,
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT NOW(),
    UNIQUE (entidad, clave)
);

CREATE INDEX idx_definicion_campo_entidad ON definicion_campo (entidad, orden);

-- Valores de los campos personalizados de cada mascota:
-- { "<clave>": <valor>, ... }
ALTER TABLE mascota ADD COLUMN campos_adicionales JSONB NOT NULL DEFAULT '{}';
