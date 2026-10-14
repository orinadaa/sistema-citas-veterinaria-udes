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
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();

router.get('/', listar);

router.get('/categorias', listarCategorias);

router.get('/admin', verificarToken, verificarRol('superadministrador', 'administrador'), listarAdmin);

router.post('/', verificarToken, verificarRol('superadministrador'), auditar('Crear servicio', 'servicio'), crear);

router.put('/:id', verificarToken, verificarRol('superadministrador'), auditar('Editar servicio', 'servicio'), actualizar);

router.post('/:id/foto', verificarToken, verificarRol('superadministrador'), auditar('Cambiar foto de servicio', 'servicio'), fotosServicios.middleware, subirFoto);

router.delete('/:id/foto', verificarToken, verificarRol('superadministrador'), auditar('Quitar foto de servicio', 'servicio'), quitarFoto);

module.exports = router;
