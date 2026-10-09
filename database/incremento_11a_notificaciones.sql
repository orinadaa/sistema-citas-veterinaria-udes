-- incremento_11a_notificaciones.sql
-- Modulo de notificaciones (RF-17, RF-18).
-- 1. notificacion: los avisos que cada persona ve al pulsar la campana (cita
--    agendada, reprogramada o cancelada, mascota registrada, recordatorio del
--    medico y recordatorio previo a la cita). Una fila por destinatario.
-- 2. cita.recordatorio_enviado_en: cuando se envio el recordatorio automatico
--    de las 24 horas previas, para no repetirlo. Reprogramar la cita lo
--    vuelve a dejar en NULL (ver cita.model.js#reprogramar).
-- Solo agrega estructura: no cambia ninguna fila existente.

CREATE TABLE IF NOT EXISTS notificacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuario(id),
    tipo VARCHAR(30) NOT NULL,
    titulo VARCHAR(120) NOT NULL,
    mensaje VARCHAR(400) NOT NULL,
    -- A donde lleva al pulsarla: una ruta ("/panel?tab=citas", "/medico").
    enlace VARCHAR(120),
    leida BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificacion_usuario ON notificacion (usuario_id, creado_en DESC);

ALTER TABLE cita ADD COLUMN IF NOT EXISTS recordatorio_enviado_en TIMESTAMP;
