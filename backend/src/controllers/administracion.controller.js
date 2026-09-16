// controllers/administracion.controller.js
// RF-10 (agenda por sede), RF-12 (seguimiento de citas). Los medicos y
// sus especialidades tambien se administran aqui (parte de RF-11).
const medicoModel = require('../models/medico.model');
const servicioModel = require('../models/servicio.model');
const citaModel = require('../models/cita.model');
const usuarioModel = require('../models/usuario.model');

// GET /api/administracion/medicos — solo administrador, de su propia sede
async function listarMedicos(req, res, next) {
  try {
    const medicos = await medicoModel.listarConServicios(req.usuario.sedeId);
    return res.status(200).json({ medicos });
  } catch (error) {
    next(error);
  }
}

// PUT /api/administracion/medicos/:id/servicios — solo administrador
async function actualizarServiciosDeMedico(req, res, next) {
  try {
    const { id } = req.params;
    const { servicioIds } = req.body;

    if (!Array.isArray(servicioIds)) {
      return res.status(400).json({ mensaje: 'servicioIds debe ser una lista de ids de servicio.' });
    }

    const medico = await usuarioModel.buscarPorId(id);
    if (!medico || medico.rol !== 'veterinario') {
      return res.status(404).json({ mensaje: 'Médico no encontrado.' });
    }
    if (medico.sede_id !== req.usuario.sedeId) {
      return res.status(403).json({ mensaje: 'Solo puedes administrar médicos de tu propia sede.' });
    }

    for (const servicioId of servicioIds) {
      const servicio = await servicioModel.buscarPorId(servicioId);
      if (!servicio) {
        return res.status(400).json({ mensaje: `El servicio ${servicioId} no existe.` });
      }
    }

    await medicoModel.reemplazarServicios(id, servicioIds);
    const medicosActualizados = await medicoModel.listarConServicios(req.usuario.sedeId);
    const medicoActualizado = medicosActualizados.find((m) => m.id === id);

    return res.status(200).json({ medico: medicoActualizado });
  } catch (error) {
    next(error);
  }
}

// GET /api/administracion/citas — administrador (su sede) o veterinario (las suyas)
async function listarCitas(req, res, next) {
  try {
    const citas =
      req.usuario.rol === 'administrador'
        ? await citaModel.listarPorSede(req.usuario.sedeId)
        : await citaModel.listarPorMedico(req.usuario.id);

    return res.status(200).json({ citas });
  } catch (error) {
    next(error);
  }
}

module.exports = { listarMedicos, actualizarServiciosDeMedico, listarCitas };
