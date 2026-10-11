-- Incremento 14a: logotipos de la clinica editables por el superadministrador
-- (Pagina web > Logotipos; pedido de Oriana, 11 de octubre de 2026). Solo
-- crea una tabla nueva: no cambia ni borra datos existentes.
--
-- Cada fila es un logotipo que el superadministrador reemplazo por un archivo
-- propio. Un logotipo SIN fila usa el archivo original que viene con el
-- sistema (frontend/src/assets), asi que la tabla empieza vacia y "restaurar
-- el original" es borrar la fila.
-- clave: principal_blanco, principal_color, corto_color, corto_blanco, icono
-- (la lista y donde se usa cada uno estan en logo.controller.js).
CREATE TABLE IF NOT EXISTS logo_clinica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(30) NOT NULL UNIQUE,
    -- Ruta publica del archivo subido (/uploads/logos/...).
    archivo_url VARCHAR(255) NOT NULL,
    actualizado_en TIMESTAMP DEFAULT NOW(),
    creado_en TIMESTAMP DEFAULT NOW()
);
