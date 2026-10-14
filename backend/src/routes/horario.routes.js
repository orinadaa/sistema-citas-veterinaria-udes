// routes/horario.routes.js
const express = require('express');
const { listar, citasAfectadas, actualizarDia, cerrarDia } = require('../controllers/horario.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();

router.get('/', listar);

router.get('/afectadas', verificarToken, verificarRol('superadministrador', 'administrador'), citasAfectadas);

router.put('/', verificarToken, verificarRol('superadministrador', 'administrador'), auditar('Cambiar horario de atención', 'horario'), actualizarDia);

router.delete('/:sedeId/:diaSemana', verificarToken, verificarRol('superadministrador', 'administrador'), auditar('Cerrar un día de atención', 'horario'), cerrarDia);

module.exports = router;
