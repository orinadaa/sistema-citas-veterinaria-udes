// controllers/sede.controller.js
// RF-03: informacion accesible sin autenticacion (aqui, listado de sedes).
const { listarTodas } = require('../models/sede.model');

async function listar(req, res, next) {
  try {
    const sedes = await listarTodas();
    return res.status(200).json({ sedes });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar };
