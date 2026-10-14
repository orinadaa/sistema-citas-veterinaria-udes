// routes/auth.routes.js
const express = require('express');
const {
  registrar,
  verificarRegistro,
  reenviarCodigoRegistro,
  iniciarSesion,
  olvideClave,
  restablecerClave,
  establecerPrimeraClave,
} = require('../controllers/auth.controller');
const { verificarToken, verificarTokenClaveTemporal } = require('../middlewares/auth.middleware');
const { obtenerPerfilPropio } = require('../controllers/usuario.controller');

const { limitarIntentos } = require('../middlewares/seguridad.middleware');

const router = express.Router();

// Topes por direccion IP (fuerza bruta, registro masivo, abuso de codigos).
const limiteLogin = limitarIntentos({ ventanaMinutos: 15, maximo: 20, mensaje: 'Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.' });
// Por cuenta, venga de la IP que venga: frena probar muchas contraseñas
// contra un mismo correo desde varias conexiones.
const limiteLoginPorCuenta = limitarIntentos({
  ventanaMinutos: 15,
  maximo: 10,
  clave: (req) => (req.body?.correo ? `cuenta:${String(req.body.correo).trim().toLowerCase().slice(0, 150)}` : null),
  mensaje: 'Demasiados intentos con esta cuenta. Espera unos minutos o usa "¿Olvidaste tu contraseña?".',
});
const limiteRegistro = limitarIntentos({ ventanaMinutos: 60, maximo: 10, mensaje: 'Se crearon demasiadas cuentas desde esta conexión. Inténtalo más tarde.' });
const limiteCodigos = limitarIntentos({ ventanaMinutos: 15, maximo: 10 });
// Por destinatario y por dia, venga de la IP que venga: nadie puede usar el
// sistema para llenar de correos el buzon de otra persona.
const porDestinatario = (prefijo) => (req) => (req.body?.correo ? `${prefijo}:${String(req.body.correo).trim().toLowerCase().slice(0, 150)}` : null);
const MENSAJE_TOPE_CORREOS = 'Ya se enviaron varios correos a esa dirección hoy. Revisa tu bandeja y el correo no deseado, o inténtalo mañana.';
const limiteCorreosDeRegistro = limitarIntentos({ ventanaMinutos: 24 * 60, maximo: 6, clave: porDestinatario('registro'), mensaje: MENSAJE_TOPE_CORREOS });
const limiteCorreosDeRecuperacion = limitarIntentos({ ventanaMinutos: 24 * 60, maximo: 5, clave: porDestinatario('recuperacion'), mensaje: MENSAJE_TOPE_CORREOS });

router.post('/registro', limiteRegistro, limiteCorreosDeRegistro, registrar);

router.post('/registro/verificar', limiteCodigos, verificarRegistro);

router.post('/registro/reenviar', limiteCodigos, limiteCorreosDeRegistro, reenviarCodigoRegistro);

router.post('/login', limiteLogin, limiteLoginPorCuenta, iniciarSesion);

router.post('/olvide-clave', limiteCodigos, limiteCorreosDeRecuperacion, olvideClave);

router.post('/restablecer-clave', limiteCodigos, restablecerClave);

router.get('/perfil', verificarToken, obtenerPerfilPropio);

router.post('/primera-clave', verificarTokenClaveTemporal, establecerPrimeraClave);

module.exports = router;
