// controllers/medico.controller.js
// Endpoints propios del panel del medico veterinario (/api/medico),
// siempre acotados al medico que inicio sesion (req.usuario.id).
const usuarioModel = require('../models/usuario.model');
const medicoModel = require('../models/medico.model');
const mascotaModel = require('../models/mascota.model');
const citaModel = require('../models/cita.model');
const pacienteMedicoModel = require('../models/pacienteMedico.model');

// Mismo umbral que "frecuente" en Pacientes del administrador.
const UMBRAL_FRECUENTE = 3;

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

// GET /api/medico/pacientes?busqueda=&sedeId= — una fila por mascota
// con cita(s) con este medico + KPIs reales.
async function misPacientes(req, res, next) {
  try {
    const { busqueda, sedeId } = req.query;
    const [filas, todas, citasPorCliente] = await Promise.all([
      pacienteMedicoModel.listarPorMedico(req.usuario.id, { busqueda: busqueda?.trim() || null, sedeId }),
      pacienteMedicoModel.listarPorMedico(req.usuario.id),
      pacienteMedicoModel.contarCitasPorCliente(req.usuario.id),
    ]);

    // Los KPIs no dependen de los filtros: siempre sobre todos sus pacientes.
    const kpis = {
      pacientes: new Set(todas.map((f) => f.cliente_id)).size,
      conCitasProximas: new Set(todas.filter((f) => f.proxima_cita).map((f) => f.cliente_id)).size,
      frecuentes: citasPorCliente.filter((f) => f.total >= UMBRAL_FRECUENTE).length,
      mascotas: todas.length,
    };
    return res.status(200).json({ pacientes: filas, kpis });
  } catch (error) {
    next(error);
  }
}

// GET /api/medico/pacientes/:clienteId — detalle (solo lectura del
// dueño) de un paciente de este medico: mascotas activas y citas con el.
async function detallePaciente(req, res, next) {
  try {
    const { clienteId } = req.params;
    const cliente = await usuarioModel.buscarPorId(clienteId);
    if (!cliente || cliente.rol !== 'cliente') {
      return res.status(404).json({ mensaje: 'Paciente no encontrado.' });
    }
    if (!(await pacienteMedicoModel.esPacienteDe(clienteId, req.usuario.id))) {
      return res.status(403).json({ mensaje: 'Este cliente no es paciente tuyo.' });
    }

    const [mascotas, citas] = await Promise.all([mascotaModel.listarPorCliente(clienteId), citaModel.listarPorCliente(clienteId)]);
    return res.status(200).json({
      cliente,
      mascotas,
      citas: citas.filter((c) => c.medico_id === req.usuario.id),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { buscarClientes, misServicios, misPacientes, detallePaciente };
