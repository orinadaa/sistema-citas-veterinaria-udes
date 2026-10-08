-- Foto de cada servicio: la que se muestra en la seccion "Servicios" de
-- la pagina publica (antes las fotos estaban fijas en el codigo). La sube
-- el administrador desde Servicios > Editar; el archivo vive en
-- backend/uploads/servicios y aqui solo se guarda su ruta publica.
-- Un servicio sin foto no aparece en el slider del inicio (si se puede
-- agendar).
-- foto_descripcion: texto alternativo para lectores de pantalla.
-- foto_foco_x / foto_foco_y: punto de la foto (en %) que debe quedar al
-- centro cuando el slider la recorta.
-- foto_fondo_claro: la foto es clara en la zona del texto, asi que el
-- slider la oscurece mas para que el texto blanco se lea (se calcula solo
-- al subirla).
-- Las fotos predeterminadas se cargan con: npm run seed:fotos-servicios.
ALTER TABLE servicio
    ADD COLUMN foto_url VARCHAR(255),
    ADD COLUMN foto_descripcion VARCHAR(200),
    ADD COLUMN foto_foco_x SMALLINT NOT NULL DEFAULT 50 CHECK (foto_foco_x BETWEEN 0 AND 100),
    ADD COLUMN foto_foco_y SMALLINT NOT NULL DEFAULT 50 CHECK (foto_foco_y BETWEEN 0 AND 100),
    ADD COLUMN foto_fondo_claro BOOLEAN NOT NULL DEFAULT TRUE;
