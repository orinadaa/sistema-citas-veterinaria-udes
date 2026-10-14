// routes/usuario.routes.js
// Gestion de cuentas (RF-04, RF-05). Crear personal y cambiar roles es del
// superadministrador, igual que activar o desactivar cualquier cuenta.
const express = require('express');
const { listar, crearStaff, cambiarRol, actualizarPerfilUsuario } = require('../controllers/usuario.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();

router.use(verificarToken);
const soloSuper = verificarRol('superadministrador');
const superOAdmin = verificarRol('superadministrador', 'administrador');

router.get('/', superOAdmin, listar);

router.post('/', soloSuper, auditar('Crear cuenta de personal', 'usuario'), crearStaff);

router.patch('/:id/rol', soloSuper, auditar('Cambiar rol o sede de una cuenta', 'usuario'), cambiarRol);

router.patch('/:id', soloSuper, auditar('Editar o activar/desactivar cuenta', 'usuario'), actualizarPerfilUsuario);

module.exports = router;
