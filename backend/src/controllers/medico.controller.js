// controllers/medico.controller.js
// Endpoints propios del panel del medico veterinario (/api/medico),
// siempre acotados al medico que inicio sesion (req.usuario.id).
const usuarioModel = require('../models/usuario.model');
const medicoModel = require('../models/medico.model');

// GET /api/medico/clientes?busqueda=... — buscar al dueño al agendar.
// Minimo 2 caracteres para no listar todos los clientes.
async function buscarClientes(req, res, next) {
  try {
    const termino = String(req.query.busqueda || '').trim();
    if (termino.length < 2) {
      return res.status(200).json({ clientes: [] });
    }
    const clientes = await usuarioModel.buscarClientes(termino);
    return res.status(200).json({ clientes });
  } catch (error) {
    next(error);
  }
}

// GET /api/medico/servicios — servicios que presta este medico.
async function misServicios(req, res, next) {
  try {
    const servicios = await medicoModel.listarServiciosDeMedico(req.usuario.id);
    return res.status(200).json({ servicios });
  } catch (error) {
    next(error);
  }
}

module.exports = { buscarClientes, misServicios };
