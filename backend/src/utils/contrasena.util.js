// utils/contrasena.util.js
// Generacion de credenciales temporales: contraseñas para cuentas creadas
// por un administrador (RF-10/RF-19) y codigos de recuperacion de clave.
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

module.exports = { generarContrasenaTemporal, generarCodigoRecuperacion };
