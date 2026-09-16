// controllers/servicio.controller.js
// RF-11: catalogo publico de servicios veterinarios; CRUD exclusivo del
// administrador.
const servicioModel = require('../models/servicio.model');

// GET /api/servicios — publico, solo activos
async function listar(req, res, next) {
  try {
    const servicios = await servicioModel.listarTodos();
    return res.status(200).json({ servicios });
  } catch (error) {
    next(error);
  }
}

// GET /api/servicios/admin — solo administrador, incluye inactivos
async function listarAdmin(req, res, next) {
  try {
    const servicios = await servicioModel.listarTodosAdmin();
    return res.status(200).json({ servicios });
  } catch (error) {
    next(error);
  }
}

// POST /api/servicios — solo administrador
async function crear(req, res, next) {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ mensaje: 'El nombre del servicio es obligatorio.' });
    }

    const servicio = await servicioModel.crear({ nombre, descripcion });
    return res.status(201).json({ servicio });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ya existe un servicio con ese nombre.' });
    }
    next(error);
  }
}

// PUT /api/servicios/:id — solo administrador
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    const servicio = await servicioModel.actualizar(id, { nombre, descripcion, activo });
    if (!servicio) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    }

    return res.status(200).json({ servicio });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ya existe un servicio con ese nombre.' });
    }
    next(error);
  }
}

module.exports = { listar, listarAdmin, crear, actualizar };
