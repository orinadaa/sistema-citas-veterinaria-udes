-- Incremento 3 (ampliacion): perfil extendido y especialidades de medicos.
-- Motivado por los mockups de interfaz revisados: la pantalla de
-- Medicos deja de ser solo "asignar servicios" y pasa a ser un CRUD
-- completo (documento, telefono, foto, biografia, especialidades,
-- activo/inactivo). documento/foto_url/biografia son nullable porque
-- solo aplican a usuario.rol = 'veterinario' (igual que sede_id es
-- nullable para 'cliente', ver incremento_1_usuarios.sql).
ALTER TABLE usuario ADD COLUMN documento VARCHAR(20);
ALTER TABLE usuario ADD COLUMN foto_url VARCHAR(255);
ALTER TABLE usuario ADD COLUMN biografia VARCHAR(500);

-- "Especialidades" del medico reutiliza el mismo catalogo de
-- categoria_servicio (incremento_3b): el mockup muestra las
-- especialidades con el mismo componente visual (CategoryBadge) que la
-- categoria de un servicio, asi que es un solo concepto compartido.
CREATE TABLE usuario_especialidad (
    usuario_id UUID NOT NULL REFERENCES usuario(id),
    categoria_id UUID NOT NULL REFERENCES categoria_servicio(id),
    PRIMARY KEY (usuario_id, categoria_id)
);
