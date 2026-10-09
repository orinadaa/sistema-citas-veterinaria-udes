// routes/catalogo.routes.js
// Catalogos gestionados por el superadministrador. Solo es publica la
// lista de especies y razas activas (la usan los formularios de mascota,
// tambien el del cliente). No hay rutas DELETE: todo se desactiva.
const express = require('express');
const {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  listarEspeciesActivas,
  listarEspeciesAdmin,
  crearEspecie,
  actualizarEspecie,
  crearRaza,
  actualizarRaza,
} = require('../controllers/catalogo.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();
const soloSuper = [verificarToken, verificarRol('superadministrador')];

// GET /api/catalogos/especies — publico
router.get('/especies', listarEspeciesActivas);

// GET /api/catalogos/especies/admin — todas, con su uso
router.get('/especies/admin', soloSuper, listarEspeciesAdmin);

// POST /api/catalogos/especies
router.post('/especies', soloSuper, auditar('Crear especie', 'especie'), crearEspecie);

// PUT /api/catalogos/especies/:id
router.put('/especies/:id', soloSuper, auditar('Editar o activar/desactivar especie', 'especie'), actualizarEspecie);

// POST /api/catalogos/especies/:id/razas
router.post('/especies/:id/razas', soloSuper, auditar('Crear raza', 'raza'), crearRaza);

// PUT /api/catalogos/razas/:id
router.put('/razas/:id', soloSuper, auditar('Editar o activar/desactivar raza', 'raza'), actualizarRaza);

// GET /api/catalogos/categorias — todas, con su uso
router.get('/categorias', soloSuper, listarCategorias);

// POST /api/catalogos/categorias
router.post('/categorias', soloSuper, auditar('Crear categoría', 'categoria'), crearCategoria);

// PUT /api/catalogos/categorias/:id
router.put('/categorias/:id', soloSuper, auditar('Editar o activar/desactivar categoría', 'categoria'), actualizarCategoria);

module.exports = router;
