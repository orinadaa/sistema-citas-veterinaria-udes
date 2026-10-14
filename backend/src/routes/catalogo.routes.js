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

router.get('/especies', listarEspeciesActivas);

router.get('/especies/admin', soloSuper, listarEspeciesAdmin);

router.post('/especies', soloSuper, auditar('Crear especie', 'especie'), crearEspecie);

router.put('/especies/:id', soloSuper, auditar('Editar o activar/desactivar especie', 'especie'), actualizarEspecie);

router.post('/especies/:id/razas', soloSuper, auditar('Crear raza', 'raza'), crearRaza);

router.put('/razas/:id', soloSuper, auditar('Editar o activar/desactivar raza', 'raza'), actualizarRaza);

router.get('/categorias', soloSuper, listarCategorias);

router.post('/categorias', soloSuper, auditar('Crear categoría', 'categoria'), crearCategoria);

router.put('/categorias/:id', soloSuper, auditar('Editar o activar/desactivar categoría', 'categoria'), actualizarCategoria);

module.exports = router;
