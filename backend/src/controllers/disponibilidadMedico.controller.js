// controllers/disponibilidadMedico.controller.js
// "Mi perfil > Disponibilidad" del medico (opcion A aprobada por la
// usuaria): horario semanal propio por sede (con pausa opcional) y
// bloqueos (vacaciones, permisos, excepciones por horas). Sin horario
// propio, el medico sigue atendiendo en su sede con el horario de la
// sede. El horario propio siempre debe caber dentro del horario de
// atencion de la sede elegida ese dia.
const disponibilidadModel = require('../models/disponibilidadMedico.model');
const sedeModel = require('../models/sede.model');
const horarioModel = require('../models/horario.model');
const usuarioModel = require('../models/usuario.model');
const { aMinutos, fechaLocalISO } = require('../utils/disponibilidadMedico');

const PATRON_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/medico/disponibilidad
async function obtenerDisponibilidad(req, res, next) {
  try {
    const [horario, bloqueos, sedes, medico] = await Promise.all([
      disponibilidadModel.listarHorario(req.usuario.id),
      disponibilidadModel.listarBloqueos(req.usuario.id),
      sedeModel.listarTodas(),
      usuarioModel.buscarPorId(req.usuario.id),
    ]);
    // Horario de atencion de cada sede: limita lo que el medico puede elegir.
    const sedesConHorario = await Promise.all(
      sedes.map(async (s) => ({ id: s.id, nombre: s.nombre, ciudad: s.ciudad, horario: await horarioModel.listarPorSede(s.id) }))
    );
    return res.status(200).json({ horario, bloqueos, sedes: sedesConHorario, sedePrincipalId: medico.sede_id });
  } catch (error) {
    next(error);
  }
}

// PUT /api/medico/disponibilidad/horario — { dias: [{ diaSemana, sedeId,
// horaInicio, horaFin, pausaInicio?, pausaFin? }] }. Lista vacia = volver
// a usar el horario de la sede.
async function guardarHorario(req, res, next) {
  try {
    const { dias } = req.body;
    if (!Array.isArray(dias) || dias.length > 7) {
      return res.status(400).json({ mensaje: 'Envía la lista de días de tu horario.' });
    }
    const vistos = new Set();
    for (const d of dias) {
      const nombreDia = `el día ${d.diaSemana}`;
      if (!Number.isInteger(d.diaSemana) || d.diaSemana < 0 || d.diaSemana > 6 || vistos.has(d.diaSemana)) {
        return res.status(400).json({ mensaje: 'Cada día de la semana puede aparecer una sola vez.' });
      }
      vistos.add(d.diaSemana);
      if (!PATRON_HORA.test(d.horaInicio || '') || !PATRON_HORA.test(d.horaFin || '') || aMinutos(d.horaInicio) >= aMinutos(d.horaFin)) {
        return res.status(400).json({ mensaje: `Revisa las horas de ${nombreDia}: el inicio debe ser antes del fin.` });
      }
      const hayPausa = Boolean(d.pausaInicio || d.pausaFin);
      if (hayPausa) {
        const valida =
          PATRON_HORA.test(d.pausaInicio || '') &&
          PATRON_HORA.test(d.pausaFin || '') &&
          aMinutos(d.pausaInicio) < aMinutos(d.pausaFin) &&
          aMinutos(d.pausaInicio) >= aMinutos(d.horaInicio) &&
          aMinutos(d.pausaFin) <= aMinutos(d.horaFin);
        if (!valida) {
          return res.status(400).json({ mensaje: `La pausa de ${nombreDia} debe quedar dentro de tu horario.` });
        }
      }
      const sede = d.sedeId ? await sedeModel.buscarPorId(d.sedeId) : null;
      if (!sede || !sede.activo) {
        return res.status(400).json({ mensaje: 'Elige una sede activa para cada día.' });
      }
      const atencion = await horarioModel.buscarDia(d.sedeId, d.diaSemana);
      if (!atencion) {
        return res.status(400).json({ mensaje: `${sede.nombre} no atiende ese día.` });
      }
      if (aMinutos(d.horaInicio) < aMinutos(atencion.hora_inicio) || aMinutos(d.horaFin) > aMinutos(atencion.hora_fin)) {
        return res.status(400).json({
          mensaje: `Tu horario debe estar dentro del horario de ${sede.nombre} (${atencion.hora_inicio.slice(0, 5)} – ${atencion.hora_fin.slice(0, 5)}).`,
        });
      }
    }

    await disponibilidadModel.reemplazarHorario(req.usuario.id, dias);
    const horario = await disponibilidadModel.listarHorario(req.usuario.id);
    return res.status(200).json({ horario });
  } catch (error) {
    next(error);
  }
}

// POST /api/medico/disponibilidad/bloqueos — { fechaInicio, fechaFin,
// horaInicio?, horaFin?, motivo? }. Avisa cuantas citas ya agendadas
// quedan dentro del bloqueo (no se cancelan solas).
async function crearBloqueo(req, res, next) {
  try {
    const { fechaInicio, fechaFin, horaInicio, horaFin, motivo } = req.body;
    if (!PATRON_FECHA.test(fechaInicio || '') || !PATRON_FECHA.test(fechaFin || '') || fechaInicio > fechaFin) {
      return res.status(400).json({ mensaje: 'Revisa las fechas: la de inicio debe ser igual o anterior a la final.' });
    }
    if (fechaFin < fechaLocalISO(new Date())) {
      return res.status(400).json({ mensaje: 'El bloqueo debe incluir hoy o fechas futuras.' });
    }
    const conHoras = Boolean(horaInicio || horaFin);
    if (conHoras && (!PATRON_HORA.test(horaInicio || '') || !PATRON_HORA.test(horaFin || '') || aMinutos(horaInicio) >= aMinutos(horaFin))) {
      return res.status(400).json({ mensaje: 'Revisa las horas del bloqueo: el inicio debe ser antes del fin.' });
    }
    if (motivo && String(motivo).length > 150) {
      return res.status(400).json({ mensaje: 'El motivo no puede superar los 150 caracteres.' });
    }

    const bloqueo = await disponibilidadModel.crearBloqueo(req.usuario.id, {
      fechaInicio,
      fechaFin,
      horaInicio: conHoras ? horaInicio : null,
      horaFin: conHoras ? horaFin : null,
      motivo: motivo ? String(motivo).trim() : null,
    });
    const citasAfectadas = await disponibilidadModel.contarCitasEnRango(req.usuario.id, fechaInicio, fechaFin);
    return res.status(201).json({ bloqueo, citasAfectadas });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/medico/disponibilidad/bloqueos/:id — solo los propios.
async function eliminarBloqueo(req, res, next) {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return res.status(404).json({ mensaje: 'Bloqueo no encontrado.' });
    const eliminado = await disponibilidadModel.eliminarBloqueo(req.usuario.id, req.params.id);
    if (!eliminado) return res.status(404).json({ mensaje: 'Bloqueo no encontrado.' });
    return res.status(200).json({ mensaje: 'Bloqueo eliminado.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerDisponibilidad, guardarHorario, crearBloqueo, eliminarBloqueo };
