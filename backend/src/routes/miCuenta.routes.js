// routes/miCuenta.routes.js
// "Mi cuenta" del administrador de sede y del superadministrador
// (/api/mi-cuenta): cambiar su correo y su contraseña. para la contraseña:
// contraseña actual + codigo por correo.
const express = require('express');
const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuario.model');
const { solicitarCodigoContrasena, cambiarContrasena } = require('../controllers/cuenta.controller');
const { solicitarCambioCorreo, confirmarCambioCorreo } = require('../controllers/perfilMedico.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();
router.use(verificarToken, verificarRol('administrador', 'superadministrador'));

// Exige la contraseña actual antes de enviar el codigo.
async function exigirContrasenaActual(req, res, next) {
  try {
    const actual = String(req.body.contrasenaActual || '');
    if (!actual) return res.status(400).json({ mensaje: 'Escribe tu contraseña actual.' });
    const usuario = await usuarioModel.buscarConHashPorId(req.usuario.id);
    if (!usuario || !(await bcrypt.compare(actual, usuario.contrasena_hash))) {
      return res.status(400).json({ mensaje: 'La contraseña actual no es correcta.' });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

router.get('/', async (req, res, next) => {
  try {
    const usuario = await usuarioModel.buscarPorId(req.usuario.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Cuenta no encontrada.' });
    return res.status(200).json({ cuenta: { nombreCompleto: usuario.nombre_completo, correo: usuario.correo, rol: usuario.rol, creadoEn: usuario.creado_en } });
  } catch (error) {
    return next(error);
  }
});

router.post('/correo', solicitarCambioCorreo);

router.post('/correo/confirmar', auditar('Cambiar su correo', 'usuario'), confirmarCambioCorreo);

router.post('/contrasena/codigo', exigirContrasenaActual, solicitarCodigoContrasena);

router.put('/contrasena', auditar('Cambiar su contraseña', 'usuario'), cambiarContrasena);

module.exports = router;
