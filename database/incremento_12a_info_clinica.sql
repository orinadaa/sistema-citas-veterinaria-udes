-- incremento_12a_info_clinica.sql
-- RF-23: informacion general de la clinica visible en la pagina publica, que
-- el superadministrador configura sin programar (Pagina web > Informacion de
-- la clinica). Decisiones de Oriana: un solo WhatsApp para toda la clinica
-- (burbuja flotante en el landing) y las redes sociales (pie de pagina).
--
-- Es una tabla de UNA sola fila (id fijo en 1): no hay "varias clinicas".

CREATE TABLE IF NOT EXISTS informacion_clinica (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    -- Solo digitos, con indicativo de pais y sin "+": es el formato de wa.me.
    whatsapp_numero VARCHAR(15),
    whatsapp_activo BOOLEAN NOT NULL DEFAULT true,
    instagram_url VARCHAR(200),
    facebook_url VARCHAR(200),
    tiktok_url VARCHAR(200),
    youtube_url VARCHAR(200),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Numero de WhatsApp de la clinica entregado por Oriana.
INSERT INTO informacion_clinica (id, whatsapp_numero, whatsapp_activo)
VALUES (1, '573227621383', true)
ON CONFLICT (id) DO NOTHING;
