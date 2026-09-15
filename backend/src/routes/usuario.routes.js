// routes/usuario.routes.js
// Todas estas rutas son exclusivas del rol administrador (RF-04, RF-05).
const express = require('express');
const { listar, crearStaff, cambiarRol } = require('../controllers/usuario.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(verificarToken, verificarRol('administrador'));

// GET /api/usuarios
router.get('/', listar);

// POST /api/usuarios — alta de administrador/veterinario
router.post('/', crearStaff);

// PATCH /api/usuarios/:id/rol
router.patch('/:id/rol', cambiarRol);

module.exports = router;
