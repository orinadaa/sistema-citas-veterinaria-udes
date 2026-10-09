// routes/datos.routes.js
// Modulo "Datos": solo el superadministrador. Explorar y exportar son de
// solo lectura; las correcciones y las descargas quedan en la bitacora.
// No hay rutas DELETE ni edicion libre de tablas.
const express = require('express');
const {
  listarEntidades,
  listar,
  obtener,
  exportar,
  listarBitacora,
  respaldo,
  corregirUsuario,
  reasignarMascota,
  reactivarMascota,
  medicosParaCita,
  corregirCita,
} = require('../controllers/datos.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { auditar } = require('../middlewares/bitacora.middleware');

const router = express.Router();
router.use(verificarToken, verificarRol('superadministrador'));

// GET /api/datos — entidades que se pueden explorar
router.get('/', listarEntidades);

// GET /api/datos/bitacora
router.get('/bitacora', listarBitacora);

// GET /api/datos/respaldo — copia de seguridad (.sql)
router.get('/respaldo', auditar('Descargar copia de seguridad', 'sistema'), respaldo);

// Correcciones puntuales
router.put('/usuarios/:id/corregir', auditar('Corregir datos de una cuenta', 'usuario'), corregirUsuario);
router.put('/mascotas/:id/dueno', auditar('Reasignar mascota a otro dueño', 'mascota'), reasignarMascota);
router.put('/mascotas/:id/reactivar', auditar('Reactivar mascota', 'mascota'), reactivarMascota);
router.get('/citas/:id/medicos', medicosParaCita);
router.put('/citas/:id/corregir', auditar('Corregir cita', 'cita'), corregirCita);

// Explorador (solo lectura)
router.get('/:entidad/exportar', auditar('Exportar datos', 'sistema'), exportar);
router.get('/:entidad/:id', obtener);
router.get('/:entidad', listar);

module.exports = router;
