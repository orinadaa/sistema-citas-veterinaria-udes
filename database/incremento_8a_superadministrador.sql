-- incremento_8a_superadministrador.sql
-- Nuevo rol "superadministrador": administra el sistema completo (sedes,
-- cuentas, pagina web, campos y catalogos). El "administrador" queda como
-- administrador de UNA sede (usuario.sede_id): citas, medicos, pacientes,
-- servicios y horario de su sede.
--
-- Solo amplia la lista de roles permitidos; no cambia ninguna cuenta
-- existente. El superadministrador no pertenece a una sede (sede_id NULL).
-- La cuenta se crea con: npm run crear:superadmin (backend).

ALTER TABLE usuario DROP CONSTRAINT IF EXISTS usuario_rol_check;
ALTER TABLE usuario
    ADD CONSTRAINT usuario_rol_check
    CHECK (rol IN ('superadministrador', 'administrador', 'veterinario', 'cliente'));
