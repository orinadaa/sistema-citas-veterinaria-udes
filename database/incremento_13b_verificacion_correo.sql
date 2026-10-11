-- Incremento 13b: verificacion del correo al registrarse (SEG-04 de la
-- auditoria del 11 de octubre de 2026). Solo crea una tabla nueva: no cambia
-- ni borra datos existentes.
--
-- Quien se registra queda aqui hasta que escribe el codigo que le llega al
-- correo; solo entonces se crea su fila en "usuario". Asi nunca existe una
-- cuenta con un correo que no es de quien la creo.
-- El codigo se guarda hasheado (bcrypt), igual que el de recuperacion.
-- correo es UNIQUE para poder hacer upsert: registrarse de nuevo con el mismo
-- correo reemplaza la solicitud anterior.
CREATE TABLE IF NOT EXISTS registro_pendiente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correo VARCHAR(150) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    codigo_hash VARCHAR(255) NOT NULL,
    intentos INTEGER NOT NULL DEFAULT 0,
    -- Cuando vence el codigo vigente.
    expira_en TIMESTAMPTZ NOT NULL,
    -- Cuando se envio el codigo vigente (para no reenviar antes de un minuto).
    codigo_enviado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Cuando autorizo el tratamiento de sus datos (Ley 1581 de 2012).
    autorizo_tratamiento_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
