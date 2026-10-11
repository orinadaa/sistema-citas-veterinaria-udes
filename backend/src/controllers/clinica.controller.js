// controllers/clinica.controller.js
// RF-23: informacion general de la clinica (/api/clinica). La lee cualquier
// visitante (burbuja de WhatsApp y redes del pie de pagina) y la cambia solo
// el superadministrador, desde Pagina web > Informacion de la clinica.
const { pool } = require('../config/db');

const CAMPOS = 'whatsapp_numero, whatsapp_activo, instagram_url, facebook_url, tiktok_url, youtube_url';
// Cada red solo acepta enlaces de su propio sitio: asi el pie de pagina
// nunca termina enlazando a otro lugar por un error o por mala intencion.
const REDES = {
  instagramUrl: { columna: 'instagram_url', nombre: 'Instagram', dominios: ['instagram.com'] },
  facebookUrl: { columna: 'facebook_url', nombre: 'Facebook', dominios: ['facebook.com', 'fb.com'] },
  tiktokUrl: { columna: 'tiktok_url', nombre: 'TikTok', dominios: ['tiktok.com'] },
  youtubeUrl: { columna: 'youtube_url', nombre: 'YouTube', dominios: ['youtube.com', 'youtu.be'] },
};

function publico(fila) {
  return {
    // Con la burbuja apagada el numero no se publica.
    whatsappNumero: fila.whatsapp_activo ? fila.whatsapp_numero : null,
    instagramUrl: fila.instagram_url,
    facebookUrl: fila.facebook_url,
    tiktokUrl: fila.tiktok_url,
    youtubeUrl: fila.youtube_url,
  };
}

async function leer() {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM informacion_clinica WHERE id = 1`);
  return resultado.rows[0] || { whatsapp_numero: null, whatsapp_activo: false, instagram_url: null, facebook_url: null, tiktok_url: null, youtube_url: null };
}

// Deja solo los digitos. Un numero colombiano de 10 digitos (celular) recibe
// el indicativo 57. Devuelve null si no parece un telefono.
function normalizarWhatsapp(valor) {
  let digitos = String(valor).replace(/\D/g, '');
  if (digitos.length === 10 && digitos.startsWith('3')) digitos = `57${digitos}`;
  return digitos.length >= 10 && digitos.length <= 15 ? digitos : null;
}

// Devuelve la URL limpia (siempre https), '' para borrar, o null si no sirve.
function normalizarRed(valor, dominios) {
  const texto = String(valor ?? '').trim();
  if (!texto) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    if (!dominios.some((dominio) => host === dominio || host.endsWith(`.${dominio}`))) return null;
    url.protocol = 'https:';
    return url.toString().slice(0, 200);
  } catch {
    return null;
  }
}

// GET /api/clinica — publico
async function obtenerPublica(req, res, next) {
  try {
    return res.status(200).json({ clinica: publico(await leer()) });
  } catch (error) {
    next(error);
  }
}

// GET /api/clinica/admin — todo, tambien el numero aunque la burbuja este apagada
async function obtenerAdmin(req, res, next) {
  try {
    const fila = await leer();
    return res.status(200).json({ clinica: { ...publico({ ...fila, whatsapp_activo: true }), whatsappActivo: fila.whatsapp_activo } });
  } catch (error) {
    next(error);
  }
}

// PUT /api/clinica — solo superadministrador. Actualizacion parcial.
async function actualizar(req, res, next) {
  try {
    const cambios = {};
    if (req.body.whatsappNumero !== undefined) {
      const texto = String(req.body.whatsappNumero ?? '').trim();
      if (!texto) cambios.whatsapp_numero = null;
      else {
        const numero = normalizarWhatsapp(texto);
        if (!numero) return res.status(400).json({ mensaje: 'Escribe el número de WhatsApp con su indicativo, por ejemplo +57 322 762 1383.' });
        cambios.whatsapp_numero = numero;
      }
    }
    if (req.body.whatsappActivo !== undefined) {
      if (typeof req.body.whatsappActivo !== 'boolean') return res.status(400).json({ mensaje: 'El estado de la burbuja debe ser verdadero o falso.' });
      cambios.whatsapp_activo = req.body.whatsappActivo;
    }
    for (const [clave, red] of Object.entries(REDES)) {
      if (req.body[clave] === undefined) continue;
      const url = normalizarRed(req.body[clave], red.dominios);
      if (url === null) return res.status(400).json({ mensaje: `El enlace de ${red.nombre} debe ser una dirección de ${red.dominios[0]}.` });
      cambios[red.columna] = url || null;
    }
    const columnas = Object.keys(cambios);
    if (columnas.length === 0) return res.status(400).json({ mensaje: 'Indica al menos un dato para actualizar.' });

    const actual = await leer();
    const final = { ...actual, ...cambios };
    if (final.whatsapp_activo && !final.whatsapp_numero) {
      return res.status(400).json({ mensaje: 'Para mostrar la burbuja de WhatsApp hace falta un número.' });
    }
    // Las columnas salen de una lista fija (nunca de lo que escribe la persona).
    await pool.query(
      `INSERT INTO informacion_clinica (id, ${columnas.join(', ')}) VALUES (1, ${columnas.map((_, i) => `$${i + 1}`).join(', ')})
       ON CONFLICT (id) DO UPDATE SET ${columnas.map((c, i) => `${c} = $${i + 1}`).join(', ')}, actualizado_en = NOW()`,
      columnas.map((c) => cambios[c])
    );
    const fila = await leer();
    return res.status(200).json({ clinica: { ...publico({ ...fila, whatsapp_activo: true }), whatsappActivo: fila.whatsapp_activo } });
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerPublica, obtenerAdmin, actualizar, normalizarWhatsapp, normalizarRed };
