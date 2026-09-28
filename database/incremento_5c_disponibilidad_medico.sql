-- Modulo del medico: disponibilidad propia (opcion A aprobada por la
-- usuaria: horario por medico y sede + bloqueos).
--
-- horario_medico: que dias atiende el medico, en que sede y en que
-- rango (con una pausa opcional, ej. almuerzo). Una fila por dia: un
-- medico puede atender en sedes distintas en dias distintos (multisede).
-- Si un medico NO tiene filas aqui, sigue funcionando como antes: atiende
-- en su sede (usuario.sede_id) con el horario de atencion de la sede.
-- Las franjas que se ofrecen siempre salen del horario de la sede
-- (horario_atencion): el horario del medico solo las restringe.
CREATE TABLE horario_medico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medico_id UUID NOT NULL REFERENCES usuario(id),
    sede_id UUID NOT NULL REFERENCES sede(id),
    dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    pausa_inicio TIME,
    pausa_fin TIME,
    creado_en TIMESTAMP DEFAULT NOW(),
    UNIQUE (medico_id, dia_semana),
    CHECK (hora_inicio < hora_fin),
    CHECK ((pausa_inicio IS NULL) = (pausa_fin IS NULL)),
    CHECK (pausa_inicio IS NULL OR (pausa_inicio >= hora_inicio AND pausa_fin <= hora_fin AND pausa_inicio < pausa_fin))
);

-- bloqueo_medico: vacaciones, permisos o excepciones. Sin horas =
-- dias completos; con horas = solo ese rango en cada dia del bloqueo.
CREATE TABLE bloqueo_medico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medico_id UUID NOT NULL REFERENCES usuario(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    motivo VARCHAR(150),
    creado_en TIMESTAMP DEFAULT NOW(),
    CHECK (fecha_inicio <= fecha_fin),
    CHECK ((hora_inicio IS NULL) = (hora_fin IS NULL)),
    CHECK (hora_inicio IS NULL OR hora_inicio < hora_fin)
);

CREATE INDEX idx_horario_medico_sede_dia ON horario_medico(sede_id, dia_semana);
CREATE INDEX idx_bloqueo_medico_fechas ON bloqueo_medico(medico_id, fecha_inicio, fecha_fin);
