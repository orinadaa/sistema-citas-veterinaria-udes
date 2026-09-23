// controllers/sede.controller.js
// RF-03: informacion accesible sin autenticacion (aqui, listado de
// sedes); RF-13 (ampliacion): gestion de sedes exclusiva del
// administrador, sin restriccion de "mi propia sede" (mismo criterio
// que ya tenian los horarios de atencion).
const sedeModel = require('../models/sede.model');

// GET /api/sedes — publico
async function listar(req, res, next) {
  try {
    const sedes = await sedeModel.listarTodas();
    return res.status(200).json({ sedes });
  } catch (error) {
    next(error);
  }
}

// POST /api/sedes — solo administrador
async function crear(req, res, next) {
  try {
    const { nombre, ciudad, direccion, fotoUrl } = req.body;
    if (!nombre || !ciudad) {
      return res.status(400).json({ mensaje: 'El nombre y la ciudad de la sede son obligatorios.' });
    }

    const sede = await sedeModel.crear({ nombre, ciudad, direccion, fotoUrl });
    return res.status(201).json({ sede });
  } catch (error) {
    next(error);
  }
}

// PUT /api/sedes/:id — solo administrador
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, ciudad, direccion, fotoUrl, activo } = req.body;

    const sede = await sedeModel.actualizar(id, { nombre, ciudad, direccion, fotoUrl, activo });
    if (!sede) {
      return res.status(404).json({ mensaje: 'Sede no encontrada.' });
    }

    return res.status(200).json({ sede });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, crear, actualizar };
