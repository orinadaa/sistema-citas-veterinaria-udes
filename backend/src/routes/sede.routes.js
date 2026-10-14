// routes/sede.routes.js
// Lectura publica (RF-03); creacion/edicion exclusiva del administrador.
const express = require('express');
const { listar, listarAdmin, crear, actualizar, subirFoto } = require('../controllers/sede.controller');
const { fotosSedes } = require('../middlewares/subirFoto.middleware');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();

router.get('/', listar);

router.get('/admin', verificarToken, verificarRol('superadministrador', 'administrador'), listarAdmin);

router.post('/', verificarToken, verificarRol('superadministrador'), auditar('Crear sede', 'sede'), crear);

router.put('/:id', verificarToken, verificarRol('superadministrador'), auditar('Editar sede', 'sede'), actualizar);

router.post('/:id/foto', verificarToken, verificarRol('superadministrador'), auditar('Cambiar foto de sede', 'sede'), fotosSedes.middleware, subirFoto);

module.exports = router;
