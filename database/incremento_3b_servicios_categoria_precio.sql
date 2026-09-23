-- Incremento 3 (ampliacion): categoria y precio de catalogo para servicios.
-- Motivado por los mockups de interfaz revisados: la pantalla de
-- Servicios muestra la categoria (con color) y el precio de cada
-- servicio. El precio es un valor de catalogo informativo (como un
-- listado de tarifas); no hay facturacion, pagos ni ingresos en ningun
-- lado del sistema (restriccion vigente en el alcance del proyecto).
--
-- categoria_servicio tambien la usa usuario_especialidad (incremento
-- 3c): la pantalla de Medicos muestra "especialidades" con el mismo
-- componente visual (CategoryBadge) que la categoria de un servicio,
-- asi que se modela como un solo catalogo compartido en vez de dos
-- conceptos paralelos.
CREATE TABLE categoria_servicio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(40) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL CHECK (color IN ('blue', 'amber', 'teal', 'purple', 'pink', 'cyan', 'orange')),
    creado_en TIMESTAMP DEFAULT NOW()
);

-- 10 nombres agrupados en los 7 colores de la paleta "category" del
-- sistema de diseno (seccion 1.1): varios nombres pueden compartir color
-- (ej. "Limpieza dental" y "Cirugia" son ambos "pink" en el documento).
INSERT INTO categoria_servicio (nombre, color) VALUES
    ('Consulta', 'blue'),
    ('Vacunación', 'amber'),
    ('Preventiva', 'teal'),
    ('Revisión de rutina', 'teal'),
    ('Control de peso', 'purple'),
    ('Diagnóstico', 'purple'),
    ('Limpieza dental', 'pink'),
    ('Cirugía', 'pink'),
    ('Desparasitación', 'cyan'),
    ('Especialidad', 'orange');

ALTER TABLE servicio ADD COLUMN categoria_id UUID REFERENCES categoria_servicio(id);
ALTER TABLE servicio ADD COLUMN precio INTEGER NOT NULL DEFAULT 0 CHECK (precio >= 0);

-- Mapeo de los 9 servicios sembrados en el incremento 2b a su categoria
-- (juicio del equipo, el admin puede reclasificar despues desde el panel).
UPDATE servicio SET categoria_id = (SELECT id FROM categoria_servicio WHERE nombre = 'Consulta') WHERE nombre = 'Consulta médica';
UPDATE servicio SET categoria_id = (SELECT id FROM categoria_servicio WHERE nombre = 'Vacunación') WHERE nombre = 'Vacunación';
UPDATE servicio SET categoria_id = (SELECT id FROM categoria_servicio WHERE nombre = 'Desparasitación') WHERE nombre = 'Desparasitación';
UPDATE servicio SET categoria_id = (SELECT id FROM categoria_servicio WHERE nombre = 'Limpieza dental') WHERE nombre = 'Profilaxis dental';
UPDATE servicio SET categoria_id = (SELECT id FROM categoria_servicio WHERE nombre = 'Diagnóstico') WHERE nombre IN ('Laboratorio clínico', 'Radiología');
UPDATE servicio SET categoria_id = (SELECT id FROM categoria_servicio WHERE nombre = 'Cirugía') WHERE nombre = 'Cirugía';
UPDATE servicio SET categoria_id = (SELECT id FROM categoria_servicio WHERE nombre = 'Especialidad') WHERE nombre IN ('Oncología', 'Endoscopia');

-- Precios de catalogo de referencia (COP), ajustables desde el panel.
UPDATE servicio SET precio = 60000 WHERE nombre = 'Consulta médica';
UPDATE servicio SET precio = 45000 WHERE nombre = 'Vacunación';
UPDATE servicio SET precio = 35000 WHERE nombre = 'Desparasitación';
UPDATE servicio SET precio = 80000 WHERE nombre = 'Profilaxis dental';
UPDATE servicio SET precio = 70000 WHERE nombre = 'Laboratorio clínico';
UPDATE servicio SET precio = 90000 WHERE nombre = 'Radiología';
UPDATE servicio SET precio = 350000 WHERE nombre = 'Cirugía';
UPDATE servicio SET precio = 150000 WHERE nombre = 'Oncología';
UPDATE servicio SET precio = 200000 WHERE nombre = 'Endoscopia';

ALTER TABLE servicio ALTER COLUMN categoria_id SET NOT NULL;
