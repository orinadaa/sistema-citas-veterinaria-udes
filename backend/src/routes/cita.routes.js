// routes/cita.routes.js
// RF-06 a RF-09: agendar, consultar disponibilidad, reprogramar y
// cancelar citas. Exclusivo del rol cliente (HU-05 a HU-08).
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

router.use(verificarToken, verificarRol('cliente'));

// GET /api/citas/disponibilidad?sedeId=...&servicioId=...&fecha=YYYY-MM-DD
router.get('/disponibilidad', consultarDisponibilidad);

// GET /api/citas/medicos-disponibles?sedeId=...&servicioId=...&fechaHora=ISO
router.get('/medicos-disponibles', consultarMedicosDisponibles);

// GET /api/citas/mias
router.get('/mias', misCitas);

// POST /api/citas
router.post('/', crear);

// PATCH /api/citas/:id/reprogramar
router.patch('/:id/reprogramar', reprogramarCita);

// PATCH /api/citas/:id/cancelar
router.patch('/:id/cancelar', cancelarCita);

module.exports = router;
