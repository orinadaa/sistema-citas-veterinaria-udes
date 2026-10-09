-- incremento_8c_quitar_campos.sql
-- Se retira por completo el modulo "Campos" (campos personalizados de los
-- formularios, incremento 7a), por decision de Oriana. Se quita su
-- estructura: la tabla de definiciones y la columna de la mascota donde se
-- guardaban los valores.
--
-- Al retirarlo no habia ningun campo definido ni ninguna mascota con datos
-- adicionales (se verifico antes de ejecutar), asi que no se pierde nada.
-- OJO: si se ejecuta en otra base que si tenga campos definidos, esos datos
-- se pierden. Revisar primero:
--   SELECT COUNT(*) FROM definicion_campo;
--   SELECT COUNT(*) FROM mascota WHERE campos_adicionales <> '{}'::jsonb;

ALTER TABLE mascota DROP COLUMN IF EXISTS campos_adicionales;
DROP TABLE IF EXISTS definicion_campo;
