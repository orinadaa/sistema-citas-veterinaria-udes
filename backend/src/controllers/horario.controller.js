// controllers/horario.controller.js
// RF-13: horario de atencion por sede. Lectura publica (la landing y el
// formulario de citas lo necesitan sin autenticacion); escritura
// exclusiva del administrador.
const horarioModel = require('../models/horario.model');
const sedeModel = require('../models/sede.model');
const { esHora, aMinutos } = require('../utils/validacion');

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

// El administrador de sede solo cambia el horario de SU sede; el
// superadministrador, el de cualquiera.
function puedeCambiarHorario(usuario, sedeId) {
  return usuario.rol === 'superadministrador' || usuario.sedeId === sedeId;
}
const MENSAJE_OTRA_SEDE = 'Solo puedes cambiar el horario de tu propia sede.';

// PUT /api/horarios (superadministrador, o administrador en su sede)
async function actualizarDia(req, res, next) {
  try {
    const { sedeId, diaSemana, horaInicio, horaFin } = req.body;
    if (!sedeId || diaSemana === undefined || !horaInicio || !horaFin) {
      return res.status(400).json({ mensaje: 'sedeId, diaSemana, horaInicio y horaFin son obligatorios.' });
    }
    if (!puedeCambiarHorario(req.usuario, sedeId)) {
      return res.status(403).json({ mensaje: MENSAJE_OTRA_SEDE });
    }
    if (!DIA_VALIDO(diaSemana)) {
      return res.status(400).json({ mensaje: 'diaSemana debe ser un número entre 0 (domingo) y 6 (sábado).' });
    }
    // Formato HH:MM y comparacion en minutos: como texto, "9:00" quedaria
    // despues de "17:00".
    if (!esHora(horaInicio) || !esHora(horaFin)) {
      return res.status(400).json({ mensaje: 'Las horas deben tener el formato HH:MM, por ejemplo 08:00.' });
    }
    if (aMinutos(horaInicio) >= aMinutos(horaFin)) {
      return res.status(400).json({ mensaje: 'La hora de inicio debe ser anterior a la hora de fin.' });
    }
    // Las citas van en franjas de 30 minutos: el horario empieza y termina en :00 o :30.
    if (aMinutos(horaInicio) % 30 !== 0 || aMinutos(horaFin) % 30 !== 0) {
      return res.status(400).json({ mensaje: 'El horario debe empezar y terminar en punto o a la media hora (por ejemplo 08:00 o 17:30).' });
    }

    const sede = await sedeModel.buscarPorId(sedeId);
    if (!sede) {
      return res.status(404).json({ mensaje: 'La sede indicada no existe.' });
    }

    const dia = await horarioModel.upsertDia(sedeId, diaSemana, horaInicio, horaFin);
    // Citas ya agendadas que quedaron fuera del horario nuevo: no se mueven
    // solas, se avisa para que la sede las reprograme.
    const citasAfectadas = await horarioModel.contarCitasFueraDeHorario(sedeId, diaSemana, horaInicio, horaFin);
    return res.status(200).json({ dia, citasAfectadas: citasAfectadas || 0 });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/horarios/:sedeId/:diaSemana (solo administrador) — cierra ese día
async function cerrarDia(req, res, next) {
  try {
    const { sedeId, diaSemana } = req.params;
    if (!puedeCambiarHorario(req.usuario, sedeId)) {
      return res.status(403).json({ mensaje: MENSAJE_OTRA_SEDE });
    }
    const dia = Number(diaSemana);
    if (!DIA_VALIDO(dia)) {
      return res.status(400).json({ mensaje: 'diaSemana debe ser un número entre 0 (domingo) y 6 (sábado).' });
    }

    await horarioModel.cerrarDia(sedeId, dia);
    const citasAfectadas = await horarioModel.contarCitasFueraDeHorario(sedeId, dia);
    return res.status(200).json({ citasAfectadas: citasAfectadas || 0 });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, actualizarDia, cerrarDia };
