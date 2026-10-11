// utils/contrasena.util.js
// Generacion de credenciales temporales: contraseñas para cuentas creadas
// por un administrador (RF-10/RF-19) y codigos de recuperacion de clave.
// Tambien la regla de que contraseña se acepta.
const crypto = require('crypto');

const CARACTERES_CONTRASENA = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

// String aleatorio de 12 caracteres (letras+numeros, sin ambiguos como 0/O
// o 1/l/I) que cumple la regla existente de minimo 8 caracteres.
function generarContrasenaTemporal() {
  let contrasena = '';
  for (let i = 0; i < 12; i += 1) {
    const indice = crypto.randomInt(CARACTERES_CONTRASENA.length);
    contrasena += CARACTERES_CONTRASENA[indice];
  }
  return contrasena;
}

// Codigo numerico de 6 digitos para el flujo de "olvide mi contraseña".
function generarCodigoRecuperacion() {
  return String(crypto.randomInt(100000, 1000000));
}

// Las que mas se prueban en un ataque de diccionario. Se comparan en minusculas.
const CONTRASENAS_COMUNES = new Set([
  '12345678', '123456789', '1234567890', '87654321', '11111111', '00000000', '12341234', '11223344',
  'password', 'password1', 'contraseña', 'contrasena', 'qwertyui', 'qwerty123', 'qwertyuiop', 'abcd1234',
  'abc12345', 'iloveyou', 'colombia', 'veterinaria', 'mascota123', 'asdfghjk', '1q2w3e4r', 'admin123', 'administrador',
]);

// Devuelve el mensaje del problema o null si la contraseña sirve.
// - Minimo 8 caracteres; maximo 72 bytes (bcrypt ignora lo que pase de ahi).
// - No puede ser de las mas comunes, un solo caracter repetido ni el correo.
function errorContrasena(contrasena, correo) {
  const clave = String(contrasena ?? '');
  if (clave.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (Buffer.byteLength(clave, 'utf8') > 72) return 'La contraseña no puede superar los 72 caracteres.';
  const minusculas = clave.toLowerCase();
  if (CONTRASENAS_COMUNES.has(minusculas) || /^(.)\1+$/.test(clave)) {
    return 'Esa contraseña es muy fácil de adivinar. Elige otra, por ejemplo una frase corta.';
  }
  if (correo && (minusculas === String(correo).toLowerCase() || minusculas === String(correo).toLowerCase().split('@')[0])) {
    return 'La contraseña no puede ser tu correo.';
  }
  return null;
}

module.exports = { generarContrasenaTemporal, generarCodigoRecuperacion, errorContrasena };
