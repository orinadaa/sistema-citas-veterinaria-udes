// routes/cita.routes.js
// RF-06 a RF-09: agendar, consultar disponibilidad, reprogramar y
// cancelar citas (HU-05 a HU-08).
//
// Ampliacion (calendario del panel administrativo): el administrador
// tambien puede consultar disponibilidad y crear citas, para agendar en
// nombre de un cliente desde su calendario (ver cita.controller.js:
// crear() exige clienteId explicito cuando quien llama es administrador).
// Reprogramar/cancelar: el cliente dueño, el administrador de la sede de
// la cita o el medico que la atiende (auditoria del 11 oct 2026).
const express = require('express');
const {
  consultarDisponibilidad,
  consultarMedicosDisponibles,
  crear,
  reenviarConfirmacion,
  misCitas,
  reprogramarCita,
  cancelarCita,
} = require('../controllers/cita.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { limitarIntentos } = require('../middlewares/seguridad.middleware');

const router = express.Router();

router.use(verificarToken);

// Topes por cuenta: frenan reservar en masa y abusar del reenvio de correos.
const porCuenta = (req) => `cuenta:${req.usuario.id}`;
const limiteAgendar = limitarIntentos({ ventanaMinutos: 15, maximo: 30, clave: porCuenta, mensaje: 'Estás agendando demasiado rápido. Espera unos minutos.' });
const limiteReenvio = limitarIntentos({ ventanaMinutos: 15, maximo: 5, clave: porCuenta, mensaje: 'Ya reenviamos la confirmación varias veces. Revisa tu correo o inténtalo más tarde.' });

// GET /api/citas/disponibilidad?sedeId=...&servicioId=...&fecha=YYYY-MM-DD
router.get('/disponibilidad', verificarRol('cliente', 'administrador', 'veterinario'), consultarDisponibilidad);

// GET /api/citas/medicos-disponibles?sedeId=...&servicioId=...&fechaHora=ISO
router.get('/medicos-disponibles', verificarRol('cliente', 'administrador'), consultarMedicosDisponibles);

// GET /api/citas/mias — exclusivo del cliente
router.get('/mias', verificarRol('cliente'), misCitas);

// POST /api/citas
router.post('/', verificarRol('cliente', 'administrador', 'veterinario'), limiteAgendar, crear);

// POST /api/citas/:id/reenviar-confirmacion — exclusivo del cliente dueño
router.post('/:id/reenviar-confirmacion', verificarRol('cliente'), limiteReenvio, reenviarConfirmacion);

// PATCH /api/citas/:id/reprogramar y /cancelar — el cliente dueño, el
// administrador de la sede de la cita o el medico que la atiende (el
// controlador comprueba cual de los tres; ver puedeGestionarCita).
const quienGestiona = verificarRol('cliente', 'administrador', 'veterinario');
router.patch('/:id/reprogramar', quienGestiona, reprogramarCita);
router.patch('/:id/cancelar', quienGestiona, cancelarCita);

module.exports = router;
