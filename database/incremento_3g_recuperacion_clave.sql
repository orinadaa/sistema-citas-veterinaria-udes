-- Incremento 3g: recuperacion de contraseña por codigo (cualquier rol)
-- El codigo se guarda hasheado (bcrypt), nunca en texto plano. usuario_id
-- es UNIQUE para poder hacer upsert: pedir un codigo nuevo reemplaza el
-- anterior (siempre hay a lo sumo un codigo activo por usuario).
CREATE TABLE codigo_recuperacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuario(id) ON DELETE CASCADE,
    codigo_hash VARCHAR(255) NOT NULL,
    intentos INTEGER NOT NULL DEFAULT 0,
    expira_en TIMESTAMP NOT NULL,
    creado_en TIMESTAMP DEFAULT NOW()
);
