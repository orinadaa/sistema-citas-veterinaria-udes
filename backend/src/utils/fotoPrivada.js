// utils/fotoPrivada.js
// Enlaces temporales para las fotos de mascotas. La carpeta no se publica:
// cada foto se abre solo con un enlace firmado que vence a las pocas horas.
const crypto = require('crypto');

const RUTA_PRIVADA = '/uploads/mascotas/';
const HORAS_DE_VALIDEZ = 12;
const HORA_MS = 60 * 60 * 1000;

function firmaDe(ruta, vence) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${ruta}|${vence}`).digest('hex').slice(0, 32);
}

// El vencimiento se redondea a la hora: dentro de una misma hora el enlace no
// cambia y el navegador puede reutilizar la imagen que ya descargo.
function firmar(ruta, ahora = Date.now()) {
  const vence = Math.ceil(ahora / HORA_MS) * HORA_MS + HORAS_DE_VALIDEZ * HORA_MS;
  return `${ruta}?e=${vence}&f=${firmaDe(ruta, vence)}`;
}

function esValida(ruta, vence, firma, ahora = Date.now()) {
  const limite = Number(vence);
  if (!Number.isFinite(limite) || limite < ahora || typeof firma !== 'string') return false;
  const esperada = firmaDe(ruta, limite);
  return firma.length === esperada.length && crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada));
}

// Recorre una respuesta JSON y firma las rutas de fotos privadas que encuentre.
function firmarEnDatos(valor, nivel = 0) {
  if (typeof valor === 'string') {
    return valor.startsWith(RUTA_PRIVADA) && !valor.includes('?') ? firmar(valor) : valor;
  }
  if (nivel > 8 || valor === null || typeof valor !== 'object') return valor;
  if (Array.isArray(valor)) return valor.map((elemento) => firmarEnDatos(elemento, nivel + 1));
  if (Object.getPrototypeOf(valor) !== Object.prototype) return valor;
  const copia = {};
  for (const clave of Object.keys(valor)) copia[clave] = firmarEnDatos(valor[clave], nivel + 1);
  return copia;
}

// Middleware: toda respuesta JSON de la API sale con las fotos privadas firmadas.
function firmarFotosEnRespuestas(req, res, next) {
  const enviar = res.json.bind(res);
  res.json = (cuerpo) => enviar(firmarEnDatos(cuerpo));
  next();
}

// Middleware de /uploads/mascotas: sin un enlace firmado y vigente no se entrega la foto.
function exigirEnlaceFirmado(req, res, next) {
  const ruta = `${RUTA_PRIVADA.slice(0, -1)}${req.path}`;
  if (!esValida(ruta, req.query.e, req.query.f)) {
    return res.status(403).json({ mensaje: 'Este enlace no es válido o ya venció.' });
  }
  res.setHeader('Cache-Control', 'private, max-age=3600');
  next();
}

module.exports = { RUTA_PRIVADA, firmar, esValida, firmarEnDatos, firmarFotosEnRespuestas, exigirEnlaceFirmado };
