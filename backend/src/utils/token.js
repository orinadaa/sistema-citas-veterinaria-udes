// utils/token.js
// Emision del token de sesion (JWT). Un solo lugar: lo usan el inicio de
// sesion y los cambios de contraseña, que entregan un token nuevo porque los
// anteriores dejan de servir (ver utils/estadoCuenta.js).
const jwt = require('jsonwebtoken');

function generarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      rol: usuario.rol,
      sedeId: usuario.sede_id || null,
      // Con clave temporal el token solo sirve para establecer la propia
      // (ver auth.middleware.js).
      ...(usuario.debe_cambiar_contrasena ? { cambiarClave: true } : {}),
    },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRACION || '8h' }
  );
}

module.exports = { generarToken };
