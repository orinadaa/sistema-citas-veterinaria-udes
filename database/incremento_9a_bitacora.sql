-- incremento_9a_bitacora.sql
-- Bitacora: quien cambio que y cuando. La escribe el servidor cada vez que
-- una accion de configuracion o de correccion de datos termina bien (ver
-- backend/src/middlewares/bitacora.middleware.js). Es solo de escritura
-- (INSERT) y de consulta: no hay rutas para editar ni borrar sus filas.
--
-- usuario_id no es llave foranea a proposito: la bitacora debe conservarse
-- tal cual aunque la cuenta cambie. El nombre se resuelve al consultar.

CREATE TABLE IF NOT EXISTS bitacora (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID,
    usuario_rol VARCHAR(30),
    accion VARCHAR(60) NOT NULL,
    entidad VARCHAR(40) NOT NULL,
    entidad_id VARCHAR(60),
    -- Resumen legible de lo que se envio (sin contraseñas ni archivos).
    detalle TEXT,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bitacora_creado_en ON bitacora (creado_en DESC);
