// routes/campo.routes.js
// Campos personalizados administrables. Leer las definiciones lo puede
// cualquier usuario con sesion (los formularios las necesitan); crear,
// editar, desactivar y ordenar, solo el administrador. A proposito no hay
// ruta DELETE: un campo nunca se elimina.
const express = require('express');
const { listar, listarEntidades, crear, actualizar, reordenar } = require('../controllers/campo.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = express.Router();
const soloAdmin = verificarRol('superadministrador');

router.use(verificarToken);

// GET /api/campos?entidad=mascota
router.get('/', listar);

// GET /api/campos/entidades
router.get('/entidades', soloAdmin, listarEntidades);

// POST /api/campos
router.post('/', soloAdmin, crear);

// PUT /api/campos/orden — antes de /:id para que "orden" no se tome como id
router.put('/orden', soloAdmin, reordenar);

// PUT /api/campos/:id
router.put('/:id', soloAdmin, actualizar);

module.exports = router;
