// routes/cuenta.routes.js
// "Mi perfil" del cliente. Todo se acota a quien inicio sesion
// (req.usuario.id): un cliente nunca ve ni cambia la cuenta de otro.
const express = require('express');
const { obtenerPerfil, actualizarPerfil, solicitarCodigoContrasena, cambiarContrasena } = require('../controllers/cuenta.controller');
// El cambio de correo con codigo es el mismo del perfil del medico.
const { solicitarCambioCorreo, confirmarCambioCorreo } = require('../controllers/perfilMedico.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(verificarToken, verificarRol('cliente'));

// GET /api/cuenta/perfil
router.get('/perfil', obtenerPerfil);

// PUT /api/cuenta/perfil
router.put('/perfil', actualizarPerfil);

// POST /api/cuenta/correo — { correoNuevo }: envia el codigo al correo nuevo
router.post('/correo', solicitarCambioCorreo);

// POST /api/cuenta/correo/confirmar — { codigo }
router.post('/correo/confirmar', confirmarCambioCorreo);

// POST /api/cuenta/contrasena/codigo — envia el codigo al correo de la cuenta
router.post('/contrasena/codigo', solicitarCodigoContrasena);

// PUT /api/cuenta/contrasena — { codigo, contrasenaNueva }
router.put('/contrasena', cambiarContrasena);

module.exports = router;
