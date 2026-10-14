// middlewares/bitacora.middleware.js
// Deja registro en la bitacora de las acciones que cambian la configuracion
// del sistema o corrigen datos: quien (req.usuario), que accion, sobre que
// registro y un resumen de lo que envio.
const bitacoraModel = require('../models/bitacora.model');

// Nunca se guardan: contraseñas, codigos y tokens.
const SENSIBLES = /contrasena|password|codigo|token/i;
const MAXIMO_DETALLE = 600;

function resumir(cuerpo) {
  if (!cuerpo || typeof cuerpo !== 'object') return null;
  const partes = Object.entries(cuerpo)
    .filter(([clave, valor]) => !SENSIBLES.test(clave) && valor !== undefined && valor !== '')
    .map(([clave, valor]) => `${clave}: ${typeof valor === 'object' && valor !== null ? JSON.stringify(valor) : valor}`);
  if (partes.length === 0) return null;
  const texto = partes.join(' · ');
  return texto.length > MAXIMO_DETALLE ? `${texto.slice(0, MAXIMO_DETALLE)}…` : texto;
}

function auditar(accion, entidad) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      // En las pruebas automaticas no se escribe (salvo las de la propia bitacora).
      if (process.env.NODE_ENV === 'test' && !process.env.BITACORA_EN_PRUEBAS) return;
      bitacoraModel
        .registrar({
          usuarioId: req.usuario?.id ?? null,
          usuarioRol: req.usuario?.rol ?? null,
          accion,
          entidad,
          // El registro afectado: el de la URL o, al crear, el que devolvio la accion.
          entidadId: req.params.id ?? res.locals.entidadId ?? null,
          detalle: resumir(req.body),
        })
        .catch((error) => console.error('No se pudo escribir en la bitácora:', error.message));
    });
    next();
  };
}

module.exports = { auditar, resumir };
