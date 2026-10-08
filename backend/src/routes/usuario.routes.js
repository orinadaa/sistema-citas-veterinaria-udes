// routes/usuario.routes.js
// Gestion de cuentas (RF-04, RF-05). Crear personal y cambiar roles es del
// superadministrador. El administrador de sede solo lista clientes (para
// agendarles) y activa/desactiva clientes; a sus medicos los gestiona en
// /api/administracion/medicos.
const express = require('express');
const { listar, crearStaff, cambiarRol, actualizarPerfilUsuario } = require('../controllers/usuario.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(verificarToken);
const soloSuper = verificarRol('superadministrador');
const superOAdmin = verificarRol('superadministrador', 'administrador');

// GET /api/usuarios
router.get('/', superOAdmin, listar);

// POST /api/usuarios — alta de administrador/veterinario
router.post('/', soloSuper, crearStaff);

// PATCH /api/usuarios/:id/rol
router.patch('/:id/rol', soloSuper, cambiarRol);

// PATCH /api/usuarios/:id — activo/telefono/nombre (cualquier rol)
router.patch('/:id', superOAdmin, actualizarPerfilUsuario);

module.exports = router;
