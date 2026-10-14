-- incremento_16a_textos_sitio.sql
-- Textos de marca de la pagina publica que el superadministrador cambia sin
-- programar (Pagina web > Textos): titulo y descripcion del hero, titulos de
-- las secciones y textos institucionales del pie de pagina.
--
-- Solo se guardan los textos CAMBIADOS. La lista de textos editables, su
-- largo maximo y el texto original viven en el codigo
-- (backend/src/utils/textosSitio.js): sin fila, la pagina usa el original, y
-- "Restaurar texto original" borra la fila.

CREATE TABLE IF NOT EXISTS texto_sitio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(40) NOT NULL UNIQUE,
    valor VARCHAR(400) NOT NULL,
    actualizado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    actualizado_en TIMESTAMP DEFAULT NOW(),
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_texto_sitio_actualizado_por ON texto_sitio(actualizado_por);
