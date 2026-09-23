// controllers/servicio.controller.js
// RF-11: catalogo publico de servicios veterinarios; CRUD exclusivo del
// administrador.
const servicioModel = require('../models/servicio.model');
const categoriaServicioModel = require('../models/categoriaServicio.model');

function precioValido(precio) {
  return Number.isInteger(precio) && precio >= 0;
}

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

// GET /api/categorias-servicio — publico, para poblar selects
async function listarCategorias(req, res, next) {
  try {
    const categorias = await categoriaServicioModel.listarTodas();
    return res.status(200).json({ categorias });
  } catch (error) {
    next(error);
  }
}

// POST /api/servicios — solo administrador
async function crear(req, res, next) {
  try {
    const { nombre, descripcion, categoriaId, precio } = req.body;
    if (!nombre) {
      return res.status(400).json({ mensaje: 'El nombre del servicio es obligatorio.' });
    }
    if (!categoriaId) {
      return res.status(400).json({ mensaje: 'La categoría del servicio es obligatoria.' });
    }
    if (precio !== undefined && !precioValido(precio)) {
      return res.status(400).json({ mensaje: 'El precio debe ser un número entero mayor o igual a 0.' });
    }
    if (!(await categoriaServicioModel.existe(categoriaId))) {
      return res.status(400).json({ mensaje: 'La categoría indicada no existe.' });
    }

    const servicio = await servicioModel.crear({ nombre, descripcion, categoriaId, precio });
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
    const { nombre, descripcion, categoriaId, precio, activo } = req.body;

    if (precio !== undefined && !precioValido(precio)) {
      return res.status(400).json({ mensaje: 'El precio debe ser un número entero mayor o igual a 0.' });
    }
    if (categoriaId && !(await categoriaServicioModel.existe(categoriaId))) {
      return res.status(400).json({ mensaje: 'La categoría indicada no existe.' });
    }

    const servicio = await servicioModel.actualizar(id, { nombre, descripcion, categoriaId, precio, activo });
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

module.exports = { listar, listarAdmin, listarCategorias, crear, actualizar };
