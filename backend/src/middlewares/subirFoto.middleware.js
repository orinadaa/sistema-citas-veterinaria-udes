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

// `opciones` permite reutilizar el receptor para otros archivos (ver
// `adjuntos`, abajo): tipos aceptados (mime -> extension), nombre del
// campo del formulario y mensaje si el tipo no sirve.
function crearReceptorFoto(subcarpeta, opciones = {}) {
  const tipos = opciones.tipos || TIPOS_PERMITIDOS;
  const campo = opciones.campo || 'foto';
  const mensajeTipo = opciones.mensajeTipo || 'La foto debe ser JPG o PNG.';
  const mensajePeso = opciones.mensajePeso || 'La foto no puede pesar más de 5 MB.';
  const carpeta = path.join(CARPETA_UPLOADS, subcarpeta);
  const rutaPublica = `/uploads/${subcarpeta}`;

  const receptor = multer({
    storage: multer.diskStorage({
      destination: carpeta,
      filename: (req, archivo, cb) => cb(null, `${crypto.randomUUID()}${tipos[archivo.mimetype]}`),
    }),
    limits: { fileSize: TAMANO_MAXIMO_BYTES, files: 1 },
    fileFilter: (req, archivo, cb) => {
      if (!tipos[archivo.mimetype]) {
        return cb(Object.assign(new Error(mensajeTipo), { status: 400 }));
      }
      return cb(null, true);
    },
  }).single(campo);

  // Envuelve multer para responder 400 con un mensaje claro en vez de
  // dejar que sus errores lleguen como 500 al errorHandler generico.
  function middleware(req, res, next) {
    receptor(req, res, (error) => {
      if (!error) return next();
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ mensaje: mensajePeso });
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
// Adjuntos de los campos personalizados de tipo archivo (ej. certificado
// de vacunacion): PDF o imagen, en el campo "archivo".
const adjuntos = crearReceptorFoto('adjuntos', {
  tipos: { ...TIPOS_PERMITIDOS, 'application/pdf': '.pdf' },
  campo: 'archivo',
  mensajeTipo: 'El archivo debe ser PDF, JPG o PNG.',
  mensajePeso: 'El archivo no puede pesar más de 5 MB.',
});

module.exports = {
  subirFotoMascota: fotosMascotas.middleware,
  CARPETA_FOTOS_MASCOTAS: fotosMascotas.carpeta,
  RUTA_PUBLICA_FOTOS_MASCOTAS: fotosMascotas.rutaPublica,
  fotosUsuarios,
  fotosSedes,
  fotosGaleria,
  fotosServicios,
  adjuntos,
};
