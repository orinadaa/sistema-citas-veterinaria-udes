-- Incremento 4 (ampliacion): nuevo flujo de "Agendar cita" por pasos
-- (RF-06/RF-07). Campos que los mockups del flujo muestran y que el
-- modelo de datos no tenia todavia.

-- Servicio: "Duracion estimada: 30 minutos" en el resumen lateral.
-- Es informativa para el cliente: la agenda sigue funcionando en
-- franjas fijas de 30 min (utils/franjas.js), un servicio mas largo no
-- bloquea franjas adicionales en esta version.
ALTER TABLE servicio ADD COLUMN duracion_minutos INTEGER NOT NULL DEFAULT 30 CHECK (duracion_minutos > 0);

-- Sede: badge "Sede principal", codigo corto para el consecutivo de la
-- cita (CV-BGA-2026-00045) y amenidades de la tarjeta de sede.
ALTER TABLE sede ADD COLUMN es_principal BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE sede ADD COLUMN codigo VARCHAR(5) UNIQUE;
ALTER TABLE sede ADD COLUMN tiene_parqueadero BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE sede ADD COLUMN sala_pet_friendly BOOLEAN NOT NULL DEFAULT false;

-- Solo una sede puede ser la principal.
CREATE UNIQUE INDEX idx_sede_principal_unica ON sede(es_principal) WHERE es_principal;

UPDATE sede SET codigo = 'BGA', es_principal = true WHERE ciudad = 'Bucaramanga';
UPDATE sede SET codigo = 'VUP' WHERE ciudad = 'Valledupar';
-- Cualquier otra sede creada antes de esta migracion: codigo derivado
-- de la ciudad (el admin lo puede corregir desde Sedes).
UPDATE sede SET codigo = UPPER(LEFT(regexp_replace(ciudad, '[^A-Za-z]', '', 'g'), 3)) WHERE codigo IS NULL;
ALTER TABLE sede ALTER COLUMN codigo SET NOT NULL;

-- Consecutivo de cita por sede y por año: una fila por (sede, año) con
-- el ultimo numero usado. Se incrementa con un upsert atomico dentro de
-- la misma transaccion que inserta la cita (ver cita.model.js#crear).
CREATE TABLE consecutivo_cita (
    sede_id UUID NOT NULL REFERENCES sede(id),
    anio INTEGER NOT NULL,
    ultimo INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (sede_id, anio)
);

ALTER TABLE cita ADD COLUMN codigo VARCHAR(20) UNIQUE;

-- Numera las citas que ya existian, en orden de creacion, por sede y
-- año de creacion, y deja el consecutivo listo para continuar.
WITH numeradas AS (
    SELECT c.id, s.codigo AS sede_codigo, EXTRACT(YEAR FROM c.creado_en)::int AS anio,
           ROW_NUMBER() OVER (PARTITION BY c.sede_id, EXTRACT(YEAR FROM c.creado_en) ORDER BY c.creado_en, c.id) AS numero
    FROM cita c
    JOIN sede s ON s.id = c.sede_id
)
UPDATE cita SET codigo = 'CV-' || n.sede_codigo || '-' || n.anio || '-' || LPAD(n.numero::text, 5, '0')
FROM numeradas n
WHERE cita.id = n.id;

INSERT INTO consecutivo_cita (sede_id, anio, ultimo)
SELECT sede_id, EXTRACT(YEAR FROM creado_en)::int, COUNT(*)
FROM cita
GROUP BY sede_id, EXTRACT(YEAR FROM creado_en);

ALTER TABLE cita ALTER COLUMN codigo SET NOT NULL;
