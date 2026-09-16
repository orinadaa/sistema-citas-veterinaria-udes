-- Incremento 2: modulo de gestion de citas
-- RF-06, RF-07, RF-08, RF-09
-- El horario de atencion (para calcular disponibilidad, RF-07) vive por
-- ahora como constante en el backend (backend/src/config/horarioAtencion.js),
-- igual para ambas sedes, siguiendo el horario ya publicado en la landing.
-- RF-13 (incremento 3, modulo administrativo) lo hara configurable por sede.

-- nombre_mascota es texto libre por ahora: el modulo de mascotas
-- (RF-14, incremento 4) todavia no existe. Cuando exista, se evoluciona
-- a una referencia real (mascota_id).
CREATE TABLE cita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES usuario(id),
    sede_id UUID NOT NULL REFERENCES sede(id),
    fecha_hora TIMESTAMP NOT NULL,
    duracion_minutos INTEGER NOT NULL DEFAULT 30,
    nombre_mascota VARCHAR(100) NOT NULL,
    motivo VARCHAR(255),
    estado VARCHAR(20) NOT NULL DEFAULT 'agendada' CHECK (estado IN ('agendada', 'cancelada')),
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cita_cliente_id ON cita(cliente_id);
CREATE INDEX idx_cita_sede_fecha ON cita(sede_id, fecha_hora);

-- Evita que dos citas activas ocupen la misma franja en la misma sede,
-- como respaldo a nivel de base de datos ademas de la validacion en la API.
CREATE UNIQUE INDEX idx_cita_franja_unica ON cita(sede_id, fecha_hora) WHERE estado = 'agendada';
