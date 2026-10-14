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
const {
  obtenerDisponibilidadDeMedico,
  guardarHorarioDeMedico,
  crearBloqueoDeMedico,
  eliminarBloqueoDeMedico,
} = require('../controllers/disponibilidadMedico.controller');
const { obtenerReporte } = require('../controllers/reportes.controller');
const { obtenerTableroSede, obtenerResumenSistema } = require('../controllers/tablero.controller');
const { fotosUsuarios } = require('../middlewares/subirFoto.middleware');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();

router.use(verificarToken);

router.get('/tablero', verificarRol('administrador'), obtenerTableroSede);

router.get('/sistema', verificarRol('superadministrador'), obtenerResumenSistema);

router.get('/medicos', verificarRol('administrador'), listarMedicos);

router.post('/medicos', verificarRol('administrador'), auditar('Crear médico', 'usuario'), crearMedico);

router.put('/medicos/:id', verificarRol('administrador'), auditar('Editar médico', 'usuario'), actualizarMedico);

router.post('/medicos/:id/foto', verificarRol('administrador'), fotosUsuarios.middleware, subirFotoMedico);

router.put('/medicos/:id/servicios', verificarRol('administrador'), auditar('Cambiar servicios de un médico', 'usuario'), actualizarServiciosDeMedico);

router.put('/medicos/:id/especialidades', verificarRol('administrador'), auditar('Cambiar especialidades de un médico', 'usuario'), actualizarEspecialidadesDeMedico);

// Horario de trabajo y bloqueos de un medico de la sede — solo administrador.
// El medico los consulta en /api/medico/disponibilidad, no los edita.
router.get('/medicos/:id/disponibilidad', verificarRol('administrador'), obtenerDisponibilidadDeMedico);
router.put('/medicos/:id/disponibilidad/horario', verificarRol('administrador'), auditar('Cambiar horario de un médico', 'usuario'), guardarHorarioDeMedico);
router.post('/medicos/:id/disponibilidad/bloqueos', verificarRol('administrador'), auditar('Agregar bloqueo a un médico', 'usuario'), crearBloqueoDeMedico);
router.delete('/medicos/:id/disponibilidad/bloqueos/:bloqueoId', verificarRol('administrador'), auditar('Quitar bloqueo de un médico', 'usuario'), eliminarBloqueoDeMedico);

router.get('/citas', verificarRol('administrador', 'veterinario'), listarCitas);

router.get('/pacientes', verificarRol('administrador'), listarPacientes);

router.get('/pacientes/:id', verificarRol('administrador'), obtenerDetallePaciente);

router.get('/reportes', verificarRol('superadministrador', 'administrador'), obtenerReporte);

module.exports = router;
