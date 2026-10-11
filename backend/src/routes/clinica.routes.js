// routes/clinica.routes.js
// RF-23: informacion general de la clinica. Leerla es publico (landing);
// cambiarla, solo el superadministrador, y queda en la bitacora.
const express = require('express');
const { obtenerPublica, obtenerAdmin, actualizar } = require('../controllers/clinica.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();
const soloSuper = [verificarToken, verificarRol('superadministrador')];

// GET /api/clinica — publico
router.get('/', obtenerPublica);

// GET /api/clinica/admin
router.get('/admin', soloSuper, obtenerAdmin);

// PUT /api/clinica
router.put('/', soloSuper, auditar('Cambiar información de la clínica', 'clinica'), actualizar);

module.exports = router;
