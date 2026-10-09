-- incremento_10a_clave_temporal.sql
-- Seguridad: una cuenta creada por otra persona (administrador o medico que
-- crea el superadministrador o el administrador de sede) nace con una
-- contraseña temporal generada por el sistema. Esta marca obliga a esa
-- persona a establecer su propia contraseña la primera vez que entra.
--
-- Solo agrega la columna, en falso para todas las cuentas que ya existen:
-- nadie queda obligado a cambiar su clave por esta migracion. Se pone en
-- verdadero al crear una cuenta con clave temporal y vuelve a falso cuando
-- la persona establece su contraseña (o la restablece por codigo).

ALTER TABLE usuario ADD COLUMN IF NOT EXISTS debe_cambiar_contrasena BOOLEAN NOT NULL DEFAULT false;
