// routes/mascota.routes.js
const express = require('express');
const { misMascotas, listarDeCliente, crear, actualizar, eliminar, subirFoto } = require('../controllers/mascota.controller');
const { subirFotoMascota } = require('../middlewares/subirFoto.middleware');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(verificarToken);

router.get('/mias', verificarRol('cliente'), misMascotas);

// Administrador o medico (agendar a nombre de un cliente, detalle de sus
// pacientes)
router.get('/', verificarRol('administrador', 'veterinario'), listarDeCliente);

router.post('/', verificarRol('cliente', 'administrador', 'veterinario'), crear);

router.put('/:id', verificarRol('cliente', 'administrador', 'veterinario'), actualizar);

router.post('/:id/foto', verificarRol('cliente', 'administrador', 'veterinario'), subirFotoMascota, subirFoto);

// Solo el cliente dueño (baja logica). El administrador puede editar los datos
// de la mascota, no eliminarla.
router.delete('/:id', verificarRol('cliente'), eliminar);

module.exports = router;
