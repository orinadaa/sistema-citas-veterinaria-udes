// routes/logo.routes.js
// Logotipos de la clinica: leerlos es publico (los usa toda la pagina);
// cambiarlos, solo el superadministrador, y queda en la bitacora.
const express = require('express');
const { listar, subir, restaurar } = require('../controllers/logo.controller');
const { archivosLogos } = require('../middlewares/subirFoto.middleware');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();
const soloSuper = [verificarToken, verificarRol('superadministrador')];

// GET /api/logos — publico
router.get('/', listar);

// POST /api/logos/:clave — multipart, campo "foto" (PNG, WebP o JPG)
router.post('/:clave', soloSuper, auditar('Cambiar logotipo', 'logo'), archivosLogos.middleware, subir);

// DELETE /api/logos/:clave — vuelve al logotipo original
router.delete('/:clave', soloSuper, auditar('Restaurar logotipo original', 'logo'), restaurar);

module.exports = router;
