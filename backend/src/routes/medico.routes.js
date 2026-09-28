// routes/medico.routes.js
// Panel propio del medico veterinario. Todo exclusivo del rol veterinario.
const express = require('express');
const { buscarClientes, misServicios, misPacientes, detallePaciente } = require('../controllers/medico.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(verificarToken, verificarRol('veterinario'));

// GET /api/medico/clientes?busqueda=...
router.get('/clientes', buscarClientes);

// GET /api/medico/servicios
router.get('/servicios', misServicios);

// GET /api/medico/pacientes?busqueda=&sedeId=
router.get('/pacientes', misPacientes);

// GET /api/medico/pacientes/:clienteId
router.get('/pacientes/:clienteId', detallePaciente);

module.exports = router;
