-- Duracion de cada cita.
-- La columna cita.duracion_minutos ya existia con valor 30 por defecto, pero
-- no se llenaba al agendar: los cruces se calculaban con la duracion actual
-- del servicio. Desde ahora cada cita guarda la duracion con la que se agendo.
-- Este script la completa en las citas anteriores a partir de su servicio.
-- Se puede ejecutar mas de una vez: solo toca las filas que difieren.

UPDATE cita c
SET duracion_minutos = GREATEST(sv.duracion_minutos, 30)
FROM servicio sv
WHERE sv.id = c.servicio_id
  AND c.duracion_minutos IS DISTINCT FROM GREATEST(sv.duracion_minutos, 30);
