// routes/auth.routes.js
const express = require('express');
const { registrar, iniciarSesion, olvideClave, restablecerClave } = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { obtenerPerfilPropio } = require('../controllers/usuario.controller');

const router = express.Router();

// POST /api/auth/registro
router.post('/registro', registrar);

// POST /api/auth/login
router.post('/login', iniciarSesion);

// POST /api/auth/olvide-clave — cualquier rol
router.post('/olvide-clave', olvideClave);

// POST /api/auth/restablecer-clave — cualquier rol
router.post('/restablecer-clave', restablecerClave);

// GET /api/auth/perfil — cualquier usuario autenticado consulta su propia sesion
router.get('/perfil', verificarToken, obtenerPerfilPropio);

module.exports = router;
