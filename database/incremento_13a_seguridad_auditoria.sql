-- Correcciones de la auditoria del 11 de octubre de 2026 (ver
-- docs/auditoria_sistema_2026-10-11.pdf). Solo agrega columnas e indices: no
-- cambia ni borra datos existentes.

-- Los tokens de sesion emitidos antes de esta fecha dejan de servir. Se
-- actualiza cada vez que la cuenta cambia de contraseña (SEG-02).
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS sesiones_validas_desde TIMESTAMPTZ;

-- Cuando autorizo el tratamiento de sus datos personales al registrarse
-- (Ley 1581 de 2012). NULL en las cuentas anteriores a esta columna.
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS autorizo_tratamiento_en TIMESTAMPTZ;

-- Llaves foraneas que no tenian indice (BD-02).
CREATE INDEX IF NOT EXISTS idx_cita_mascota_id ON cita (mascota_id);
CREATE INDEX IF NOT EXISTS idx_cita_medico_fecha ON cita (medico_id, fecha_hora);
CREATE INDEX IF NOT EXISTS idx_servicio_categoria_id ON servicio (categoria_id);
CREATE INDEX IF NOT EXISTS idx_usuario_especialidad_categoria_id ON usuario_especialidad (categoria_id);
CREATE INDEX IF NOT EXISTS idx_recordatorio_cliente_id ON recordatorio (cliente_id);
