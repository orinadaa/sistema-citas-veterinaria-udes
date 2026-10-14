// routes/cita.routes.js
// RF-06 a RF-09: agendar, consultar disponibilidad, reprogramar y cancelar
// citas (HU-05 a HU-08).
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

router.get('/disponibilidad', verificarRol('cliente', 'administrador', 'veterinario'), consultarDisponibilidad);

router.get('/medicos-disponibles', verificarRol('cliente', 'administrador'), consultarMedicosDisponibles);

router.get('/mias', verificarRol('cliente'), misCitas);

router.post('/', verificarRol('cliente', 'administrador', 'veterinario'), limiteAgendar, crear);

router.post('/:id/reenviar-confirmacion', verificarRol('cliente'), limiteReenvio, reenviarConfirmacion);

// PATCH /api/citas/:id/reprogramar y /cancelar — el cliente dueño, el
// administrador de la sede de la cita o el medico que la atiende (el
// controlador comprueba cual de los tres; ver puedeGestionarCita).
const quienGestiona = verificarRol('cliente', 'administrador', 'veterinario');
router.patch('/:id/reprogramar', quienGestiona, reprogramarCita);
router.patch('/:id/cancelar', quienGestiona, cancelarCita);

module.exports = router;
