-- incremento_18a_festivos_colombia.sql
-- Excepciones de horario para festivos nacionales. Sin fila, el festivo queda
-- cerrado; el administrador puede abrirlo guardando una franja horaria.

CREATE TABLE IF NOT EXISTS horario_excepcion_sede (
    sede_id uuid NOT NULL REFERENCES sede(id) ON DELETE CASCADE,
    fecha date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    actualizado_por uuid REFERENCES usuario(id) ON DELETE SET NULL,
    actualizado_en timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT horario_excepcion_sede_pkey PRIMARY KEY (sede_id, fecha),
    CONSTRAINT horario_excepcion_sede_horas_check CHECK (hora_inicio < hora_fin)
);

CREATE INDEX IF NOT EXISTS idx_horario_excepcion_fecha ON horario_excepcion_sede (fecha);
