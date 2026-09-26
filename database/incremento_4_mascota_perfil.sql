-- Incremento 4: modulo de clientes -- amplia el perfil de "mascota"
-- (identidad, no historial clinico: sigue vigente la restriccion del
-- alcance del proyecto) para la pantalla "Mis mascotas" del panel del cliente.
ALTER TABLE mascota
    ADD COLUMN fecha_nacimiento DATE,
    ADD COLUMN sexo VARCHAR(10) CHECK (sexo IN ('macho', 'hembra')),
    ADD COLUMN color VARCHAR(50),
    ADD COLUMN peso_kg NUMERIC(5,2),
    ADD COLUMN caracteristicas TEXT;
