// controllers/servicio.controller.js
// Catalogo publico de servicios veterinarios (RF-11 lo hara configurable
// desde el panel administrativo en el incremento 3).
const { listarTodos } = require('../models/servicio.model');

async function listar(req, res, next) {
  try {
    const servicios = await listarTodos();
    return res.status(200).json({ servicios });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar };
