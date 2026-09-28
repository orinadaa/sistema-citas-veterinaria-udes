// middlewares/subirFoto.middleware.js
// Recepcion de la foto de una mascota (multipart/form-data, campo
// "foto") con multer. El archivo se guarda en disco, en
// backend/uploads/mascotas/, con un nombre aleatorio (nunca el nombre
// original que manda el navegador), y la base de datos solo guarda la
// ruta publica -- el mismo patron que un sistema real con
// almacenamiento de archivos, adaptado a una entrega local.
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const CARPETA_FOTOS_MASCOTAS = path.join(__dirname, '..', '..', 'uploads', 'mascotas');
const RUTA_PUBLICA_FOTOS_MASCOTAS = '/uploads/mascotas';
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB
const TIPOS_PERMITIDOS = { 'image/jpeg': '.jpg', 'image/png': '.png' };

const almacenamiento = multer.diskStorage({
  destination: CARPETA_FOTOS_MASCOTAS,
  filename: (req, archivo, cb) => cb(null, `${crypto.randomUUID()}${TIPOS_PERMITIDOS[archivo.mimetype]}`),
});

const receptor = multer({
  storage: almacenamiento,
  limits: { fileSize: TAMANO_MAXIMO_BYTES, files: 1 },
  fileFilter: (req, archivo, cb) => {
    if (!TIPOS_PERMITIDOS[archivo.mimetype]) {
      return cb(Object.assign(new Error('La foto debe ser JPG o PNG.'), { status: 400 }));
    }
    return cb(null, true);
  },
}).single('foto');

// Envuelve multer para responder 400 con un mensaje claro en vez de
// dejar que sus errores lleguen como 500 al errorHandler generico.
function subirFotoMascota(req, res, next) {
  receptor(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ mensaje: 'La foto no puede pesar más de 5 MB.' });
    }
    return res.status(error.status || 400).json({ mensaje: error.message || 'No se pudo recibir la foto.' });
  });
}

module.exports = { subirFotoMascota, CARPETA_FOTOS_MASCOTAS, RUTA_PUBLICA_FOTOS_MASCOTAS };
