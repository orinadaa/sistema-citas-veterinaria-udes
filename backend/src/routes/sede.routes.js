// routes/sede.routes.js
// Lectura publica (RF-03); creacion/edicion exclusiva del administrador.
const express = require('express');
const { listar, listarAdmin, crear, actualizar, subirFoto } = require('../controllers/sede.controller');
const { fotosSedes } = require('../middlewares/subirFoto.middleware');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/sedes — publico, solo activas
router.get('/', listar);

// GET /api/sedes/admin — solo administrador, incluye inactivas
router.get('/admin', verificarToken, verificarRol('administrador'), listarAdmin);

// POST /api/sedes — solo administrador
router.post('/', verificarToken, verificarRol('administrador'), crear);

// PUT /api/sedes/:id — solo administrador
router.put('/:id', verificarToken, verificarRol('administrador'), actualizar);

// POST /api/sedes/:id/foto — solo administrador (multipart, campo "foto")
router.post('/:id/foto', verificarToken, verificarRol('administrador'), fotosSedes.middleware, subirFoto);

module.exports = router;
