// routes/servicio.routes.js
const express = require('express');
const { listar, listarAdmin, crear, actualizar } = require('../controllers/servicio.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/servicios — publico
router.get('/', listar);

// GET /api/servicios/admin — solo administrador
router.get('/admin', verificarToken, verificarRol('administrador'), listarAdmin);

// POST /api/servicios — solo administrador
router.post('/', verificarToken, verificarRol('administrador'), crear);

// PUT /api/servicios/:id — solo administrador
router.put('/:id', verificarToken, verificarRol('administrador'), actualizar);

module.exports = router;
