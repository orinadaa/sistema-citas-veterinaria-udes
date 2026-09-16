-- Incremento 2 (ampliacion): servicios veterinarios y asignacion a medicos
-- Motivado por retroalimentacion de la usuaria: el formulario de citas debe
-- pedir el tipo de servicio (catalogo real, ver identidadmarca/) y permitir
-- elegir el medico segun quien preste ese servicio y este libre en la franja.
--
-- La administracion real de medicos/especialidades (asignar que medico hace
-- que servicio) es del incremento 3 (RF-11, modulo administrativo). Mientras
-- tanto, servicio_medico se puebla con un script (ver seedVeterinarios.js),
-- igual que el admin se creo con seedAdmin.js en el incremento 1.

CREATE TABLE servicio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT NOW()
);

INSERT INTO servicio (nombre, descripcion) VALUES
    ('Consulta médica', 'Valoración y diagnóstico veterinario general.'),
    ('Vacunación', 'Esquemas de vacunación para perros y gatos.'),
    ('Desparasitación', 'Control de parásitos internos y externos.'),
    ('Profilaxis dental', 'Limpieza dental y prevención de enfermedad periodontal.'),
    ('Laboratorio clínico', 'Exámenes de sangre, orina y otras pruebas diagnósticas.'),
    ('Radiología', 'Estudios radiográficos para diagnóstico por imagen.'),
    ('Cirugía', 'Procedimientos quirúrgicos con seguimiento post-operatorio.'),
    ('Oncología', 'Diagnóstico y tratamiento de enfermedades oncológicas.'),
    ('Endoscopia', 'Procedimientos endoscópicos diagnósticos y terapéuticos.');

-- Que medico (usuario.rol = 'veterinario') presta que servicio.
CREATE TABLE servicio_medico (
    servicio_id UUID NOT NULL REFERENCES servicio(id),
    medico_id UUID NOT NULL REFERENCES usuario(id),
    PRIMARY KEY (servicio_id, medico_id)
);

CREATE INDEX idx_servicio_medico_medico_id ON servicio_medico(medico_id);

-- La cita ahora se agenda para un servicio y un medico especifico, no solo
-- una sede. cliente_id, sede_id no cambian. NOT NULL directo porque la
-- tabla esta vacia en este punto del desarrollo (sin datos que migrar).
ALTER TABLE cita ADD COLUMN servicio_id UUID NOT NULL REFERENCES servicio(id);
ALTER TABLE cita ADD COLUMN medico_id UUID NOT NULL REFERENCES usuario(id);

-- La restriccion de "no doble reserva" pasa de (sede, hora) a (medico, hora):
-- dos medicos distintos si pueden atender en la misma sede a la misma hora,
-- uno solo no puede estar en dos citas activas a la vez.
DROP INDEX idx_cita_franja_unica;
CREATE UNIQUE INDEX idx_cita_franja_unica_medico ON cita(medico_id, fecha_hora) WHERE estado = 'agendada';

CREATE INDEX idx_cita_servicio_id ON cita(servicio_id);
