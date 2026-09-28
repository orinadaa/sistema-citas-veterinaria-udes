// routes/mascota.routes.js
const express = require('express');
const { misMascotas, listarDeCliente, crear, actualizar, eliminar, subirFoto } = require('../controllers/mascota.controller');
const { subirFotoMascota } = require('../middlewares/subirFoto.middleware');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(verificarToken);

// GET /api/mascotas/mias — solo cliente
router.get('/mias', verificarRol('cliente'), misMascotas);

// GET /api/mascotas?clienteId=... — solo administrador
router.get('/', verificarRol('administrador'), listarDeCliente);

// POST /api/mascotas — cliente (para si mismo) o administrador (indicando clienteId)
router.post('/', verificarRol('cliente', 'administrador'), crear);

// PUT /api/mascotas/:id — dueño o administrador
router.put('/:id', verificarRol('cliente', 'administrador'), actualizar);

// POST /api/mascotas/:id/foto — dueño o administrador (multipart, campo "foto")
router.post('/:id/foto', verificarRol('cliente', 'administrador'), subirFotoMascota, subirFoto);

// DELETE /api/mascotas/:id — solo el cliente dueño (baja logica)
router.delete('/:id', verificarRol('cliente'), eliminar);

module.exports = router;
