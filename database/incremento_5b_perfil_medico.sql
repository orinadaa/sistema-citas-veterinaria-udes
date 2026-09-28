-- Modulo del medico: "Mi perfil".
-- Datos personales y profesionales que el propio medico edita. Las
-- especialidades y servicios siguen siendo de solo lectura para el (los
-- asigna el administrador en Medicos). Formacion academica,
-- certificaciones y documentos quedan fuera de este incremento.
ALTER TABLE usuario
    ADD COLUMN direccion VARCHAR(200),
    ADD COLUMN titulos_profesionales VARCHAR(500),
    ADD COLUMN registro_profesional VARCHAR(50),
    ADD COLUMN anios_experiencia VARCHAR(10)
        CHECK (anios_experiencia IN ('0-1', '1-3', '3-5', '5-10', '10+'));

-- Cambio de correo con verificacion (decision de la usuaria): el
-- correo nuevo solo se aplica despues de confirmar un codigo de 6
-- digitos enviado A ESE correo nuevo. Un solo cambio pendiente por
-- usuario, 15 minutos de vigencia, maximo 5 intentos (mismo criterio
-- que codigo_recuperacion).
CREATE TABLE verificacion_correo (
    usuario_id UUID PRIMARY KEY REFERENCES usuario(id),
    correo_nuevo VARCHAR(150) NOT NULL,
    codigo_hash VARCHAR(255) NOT NULL,
    intentos INTEGER NOT NULL DEFAULT 0,
    expira_en TIMESTAMP NOT NULL,
    creado_en TIMESTAMP DEFAULT NOW()
);
