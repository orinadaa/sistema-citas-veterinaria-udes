// controllers/administracion.controller.js
// RF-10 (agenda por sede), RF-12 (seguimiento de citas). Los medicos y
// sus especialidades tambien se administran aqui (parte de RF-11).
const bcrypt = require('bcryptjs');
const medicoModel = require('../models/medico.model');
const servicioModel = require('../models/servicio.model');
const categoriaServicioModel = require('../models/categoriaServicio.model');
const citaModel = require('../models/cita.model');
const usuarioModel = require('../models/usuario.model');

const RONDAS_SAL = 10;

// GET /api/administracion/medicos — solo administrador, de su propia sede
async function listarMedicos(req, res, next) {
  try {
    const medicos = await medicoModel.listarConServicios(req.usuario.sedeId);
    return res.status(200).json({ medicos });
  } catch (error) {
    next(error);
  }
}

// POST /api/administracion/medicos — solo administrador, crea un medico
// en su propia sede (no se puede elegir otra sede desde este panel).
async function crearMedico(req, res, next) {
  try {
    const { nombreCompleto, correo, contrasena, documento, telefono } = req.body;

    if (!nombreCompleto || !correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Nombre completo, correo y contraseña son obligatorios.' });
    }
    if (contrasena.length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, RONDAS_SAL);
    const medicoId = await medicoModel.crear({
      nombreCompleto,
      correo,
      contrasenaHash,
      documento,
      telefono,
      sedeId: req.usuario.sedeId,
    });

    const medicos = await medicoModel.listarConServicios(req.usuario.sedeId);
    return res.status(201).json({ medico: medicos.find((m) => m.id === medicoId) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ya existe una cuenta registrada con este correo.' });
    }
    next(error);
  }
}

// PUT /api/administracion/medicos/:id — solo administrador, de su sede
async function actualizarMedico(req, res, next) {
  try {
    const { id } = req.params;
    const { nombreCompleto, telefono, documento, fotoUrl, biografia, activo } = req.body;

    const medico = await usuarioModel.buscarPorId(id);
    if (!medico || medico.rol !== 'veterinario') {
      return res.status(404).json({ mensaje: 'Médico no encontrado.' });
    }
    if (medico.sede_id !== req.usuario.sedeId) {
      return res.status(403).json({ mensaje: 'Solo puedes administrar médicos de tu propia sede.' });
    }

    await medicoModel.actualizar(id, { nombreCompleto, telefono, documento, fotoUrl, biografia, activo });
    const medicos = await medicoModel.listarConServicios(req.usuario.sedeId);
    return res.status(200).json({ medico: medicos.find((m) => m.id === id) });
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

// PUT /api/administracion/medicos/:id/especialidades — solo administrador
async function actualizarEspecialidadesDeMedico(req, res, next) {
  try {
    const { id } = req.params;
    const { categoriaIds } = req.body;

    if (!Array.isArray(categoriaIds)) {
      return res.status(400).json({ mensaje: 'categoriaIds debe ser una lista de ids de categoría.' });
    }

    const medico = await usuarioModel.buscarPorId(id);
    if (!medico || medico.rol !== 'veterinario') {
      return res.status(404).json({ mensaje: 'Médico no encontrado.' });
    }
    if (medico.sede_id !== req.usuario.sedeId) {
      return res.status(403).json({ mensaje: 'Solo puedes administrar médicos de tu propia sede.' });
    }

    for (const categoriaId of categoriaIds) {
      if (!(await categoriaServicioModel.existe(categoriaId))) {
        return res.status(400).json({ mensaje: `La categoría ${categoriaId} no existe.` });
      }
    }

    await medicoModel.reemplazarEspecialidades(id, categoriaIds);
    const medicosActualizados = await medicoModel.listarConServicios(req.usuario.sedeId);
    return res.status(200).json({ medico: medicosActualizados.find((m) => m.id === id) });
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

module.exports = {
  listarMedicos,
  crearMedico,
  actualizarMedico,
  actualizarServiciosDeMedico,
  actualizarEspecialidadesDeMedico,
  listarCitas,
};
