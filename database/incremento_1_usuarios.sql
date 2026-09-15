-- Incremento 1: modulo de usuarios y autenticacion
-- RF-01, RF-02, RF-03, RF-04, RF-05 / RNF-03, RNF-06
-- Convenciones: snake_case, singular, UUID, creado_en, <tabla>_id (ver CLAUDE.md)

-- La extension uuid-ossp ya esta habilitada en esta base de datos
-- (verificado con \dx), se deja la sentencia por si se recrea la BD desde cero.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sedes de la clinica (Bucaramanga, Valledupar). Soporta RNF-06:
-- una sola base de datos, tablas filtradas por sede_id.
CREATE TABLE sede (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Usuarios del sistema. El rol "cliente no autenticado" (RF-04) no se
-- modela aqui: es un visitante sin sesion, no una fila de esta tabla.
-- sede_id es nullable porque un cliente no esta atado a una sola sede
-- (elige sede al agendar cada cita); para administrador/veterinario
-- se exige en la capa de aplicacion, no como constraint SQL.
CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('administrador', 'veterinario', 'cliente')),
    sede_id UUID REFERENCES sede(id),
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuario_correo ON usuario(correo);
CREATE INDEX idx_usuario_sede_id ON usuario(sede_id);

-- Datos semilla: las dos sedes del alcance del proyecto.
INSERT INTO sede (nombre, ciudad) VALUES
    ('Clinica Veterinaria UDES Bucaramanga', 'Bucaramanga'),
    ('Clinica Veterinaria UDES Valledupar', 'Valledupar');
