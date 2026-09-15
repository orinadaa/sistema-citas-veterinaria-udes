// middlewares/auth.middleware.js
// RF-05 / RNF-04: proteger rutas segun autenticacion y rol.

const jwt = require('jsonwebtoken');

// Verifica que la peticion traiga un token JWT valido y adjunta el usuario
// decodificado a req.usuario para que las rutas siguientes lo usen.
function verificarToken(req, res, next) {
  const encabezado = req.headers.authorization;

  if (!encabezado || !encabezado.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'No se proporcionó un token de autenticación.' });
  }

  const token = encabezado.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, rol, sedeId }
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
  }
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

module.exports = { verificarToken, verificarRol };
