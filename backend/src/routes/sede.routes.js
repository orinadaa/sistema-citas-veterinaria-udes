// routes/sede.routes.js
// Lectura publica (RF-03); creacion/edicion exclusiva del administrador.
const express = require('express');
const { listar, crear, actualizar } = require('../controllers/sede.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/sedes — publico
router.get('/', listar);

// POST /api/sedes — solo administrador
router.post('/', verificarToken, verificarRol('administrador'), crear);

// PUT /api/sedes/:id — solo administrador
router.put('/:id', verificarToken, verificarRol('administrador'), actualizar);

module.exports = router;
