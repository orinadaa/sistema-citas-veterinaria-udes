// routes/mascota.routes.js
const express = require('express');
const {
  misMascotas,
  listarDeCliente,
  crear,
  actualizar,
  eliminar,
  subirFoto,
  subirArchivoCampo,
  quitarArchivoCampo,
} = require('../controllers/mascota.controller');
const { subirFotoMascota, adjuntos } = require('../middlewares/subirFoto.middleware');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(verificarToken);

// GET /api/mascotas/mias — solo cliente
router.get('/mias', verificarRol('cliente'), misMascotas);

// GET /api/mascotas?clienteId=... — administrador o medico (agendar a
// nombre de un cliente, detalle de sus pacientes)
router.get('/', verificarRol('administrador', 'veterinario'), listarDeCliente);

// POST /api/mascotas — cliente (para si mismo) o administrador (indicando clienteId)
router.post('/', verificarRol('cliente', 'administrador', 'veterinario'), crear);

// PUT /api/mascotas/:id — dueño o administrador
router.put('/:id', verificarRol('cliente', 'administrador', 'veterinario'), actualizar);

// POST /api/mascotas/:id/foto — dueño o administrador (multipart, campo "foto")
router.post('/:id/foto', verificarRol('cliente', 'administrador', 'veterinario'), subirFotoMascota, subirFoto);

// Adjunto de un campo personalizado de tipo archivo (multipart, campo
// "archivo": PDF, JPG o PNG) — dueño, administrador o medico del paciente
router.post(
  '/:id/campos/:clave/archivo',
  verificarRol('cliente', 'administrador', 'veterinario'),
  adjuntos.middleware,
  subirArchivoCampo
);
router.delete('/:id/campos/:clave/archivo', verificarRol('cliente', 'administrador', 'veterinario'), quitarArchivoCampo);

// DELETE /api/mascotas/:id — solo el cliente dueño (baja logica). El
// administrador puede editar los datos de la mascota, no eliminarla
// (decision de la usuaria).
router.delete('/:id', verificarRol('cliente'), eliminar);

module.exports = router;
