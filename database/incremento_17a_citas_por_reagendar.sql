-- incremento_17a_citas_por_reagendar.sql
-- Estado "por_reagendar": la cita quedo fuera del horario porque la sede
-- cambio o cerro un dia de atencion, o porque el medico tiene un bloqueo y
-- ningun otro medico podia tomarla. La franja queda libre (solo cuentan las
-- citas 'agendada'), el cliente debe elegir una fecha nueva y, si no lo
-- hace antes de reagendar_hasta, la plataforma la cancela.
--
--   motivo_reagendar              texto que ve el cliente (por que debe reagendar)
--   reagendar_hasta               plazo para reagendar
--   recordatorio_reagendar_en     cuando se le recordo que el plazo se acaba (una sola vez)

ALTER TABLE cita DROP CONSTRAINT IF EXISTS cita_estado_check;
ALTER TABLE cita ADD CONSTRAINT cita_estado_check
    CHECK (estado IN ('agendada', 'cancelada', 'por_reagendar'));

ALTER TABLE cita ADD COLUMN IF NOT EXISTS motivo_reagendar VARCHAR(200);
ALTER TABLE cita ADD COLUMN IF NOT EXISTS reagendar_hasta TIMESTAMP;
ALTER TABLE cita ADD COLUMN IF NOT EXISTS recordatorio_reagendar_en TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_cita_por_reagendar ON cita (cliente_id) WHERE estado = 'por_reagendar';
