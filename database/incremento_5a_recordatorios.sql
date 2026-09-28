-- Modulo del medico: recordatorios que el medico crea para una mascota
-- (medicacion, control, vacunacion, desparasitacion u otro). Decision
-- de la usuaria: al crearlo se envia un correo al dueño con el detalle;
-- el envio automatico el dia del recordatorio queda para el modulo de
-- notificaciones (incremento 5).
CREATE TABLE recordatorio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('medicacion', 'control', 'vacunacion', 'desparasitacion', 'otro')),
    titulo VARCHAR(120) NOT NULL,
    descripcion VARCHAR(300),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    mascota_id UUID NOT NULL REFERENCES mascota(id),
    cliente_id UUID NOT NULL REFERENCES usuario(id),
    medico_id UUID NOT NULL REFERENCES usuario(id),
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recordatorio_mascota ON recordatorio(mascota_id, fecha);
CREATE INDEX idx_recordatorio_medico ON recordatorio(medico_id, fecha);
