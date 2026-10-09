// routes/horario.routes.js
const express = require('express');
const { listar, actualizarDia, cerrarDia } = require('../controllers/horario.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();

// GET /api/horarios?sedeId=... — publico (RF-03, landing y formulario de citas)
router.get('/', listar);

// PUT /api/horarios — solo administrador
router.put('/', verificarToken, verificarRol('superadministrador', 'administrador'), auditar('Cambiar horario de atención', 'horario'), actualizarDia);

// DELETE /api/horarios/:sedeId/:diaSemana — solo administrador
router.delete('/:sedeId/:diaSemana', verificarToken, verificarRol('superadministrador', 'administrador'), auditar('Cerrar un día de atención', 'horario'), cerrarDia);

module.exports = router;
