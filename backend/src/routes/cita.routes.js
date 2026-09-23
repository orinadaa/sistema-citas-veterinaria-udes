// routes/cita.routes.js
// RF-06 a RF-09: agendar, consultar disponibilidad, reprogramar y
// cancelar citas (HU-05 a HU-08), exclusivo del rol cliente.
//
// Ampliacion (calendario del panel administrativo): el administrador
// tambien puede consultar disponibilidad y crear citas, para agendar en
// nombre de un cliente desde su calendario (ver cita.controller.js:
// crear() exige clienteId explicito cuando quien llama es administrador).
// Reprogramar/cancelar siguen siendo exclusivas del cliente dueno de la
// cita (RF-08/RF-09) — no se ampliaron.
const express = require('express');
const {
  consultarDisponibilidad,
  consultarMedicosDisponibles,
  crear,
  misCitas,
  reprogramarCita,
  cancelarCita,
} = require('../controllers/cita.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(verificarToken);

// GET /api/citas/disponibilidad?sedeId=...&servicioId=...&fecha=YYYY-MM-DD
router.get('/disponibilidad', verificarRol('cliente', 'administrador'), consultarDisponibilidad);

// GET /api/citas/medicos-disponibles?sedeId=...&servicioId=...&fechaHora=ISO
router.get('/medicos-disponibles', verificarRol('cliente', 'administrador'), consultarMedicosDisponibles);

// GET /api/citas/mias — exclusivo del cliente
router.get('/mias', verificarRol('cliente'), misCitas);

// POST /api/citas
router.post('/', verificarRol('cliente', 'administrador'), crear);

// PATCH /api/citas/:id/reprogramar — exclusivo del cliente dueño de la cita
router.patch('/:id/reprogramar', verificarRol('cliente'), reprogramarCita);

// PATCH /api/citas/:id/cancelar — exclusivo del cliente dueño de la cita
router.patch('/:id/cancelar', verificarRol('cliente'), cancelarCita);

module.exports = router;
