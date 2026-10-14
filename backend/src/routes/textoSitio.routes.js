// routes/textoSitio.routes.js
// Textos de marca de la pagina publica. Leerlos es publico; cambiarlos, solo
// el superadministrador, y queda en la bitacora.
const express = require('express');
const { obtenerPublicos, obtenerAdmin, actualizar } = require('../controllers/textoSitio.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();
const soloSuper = [verificarToken, verificarRol('superadministrador')];

router.get('/', obtenerPublicos);

router.get('/admin', soloSuper, obtenerAdmin);

router.put('/', soloSuper, auditar('Cambiar textos de la página pública', 'texto_sitio'), actualizar);

module.exports = router;
