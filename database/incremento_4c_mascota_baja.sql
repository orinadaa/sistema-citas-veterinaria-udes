-- Incremento 4 (ampliacion): el cliente puede eliminar una mascota.
-- Baja logica, no DELETE: cita.mascota_id es NOT NULL y las citas
-- pasadas deben seguir mostrando a que mascota atendieron. Una mascota
-- inactiva desaparece de "Mis mascotas", del flujo de agendamiento y
-- del conteo de Pacientes del admin, y ya no se le puede agendar.
ALTER TABLE mascota ADD COLUMN activo BOOLEAN NOT NULL DEFAULT true;
