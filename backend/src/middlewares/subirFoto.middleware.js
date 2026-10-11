// middlewares/subirFoto.middleware.js
// Recepcion de fotos (multipart/form-data, campo "foto") con multer.
// El archivo se guarda en disco, en backend/uploads/<subcarpeta>/, con
// un nombre aleatorio (nunca el nombre original que manda el
// navegador), y la base de datos solo guarda la ruta publica -- el
// mismo patron que un sistema real con almacenamiento de archivos,
// adaptado a una entrega local. Se usa para fotos de mascotas, la foto
// de perfil del medico (la sube el o el administrador), la foto de cada
// sede, la galeria del inicio y la foto de cada servicio.
const path = require('path');
const crypto = require('crypto');
const fs = require('fs/promises');
const multer = require('multer');

const CARPETA_UPLOADS = path.join(__dirname, '..', '..', 'uploads');
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB
const TIPOS_PERMITIDOS = { 'image/jpeg': '.jpg', 'image/png': '.png' };

// Firma del archivo: JPG empieza por FF D8 FF; PNG por 89 50 4E 47 0D 0A 1A 0A.
const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
async function esImagenReal(ruta) {
  let archivo;
  try {
    archivo = await fs.open(ruta, 'r');
    const { buffer, bytesRead } = await archivo.read(Buffer.alloc(8), 0, 8, 0);
    if (bytesRead < 8) return false;
    const esJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    return esJpg || buffer.equals(FIRMA_PNG);
  } catch {
    return false;
  } finally {
    await archivo?.close();
  }
}

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
    receptor(req, res, async (error) => {
      if (!error) {
        // El tipo que declara el navegador se puede falsear: se leen los
        // primeros bytes y, si no son de un JPG o PNG real, se descarta.
        if (req.file && !(await esImagenReal(req.file.path))) {
          await fs.unlink(req.file.path).catch(() => {});
          return res.status(400).json({ mensaje: 'El archivo no es una imagen JPG o PNG válida.' });
        }
        return next();
      }
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
const fotosSedes = crearReceptorFoto('sedes');
const fotosGaleria = crearReceptorFoto('galeria');
const fotosServicios = crearReceptorFoto('servicios');

module.exports = {
  subirFotoMascota: fotosMascotas.middleware,
  CARPETA_FOTOS_MASCOTAS: fotosMascotas.carpeta,
  RUTA_PUBLICA_FOTOS_MASCOTAS: fotosMascotas.rutaPublica,
  fotosUsuarios,
  fotosSedes,
  fotosGaleria,
  fotosServicios,
};
