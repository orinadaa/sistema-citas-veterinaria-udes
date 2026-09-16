// routes/horario.routes.js
const express = require('express');
const { listar, actualizarDia, cerrarDia } = require('../controllers/horario.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/horarios?sedeId=... — publico (RF-03, landing y formulario de citas)
router.get('/', listar);

// PUT /api/horarios — solo administrador
router.put('/', verificarToken, verificarRol('administrador'), actualizarDia);

// DELETE /api/horarios/:sedeId/:diaSemana — solo administrador
router.delete('/:sedeId/:diaSemana', verificarToken, verificarRol('administrador'), cerrarDia);

module.exports = router;
