// routes/horario.routes.js
const express = require('express');
const {
  listar,
  citasAfectadas,
  actualizarDia,
  cerrarDia,
  listarFestivos,
  citasAfectadasFestivo,
  actualizarFestivo,
  cerrarFestivo,
} = require('../controllers/horario.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();

router.get('/', listar);

router.get('/festivos', verificarToken, verificarRol('superadministrador', 'administrador'), listarFestivos);

router.get('/festivos/afectadas', verificarToken, verificarRol('superadministrador', 'administrador'), citasAfectadasFestivo);

router.put('/festivos', verificarToken, verificarRol('superadministrador', 'administrador'), auditar('Abrir o cambiar horario de un festivo', 'horario'), actualizarFestivo);

router.delete('/festivos/:sedeId/:fecha', verificarToken, verificarRol('superadministrador', 'administrador'), auditar('Cerrar un festivo', 'horario'), cerrarFestivo);

router.get('/afectadas', verificarToken, verificarRol('superadministrador', 'administrador'), citasAfectadas);

router.put('/', verificarToken, verificarRol('superadministrador', 'administrador'), auditar('Cambiar horario de atención', 'horario'), actualizarDia);

router.delete('/:sedeId/:diaSemana', verificarToken, verificarRol('superadministrador', 'administrador'), auditar('Cerrar un día de atención', 'horario'), cerrarDia);

module.exports = router;
