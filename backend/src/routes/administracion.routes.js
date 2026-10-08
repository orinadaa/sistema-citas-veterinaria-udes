// routes/administracion.routes.js
// RF-10, RF-11 (medicos/especialidades), RF-12.
const express = require('express');
const {
  listarMedicos,
  crearMedico,
  actualizarMedico,
  subirFotoMedico,
  actualizarServiciosDeMedico,
  actualizarEspecialidadesDeMedico,
  listarCitas,
  listarPacientes,
  obtenerDetallePaciente,
} = require('../controllers/administracion.controller');
const { obtenerReporte } = require('../controllers/reportes.controller');
const { fotosUsuarios } = require('../middlewares/subirFoto.middleware');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(verificarToken);

// GET /api/administracion/medicos — solo administrador
router.get('/medicos', verificarRol('administrador'), listarMedicos);

// POST /api/administracion/medicos — solo administrador
router.post('/medicos', verificarRol('administrador'), crearMedico);

// PUT /api/administracion/medicos/:id — solo administrador
router.put('/medicos/:id', verificarRol('administrador'), actualizarMedico);

// POST /api/administracion/medicos/:id/foto — solo administrador (multipart, campo "foto")
router.post('/medicos/:id/foto', verificarRol('administrador'), fotosUsuarios.middleware, subirFotoMedico);

// PUT /api/administracion/medicos/:id/servicios — solo administrador
router.put('/medicos/:id/servicios', verificarRol('administrador'), actualizarServiciosDeMedico);

// PUT /api/administracion/medicos/:id/especialidades — solo administrador
router.put('/medicos/:id/especialidades', verificarRol('administrador'), actualizarEspecialidadesDeMedico);

// GET /api/administracion/citas — administrador o veterinario
router.get('/citas', verificarRol('administrador', 'veterinario'), listarCitas);

// GET /api/administracion/pacientes — solo administrador
router.get('/pacientes', verificarRol('administrador'), listarPacientes);

// GET /api/administracion/pacientes/:id — solo administrador
router.get('/pacientes/:id', verificarRol('administrador'), obtenerDetallePaciente);

// GET /api/administracion/reportes — solo administrador
router.get('/reportes', verificarRol('administrador'), obtenerReporte);

module.exports = router;
