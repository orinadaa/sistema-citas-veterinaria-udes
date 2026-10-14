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

router.get('/', listar);

router.get('/admin', soloAdmin, listarAdmin);

router.post('/', soloAdmin, auditar('Subir foto a la galería', 'galeria'), fotosGaleria.middleware, crear);

router.put('/orden', soloAdmin, auditar('Reordenar la galería', 'galeria'), reordenar);

router.put('/:id', soloAdmin, auditar('Editar foto de la galería', 'galeria'), actualizar);

router.delete('/:id', soloAdmin, auditar('Quitar foto de la galería', 'galeria'), eliminar);

module.exports = router;
