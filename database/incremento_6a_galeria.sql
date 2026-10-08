-- Galeria del inicio: las fotos que rotan en el Hero de la pagina
-- publica. Las administra el administrador desde Configuracion >
-- Galeria (subir, describir, encuadrar, ordenar, ocultar, eliminar).
-- El archivo vive en backend/uploads/galeria (igual que las fotos de
-- mascotas); aqui solo se guarda su ruta publica.
-- foco_x / foco_y: punto de la foto (en %) que debe quedar al centro
-- cuando el Hero la recorta a su marco.
-- Las fotos de ejemplo se cargan con: npm run seed:galeria (backend).
CREATE TABLE foto_galeria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    foto_url VARCHAR(255) NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    foco_x SMALLINT NOT NULL DEFAULT 50 CHECK (foco_x BETWEEN 0 AND 100),
    foco_y SMALLINT NOT NULL DEFAULT 50 CHECK (foco_y BETWEEN 0 AND 100),
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_foto_galeria_orden ON foto_galeria (orden);
