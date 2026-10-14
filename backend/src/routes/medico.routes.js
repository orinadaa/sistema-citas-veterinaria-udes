// routes/medico.routes.js
// Panel propio del medico veterinario. Todo exclusivo del rol veterinario.
const express = require('express');
const {
  buscarClientes,
  misServicios,
  misPacientes,
  detallePaciente,
  crearRecordatorio,
  listarRecordatorios,
} = require('../controllers/medico.controller');
const {
  obtenerPerfil,
  actualizarPerfil,
  subirFotoPerfil,
  cambiarContrasena,
  solicitarCambioCorreo,
  confirmarCambioCorreo,
} = require('../controllers/perfilMedico.controller');
const { obtenerDisponibilidad } = require('../controllers/disponibilidadMedico.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { fotosUsuarios } = require('../middlewares/subirFoto.middleware');

const router = express.Router();

router.use(verificarToken, verificarRol('veterinario'));

router.get('/clientes', buscarClientes);

router.get('/servicios', misServicios);

router.get('/pacientes', misPacientes);

router.get('/pacientes/:clienteId', detallePaciente);

router.post('/recordatorios', crearRecordatorio);

router.get('/recordatorios', listarRecordatorios);

// Mi perfil
router.get('/perfil', obtenerPerfil);
router.put('/perfil', actualizarPerfil);
router.post('/perfil/foto', fotosUsuarios.middleware, subirFotoPerfil);
router.put('/perfil/contrasena', cambiarContrasena);
// Cambio de correo en 2 pasos: pedir codigo al correo nuevo -> confirmar.
router.post('/perfil/correo', solicitarCambioCorreo);
router.post('/perfil/correo/confirmar', confirmarCambioCorreo);

// Horario de trabajo y bloqueos: solo consulta. Los define el administrador
// de la sede (ver administracion.routes.js).
router.get('/disponibilidad', obtenerDisponibilidad);

module.exports = router;
