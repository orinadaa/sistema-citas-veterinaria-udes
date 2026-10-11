// routes/auth.routes.js
const express = require('express');
const { registrar, iniciarSesion, olvideClave, restablecerClave, establecerPrimeraClave } = require('../controllers/auth.controller');
const { verificarToken, verificarTokenClaveTemporal } = require('../middlewares/auth.middleware');
const { obtenerPerfilPropio } = require('../controllers/usuario.controller');

const { limitarIntentos } = require('../middlewares/seguridad.middleware');

const router = express.Router();

// Topes por direccion IP (fuerza bruta, registro masivo, abuso de codigos).
const limiteLogin = limitarIntentos({ ventanaMinutos: 15, maximo: 20, mensaje: 'Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.' });
const limiteRegistro = limitarIntentos({ ventanaMinutos: 60, maximo: 10, mensaje: 'Se crearon demasiadas cuentas desde esta conexión. Inténtalo más tarde.' });
const limiteCodigos = limitarIntentos({ ventanaMinutos: 15, maximo: 10 });

// POST /api/auth/registro
router.post('/registro', limiteRegistro, registrar);

// POST /api/auth/login
router.post('/login', limiteLogin, iniciarSesion);

// POST /api/auth/olvide-clave — cualquier rol
router.post('/olvide-clave', limiteCodigos, olvideClave);

// POST /api/auth/restablecer-clave — cualquier rol
router.post('/restablecer-clave', limiteCodigos, restablecerClave);

// GET /api/auth/perfil — cualquier usuario autenticado consulta su propia sesion
router.get('/perfil', verificarToken, obtenerPerfilPropio);

// POST /api/auth/primera-clave — la cuenta con clave temporal establece la suya
router.post('/primera-clave', verificarTokenClaveTemporal, establecerPrimeraClave);

module.exports = router;
