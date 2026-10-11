// middlewares/auth.middleware.js
// RF-05 / RNF-04: proteger rutas segun autenticacion y rol.

const jwt = require('jsonwebtoken');
const { estadoDeCuenta } = require('../utils/estadoCuenta');
const bitacoraModel = require('../models/bitacora.model');

// En las pruebas automaticas (modelos simulados) no se consulta la base,
// salvo las de esta regla.
const consultaLaBase = () => process.env.NODE_ENV !== 'test' || Boolean(process.env.VERIFICAR_ACTIVO_EN_PRUEBAS);

// Verifica que la peticion traiga un token JWT valido y adjunta el usuario
// decodificado a req.usuario para que las rutas siguientes lo usen.
//
// Un token con la marca cambiarClave pertenece a una cuenta que entro con
// la clave temporal que le genero el sistema: no sirve para nada hasta que
// la persona establezca su propia contraseña (POST /auth/primera-clave, que
// usa verificarTokenClaveTemporal). La regla vive aqui, en el unico punto
// por donde pasan todas las rutas protegidas.
function leerToken(req, res) {
  const encabezado = req.headers.authorization;

  if (!encabezado || !encabezado.startsWith('Bearer ')) {
    res.status(401).json({ mensaje: 'Token no proporcionado.' });
    return null;
  }

  const token = encabezado.split(' ')[1];

  try {
    // algorithms: solo se acepta el algoritmo con que firma el sistema.
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }); // { id, rol, sedeId, cambiarClave?, iat }
  } catch (error) {
    res.status(401).json({ mensaje: 'Tu sesión venció. Inicia sesión de nuevo.' });
    return null;
  }
}

const MENSAJE_SESION_TERMINADA = 'Tu sesión ya no es válida. Inicia sesión de nuevo.';

// Deja en req.usuario la cuenta con su rol y sede VIGENTES (los de la base,
// no los del token). Responde 401 y devuelve false si la cuenta ya no
// existe, esta inactiva o el token es anterior al ultimo cambio de contraseña.
async function cargarUsuario(req, res, payload) {
  if (!consultaLaBase()) {
    req.usuario = payload;
    return true;
  }
  const estado = await estadoDeCuenta(payload.id);
  const tokenAnteriorAlCambioDeClave = estado && payload.iat && payload.iat < estado.sesionesDesde;
  if (!estado || !estado.activo || tokenAnteriorAlCambioDeClave) {
    res.status(401).json({ mensaje: MENSAJE_SESION_TERMINADA, codigo: 'SESION_TERMINADA' });
    return false;
  }
  req.usuario = { ...payload, rol: estado.rol, sedeId: estado.sedeId };
  return true;
}

async function verificarToken(req, res, next) {
  const payload = leerToken(req, res);
  if (!payload) return undefined;
  if (payload.cambiarClave) {
    return res.status(403).json({
      mensaje: 'Antes de continuar debes crear tu propia contraseña.',
      codigo: 'CAMBIO_CLAVE_OBLIGATORIO',
    });
  }
  try {
    if (!(await cargarUsuario(req, res, payload))) return undefined;
  } catch (error) {
    return next(error);
  }
  return next();
}

// Solo para la ruta donde se establece la contraseña propia: acepta tambien
// el token de una cuenta con clave temporal.
async function verificarTokenClaveTemporal(req, res, next) {
  const payload = leerToken(req, res);
  if (!payload) return undefined;
  try {
    if (!(await cargarUsuario(req, res, payload))) return undefined;
  } catch (error) {
    return next(error);
  }
  return next();
}

// Restringe el acceso a los roles indicados. Debe usarse despues de
// verificarToken. Ejemplo: verificarRol('administrador', 'veterinario').
function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      // Queda registro del intento (no en las pruebas automaticas).
      if (req.usuario && process.env.NODE_ENV !== 'test') {
        bitacoraModel
          .registrar({
            usuarioId: req.usuario.id,
            usuarioRol: req.usuario.rol,
            accion: 'Acceso denegado',
            entidad: 'seguridad',
            entidadId: null,
            detalle: `${req.method} ${req.originalUrl.split('?')[0]}`.slice(0, 300),
          })
          .catch((error) => console.error('No se pudo escribir en la bitácora:', error.message));
      }
      return res.status(403).json({ mensaje: 'No tiene permisos para acceder a este recurso.' });
    }
    next();
  };
}

module.exports = { verificarToken, verificarTokenClaveTemporal, verificarRol };
