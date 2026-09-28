// routes/mascota.routes.js
const express = require('express');
const { misMascotas, listarDeCliente, crear, actualizar, eliminar } = require('../controllers/mascota.controller');
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

// DELETE /api/mascotas/:id — solo el cliente dueño (baja logica)
router.delete('/:id', verificarRol('cliente'), eliminar);

module.exports = router;
