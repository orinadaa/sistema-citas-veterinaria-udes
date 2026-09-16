// controllers/horario.controller.js
// RF-13: horario de atencion por sede. Lectura publica (la landing y el
// formulario de citas lo necesitan sin autenticacion); escritura
// exclusiva del administrador.
const horarioModel = require('../models/horario.model');
const sedeModel = require('../models/sede.model');

const DIA_VALIDO = (dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6;

// GET /api/horarios?sedeId=...
async function listar(req, res, next) {
  try {
    const { sedeId } = req.query;
    if (!sedeId) {
      return res.status(400).json({ mensaje: 'sedeId es obligatorio.' });
    }
    const sede = await sedeModel.buscarPorId(sedeId);
    if (!sede) {
      return res.status(404).json({ mensaje: 'La sede indicada no existe.' });
    }

    const horario = await horarioModel.listarPorSede(sedeId);
    return res.status(200).json({ sedeId, horario });
  } catch (error) {
    next(error);
  }
}

// PUT /api/horarios (solo administrador)
async function actualizarDia(req, res, next) {
  try {
    const { sedeId, diaSemana, horaInicio, horaFin } = req.body;
    if (!sedeId || diaSemana === undefined || !horaInicio || !horaFin) {
      return res.status(400).json({ mensaje: 'sedeId, diaSemana, horaInicio y horaFin son obligatorios.' });
    }
    if (!DIA_VALIDO(diaSemana)) {
      return res.status(400).json({ mensaje: 'diaSemana debe ser un número entre 0 (domingo) y 6 (sábado).' });
    }
    if (horaInicio >= horaFin) {
      return res.status(400).json({ mensaje: 'La hora de inicio debe ser anterior a la hora de fin.' });
    }

    const sede = await sedeModel.buscarPorId(sedeId);
    if (!sede) {
      return res.status(404).json({ mensaje: 'La sede indicada no existe.' });
    }

    const dia = await horarioModel.upsertDia(sedeId, diaSemana, horaInicio, horaFin);
    return res.status(200).json({ dia });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/horarios/:sedeId/:diaSemana (solo administrador) — cierra ese día
async function cerrarDia(req, res, next) {
  try {
    const { sedeId, diaSemana } = req.params;
    const dia = Number(diaSemana);
    if (!DIA_VALIDO(dia)) {
      return res.status(400).json({ mensaje: 'diaSemana debe ser un número entre 0 (domingo) y 6 (sábado).' });
    }

    await horarioModel.cerrarDia(sedeId, dia);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, actualizarDia, cerrarDia };
