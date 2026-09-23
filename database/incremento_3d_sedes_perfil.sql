-- Incremento 3 (ampliacion): perfil extendido de sedes.
-- Motivado por los mockups de interfaz revisados: la pantalla de
-- Sedes/Horarios pasa de "editar solo mi sede" a gestionar la lista
-- completa de sedes (direccion, foto, activa/inactiva). El criterio de
-- permisos es el mismo que ya tenia horario_atencion: cualquier
-- administrador puede gestionar cualquier sede (ver horario.controller.js,
-- que ya acepta cualquier sedeId sin comparar contra req.usuario.sedeId).
ALTER TABLE sede ADD COLUMN direccion VARCHAR(200);
ALTER TABLE sede ADD COLUMN foto_url VARCHAR(255);
ALTER TABLE sede ADD COLUMN activo BOOLEAN DEFAULT true;
