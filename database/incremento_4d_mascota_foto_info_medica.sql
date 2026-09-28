-- Incremento 4 (ampliacion): foto real e informacion medica de la mascota.
--
-- Foto: se sube como archivo (POST /api/mascotas/:id/foto, multer) a
-- backend/uploads/mascotas/ y mascota.foto_url guarda solo la ruta
-- publica (/uploads/mascotas/<archivo>.jpg) -- el patron habitual en
-- sistemas reales (archivo en almacenamiento, ruta en la base), no la
-- imagen dentro de la base de datos. La columna foto_url ya existia.
--
-- Informacion medica: 4 campos de texto libre OPCIONALES que informa el
-- dueño. No es historial clinico (sigue vigente la restriccion del
-- alcance del proyecto): no hay registros por fecha, ni diagnosticos ni
-- tratamientos del veterinario -- solo lo que el dueño quiere que la
-- clinica sepa de su mascota.
ALTER TABLE mascota
    ADD COLUMN alergias TEXT,
    ADD COLUMN medicamentos TEXT,
    ADD COLUMN condiciones_medicas TEXT,
    ADD COLUMN observaciones TEXT;
