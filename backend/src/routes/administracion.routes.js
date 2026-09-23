// routes/administracion.routes.js
// RF-10, RF-11 (medicos/especialidades), RF-12.
const express = require('express');
const {
  listarMedicos,
  crearMedico,
  actualizarMedico,
  actualizarServiciosDeMedico,
  actualizarEspecialidadesDeMedico,
  listarCitas,
} = require('../controllers/administracion.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(verificarToken);

// GET /api/administracion/medicos — solo administrador
router.get('/medicos', verificarRol('administrador'), listarMedicos);

// POST /api/administracion/medicos — solo administrador
router.post('/medicos', verificarRol('administrador'), crearMedico);

// PUT /api/administracion/medicos/:id — solo administrador
router.put('/medicos/:id', verificarRol('administrador'), actualizarMedico);

// PUT /api/administracion/medicos/:id/servicios — solo administrador
router.put('/medicos/:id/servicios', verificarRol('administrador'), actualizarServiciosDeMedico);

// PUT /api/administracion/medicos/:id/especialidades — solo administrador
router.put('/medicos/:id/especialidades', verificarRol('administrador'), actualizarEspecialidadesDeMedico);

// GET /api/administracion/citas — administrador o veterinario
router.get('/citas', verificarRol('administrador', 'veterinario'), listarCitas);

module.exports = router;
