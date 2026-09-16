// routes/servicio.routes.js
// Publica: no requiere autenticacion.
const express = require('express');
const { listar } = require('../controllers/servicio.controller');

const router = express.Router();

// GET /api/servicios
router.get('/', listar);

module.exports = router;
