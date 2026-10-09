// routes/galeria.routes.js
// Galeria del inicio (fotos del Hero): lectura publica; todo lo demas es
// exclusivo del administrador.
const express = require('express');
const { listar, listarAdmin, crear, actualizar, reordenar, eliminar } = require('../controllers/galeria.controller');
const { fotosGaleria } = require('../middlewares/subirFoto.middleware');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();
const soloAdmin = [verificarToken, verificarRol('superadministrador')];

// GET /api/galeria — publico, solo fotos visibles
router.get('/', listar);

// GET /api/galeria/admin — incluye las ocultas
router.get('/admin', soloAdmin, listarAdmin);

// POST /api/galeria — multipart, campos "foto" y "descripcion"
router.post('/', soloAdmin, auditar('Subir foto a la galería', 'galeria'), fotosGaleria.middleware, crear);

// PUT /api/galeria/orden — antes de /:id para que "orden" no se tome como id
router.put('/orden', soloAdmin, auditar('Reordenar la galería', 'galeria'), reordenar);

// PUT /api/galeria/:id — descripcion, encuadre (focoX/focoY) y visible
router.put('/:id', soloAdmin, auditar('Editar foto de la galería', 'galeria'), actualizar);

// DELETE /api/galeria/:id
router.delete('/:id', soloAdmin, auditar('Quitar foto de la galería', 'galeria'), eliminar);

module.exports = router;
