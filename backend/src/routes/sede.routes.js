// routes/sede.routes.js
// Publica: no requiere autenticacion (RF-03).
const express = require('express');
const { listar } = require('../controllers/sede.controller');

const router = express.Router();

// GET /api/sedes
router.get('/', listar);

module.exports = router;
