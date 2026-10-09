// middlewares/auth.middleware.js
// RF-05 / RNF-04: proteger rutas segun autenticacion y rol.

const jwt = require('jsonwebtoken');

// Verifica que la peticion traiga un token JWT valido y adjunta el usuario
// decodificado a req.usuario para que las rutas siguientes lo usen.
//
// Clave temporal: si la cuenta todavia tiene la contraseña que le genero el
// sistema, su token lleva cambiarClave = true y NO sirve para nada mas que
// establecer la contraseña propia (verificarTokenClaveTemporal). Asi la
// obligacion no depende de la pantalla: el servidor la impone.
function leerToken(req, res) {
  const encabezado = req.headers.authorization;

  if (!encabezado || !encabezado.startsWith('Bearer ')) {
    res.status(401).json({ mensaje: 'No se proporcionó un token de autenticación.' });
    return null;
  }

  const token = encabezado.split(' ')[1];

  try {
    return jwt.verify(token, process.env.JWT_SECRET); // { id, rol, sedeId, cambiarClave? }
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido o expirado.' });
    return null;
  }
}

function verificarToken(req, res, next) {
  const payload = leerToken(req, res);
  if (!payload) return undefined;
  if (payload.cambiarClave) {
    return res.status(403).json({
      mensaje: 'Antes de continuar debes establecer tu propia contraseña.',
      codigo: 'CAMBIO_CLAVE_OBLIGATORIO',
    });
  }
  req.usuario = payload;
  return next();
}

// Solo para la ruta donde se establece la contraseña propia: acepta tambien
// el token de una cuenta con clave temporal.
function verificarTokenClaveTemporal(req, res, next) {
  const payload = leerToken(req, res);
  if (!payload) return undefined;
  req.usuario = payload;
  return next();
}

// Debe usarse siempre despues de verificarToken.
// Ejemplo: router.post('/', verificarToken, verificarRol('administrador'), crear)
function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tiene permisos para acceder a este recurso.' });
    }
    next();
  };
}

module.exports = { verificarToken, verificarTokenClaveTemporal, verificarRol };
