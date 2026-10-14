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

router.get('/perfil', obtenerPerfil);

router.put('/perfil', actualizarPerfil);

router.post('/correo', solicitarCambioCorreo);

router.post('/correo/confirmar', confirmarCambioCorreo);

router.post('/contrasena/codigo', solicitarCodigoContrasena);

router.put('/contrasena', cambiarContrasena);

module.exports = router;
