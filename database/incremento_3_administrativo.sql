-- Incremento 3: modulo administrativo
-- RF-10 (agenda por sede), RF-11 (servicios, ya existia el catalogo,
-- aqui se habilita CRUD), RF-12 (seguimiento de citas), RF-13 (horarios
-- de atencion configurables por sede).

-- Reemplaza la constante fija backend/src/config/horarioAtencion.js:
-- ahora el horario de atencion se guarda por sede y dia de la semana.
-- Si una sede no tiene fila para un dia, ese dia esta cerrada (igual
-- que domingo lo estaba en la version anterior).
CREATE TABLE horario_atencion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sede_id UUID NOT NULL REFERENCES sede(id),
    dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=domingo ... 6=sabado
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    creado_en TIMESTAMP DEFAULT NOW(),
    UNIQUE (sede_id, dia_semana),
    CHECK (hora_inicio < hora_fin)
);

-- Semilla: mismo horario que tenia la constante fija, para ambas sedes
-- (lunes a viernes 8:00-17:00, sabado 8:00-12:00, domingo cerrado).
INSERT INTO horario_atencion (sede_id, dia_semana, hora_inicio, hora_fin)
SELECT sede.id, dia.numero, dia.inicio, dia.fin
FROM sede
CROSS JOIN (VALUES
    (1, '08:00'::TIME, '17:00'::TIME),
    (2, '08:00'::TIME, '17:00'::TIME),
    (3, '08:00'::TIME, '17:00'::TIME),
    (4, '08:00'::TIME, '17:00'::TIME),
    (5, '08:00'::TIME, '17:00'::TIME),
    (6, '08:00'::TIME, '12:00'::TIME)
) AS dia(numero, inicio, fin);
