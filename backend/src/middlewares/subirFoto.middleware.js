// middlewares/subirFoto.middleware.js
// Recepcion de fotos (multipart/form-data, campo "foto") con multer.
// El archivo se guarda en disco, en backend/uploads/<subcarpeta>/, con
// un nombre aleatorio (nunca el nombre original que manda el
// navegador), y la base de datos solo guarda la ruta publica -- el
// mismo patron que un sistema real con almacenamiento de archivos,
// adaptado a una entrega local. Se usa para fotos de mascotas y para la
// foto de perfil del medico.
const path = require('path');
const crypto = require('crypto');
const fs = require('fs/promises');
const multer = require('multer');

const CARPETA_UPLOADS = path.join(__dirname, '..', '..', 'uploads');
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB
const TIPOS_PERMITIDOS = { 'image/jpeg': '.jpg', 'image/png': '.png' };

function crearReceptorFoto(subcarpeta) {
  const carpeta = path.join(CARPETA_UPLOADS, subcarpeta);
  const rutaPublica = `/uploads/${subcarpeta}`;

  const receptor = multer({
    storage: multer.diskStorage({
      destination: carpeta,
      filename: (req, archivo, cb) => cb(null, `${crypto.randomUUID()}${TIPOS_PERMITIDOS[archivo.mimetype]}`),
    }),
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
  function middleware(req, res, next) {
    receptor(req, res, (error) => {
      if (!error) return next();
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ mensaje: 'La foto no puede pesar más de 5 MB.' });
      }
      return res.status(error.status || 400).json({ mensaje: error.message || 'No se pudo recibir la foto.' });
    });
  }

  // Borra del disco una foto de esta carpeta (nunca una URL externa
  // escrita a mano). Si falla, no interrumpe: un archivo huerfano no
  // afecta al sistema.
  async function borrar(fotoUrl) {
    if (!fotoUrl || !fotoUrl.startsWith(`${rutaPublica}/`)) return;
    await fs
      .unlink(path.join(carpeta, path.basename(fotoUrl)))
      .catch((error) => console.error('No se pudo borrar la foto anterior:', error.message));
  }

  return { middleware, carpeta, rutaPublica, borrar };
}

const fotosMascotas = crearReceptorFoto('mascotas');
const fotosUsuarios = crearReceptorFoto('usuarios');

module.exports = {
  subirFotoMascota: fotosMascotas.middleware,
  CARPETA_FOTOS_MASCOTAS: fotosMascotas.carpeta,
  RUTA_PUBLICA_FOTOS_MASCOTAS: fotosMascotas.rutaPublica,
  fotosUsuarios,
};
