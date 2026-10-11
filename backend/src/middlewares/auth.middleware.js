// middlewares/auth.middleware.js
// RF-05 / RNF-04: proteger rutas segun autenticacion y rol.

const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Una cuenta desactivada (o que ya no existe) pierde el acceso aunque su
// token siga vigente: antes podia seguir usando el sistema hasta 8 horas.
// Se consulta la base y se recuerda la respuesta 30 segundos para no
// preguntar en cada peticion. En las pruebas automaticas (modelos simulados)
// no se consulta, salvo las de esta regla.
const SEGUNDOS_CACHE_ACTIVO = 30;
const cuentasActivas = new Map(); // id -> { activo, vence }

async function cuentaActiva(id) {
  if (process.env.NODE_ENV === 'test' && !process.env.VERIFICAR_ACTIVO_EN_PRUEBAS) return true;
  const ahora = Date.now();
  const recordado = cuentasActivas.get(id);
  if (recordado && recordado.vence > ahora) return recordado.activo;
  const resultado = await pool.query('SELECT activo FROM usuario WHERE id::text = $1', [String(id)]);
  const activo = Boolean(resultado.rows[0]?.activo);
  if (cuentasActivas.size > 5000) cuentasActivas.clear();
  cuentasActivas.set(id, { activo, vence: ahora + SEGUNDOS_CACHE_ACTIVO * 1000 });
  return activo;
}

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
    // algorithms: solo se acepta el algoritmo con que firma el sistema.
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }); // { id, rol, sedeId, cambiarClave? }
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido o expirado.' });
    return null;
  }
}

const MENSAJE_SESION_TERMINADA = 'Tu sesión ya no es válida. Inicia sesión de nuevo.';

async function verificarToken(req, res, next) {
  const payload = leerToken(req, res);
  if (!payload) return undefined;
  if (payload.cambiarClave) {
    return res.status(403).json({
      mensaje: 'Antes de continuar debes establecer tu propia contraseña.',
      codigo: 'CAMBIO_CLAVE_OBLIGATORIO',
    });
  }
  try {
    if (!(await cuentaActiva(payload.id))) {
      return res.status(401).json({ mensaje: MENSAJE_SESION_TERMINADA, codigo: 'SESION_TERMINADA' });
    }
  } catch (error) {
    return next(error);
  }
  req.usuario = payload;
  return next();
}

// Solo para la ruta donde se establece la contraseña propia: acepta tambien
// el token de una cuenta con clave temporal.
async function verificarTokenClaveTemporal(req, res, next) {
  const payload = leerToken(req, res);
  if (!payload) return undefined;
  try {
    if (!(await cuentaActiva(payload.id))) {
      return res.status(401).json({ mensaje: MENSAJE_SESION_TERMINADA, codigo: 'SESION_TERMINADA' });
    }
  } catch (error) {
    return next(error);
  }
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
