// routes/notificacion.routes.js
// La campana: el cliente y el medico ven y marcan SUS notificaciones. Los
// administradores y el superadministrador no tienen notificaciones.
const express = require('express');
const notificacionModel = require('../models/notificacion.model');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(verificarToken, verificarRol('cliente', 'veterinario'));

// GET /api/notificaciones — las ultimas 30 y cuantas hay sin leer
router.get('/', async (req, res, next) => {
  try {
    return res.status(200).json(await notificacionModel.listarDeUsuario(req.usuario.id));
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notificaciones/leidas — marcar todas como leidas
router.patch('/leidas', async (req, res, next) => {
  try {
    await notificacionModel.marcarTodasLeidas(req.usuario.id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notificaciones/:id/leida
router.patch('/:id/leida', async (req, res, next) => {
  try {
    const marcada = await notificacionModel.marcarLeida(req.usuario.id, req.params.id);
    if (!marcada) return res.status(404).json({ mensaje: 'Notificación no encontrada.' });
    return res.status(204).send();
  } catch (error) {
    // Un id que no es UUID: para quien lo pide, simplemente no existe.
    if (error.code === '22P02') return res.status(404).json({ mensaje: 'Notificación no encontrada.' });
    next(error);
  }
});

module.exports = router;
