// routes/servicio.routes.js
const express = require('express');
const {
  listar,
  listarAdmin,
  listarCategorias,
  crear,
  actualizar,
  subirFoto,
  quitarFoto,
} = require('../controllers/servicio.controller');
const { fotosServicios } = require('../middlewares/subirFoto.middleware');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/servicios — publico
router.get('/', listar);

// GET /api/servicios/categorias — publico (categorias/especialidades del sistema de diseno)
router.get('/categorias', listarCategorias);

// GET /api/servicios/admin — solo administrador
router.get('/admin', verificarToken, verificarRol('administrador'), listarAdmin);

// POST /api/servicios — solo administrador
router.post('/', verificarToken, verificarRol('administrador'), crear);

// PUT /api/servicios/:id — solo administrador
router.put('/:id', verificarToken, verificarRol('administrador'), actualizar);

// POST /api/servicios/:id/foto — solo administrador (multipart, campo "foto")
router.post('/:id/foto', verificarToken, verificarRol('administrador'), fotosServicios.middleware, subirFoto);

// DELETE /api/servicios/:id/foto — solo administrador
router.delete('/:id/foto', verificarToken, verificarRol('administrador'), quitarFoto);

module.exports = router;
