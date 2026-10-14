// controllers/disponibilidadMedico.controller.js
// Horario de trabajo del medico: horario semanal (con pausa opcional) y
// bloqueos (vacaciones, permisos, excepciones por horas).
const disponibilidadModel = require('../models/disponibilidadMedico.model');
const sedeModel = require('../models/sede.model');
const horarioModel = require('../models/horario.model');
const usuarioModel = require('../models/usuario.model');
const notificaciones = require('../services/notificaciones.service');
const { aMinutos, fechaLocalISO } = require('../utils/disponibilidadMedico');

const PATRON_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Medico de la sede del administrador (rutas /administracion/medicos/:id/...).
// Responde 404/403 y devuelve null si no corresponde.
async function medicoDeLaSede(req, res) {
  const medico = await usuarioModel.buscarPorId(req.params.id);
  if (!medico || medico.rol !== 'veterinario') {
    res.status(404).json({ mensaje: 'Médico no encontrado.' });
    return null;
  }
  if (medico.sede_id !== req.usuario.sedeId) {
    res.status(403).json({ mensaje: 'Solo puedes administrar médicos de tu propia sede.' });
    return null;
  }
  return medico;
}

async function leerDisponibilidad(medicoId, sedePrincipalId) {
  const [horario, bloqueos, sedes] = await Promise.all([
    disponibilidadModel.listarHorario(medicoId),
    disponibilidadModel.listarBloqueos(medicoId),
    sedeModel.listarTodas(),
  ]);
  // Horario de atencion de cada sede: limita lo que se puede asignar.
  const sedesConHorario = await Promise.all(
    sedes.map(async (s) => ({ id: s.id, nombre: s.nombre, ciudad: s.ciudad, horario: await horarioModel.listarPorSede(s.id) }))
  );
  return { horario, bloqueos, sedes: sedesConHorario, sedePrincipalId };
}

// GET /api/medico/disponibilidad — el medico consulta su horario (solo lectura).
async function obtenerDisponibilidad(req, res, next) {
  try {
    const medico = await usuarioModel.buscarPorId(req.usuario.id);
    return res.status(200).json(await leerDisponibilidad(req.usuario.id, medico.sede_id));
  } catch (error) {
    next(error);
  }
}

// GET /api/administracion/medicos/:id/disponibilidad
async function obtenerDisponibilidadDeMedico(req, res, next) {
  try {
    const medico = await medicoDeLaSede(req, res);
    if (!medico) return undefined;
    return res.status(200).json(await leerDisponibilidad(medico.id, medico.sede_id));
  } catch (error) {
    next(error);
  }
}

// PUT /api/administracion/medicos/:id/disponibilidad/horario — { dias: [{
// diaSemana, horaInicio, horaFin, pausaInicio?, pausaFin? }] }. Lista vacia
// = volver a usar el horario de la sede. La sede de cada dia es siempre la
// del administrador (se ignora cualquier otra que llegue).
async function guardarHorarioDeMedico(req, res, next) {
  try {
    const medico = await medicoDeLaSede(req, res);
    if (!medico) return undefined;
    if (!Array.isArray(req.body.dias) || req.body.dias.length > 7) {
      return res.status(400).json({ mensaje: 'Envía la lista de días del horario.' });
    }
    const sedeId = req.usuario.sedeId;
    const dias = req.body.dias.map((d) => ({ ...d, sedeId }));
    const sede = await sedeModel.buscarPorId(sedeId);
    if (!sede || !sede.activo) {
      return res.status(400).json({ mensaje: 'La sede no está activa.' });
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
          return res.status(400).json({ mensaje: `La pausa de ${nombreDia} debe quedar dentro del horario de ese día.` });
        }
      }
      const atencion = await horarioModel.buscarDia(sedeId, d.diaSemana);
      if (!atencion) {
        return res.status(400).json({ mensaje: `${sede.nombre} no atiende ese día.` });
      }
      if (aMinutos(d.horaInicio) < aMinutos(atencion.hora_inicio) || aMinutos(d.horaFin) > aMinutos(atencion.hora_fin)) {
        return res.status(400).json({
          mensaje: `El horario debe estar dentro del horario de ${sede.nombre} (${atencion.hora_inicio.slice(0, 5)} – ${atencion.hora_fin.slice(0, 5)}).`,
        });
      }
    }

    await disponibilidadModel.reemplazarHorario(medico.id, dias);
    const horario = await disponibilidadModel.listarHorario(medico.id);
    notificaciones.horarioDelMedicoCambio(medico.id, 'Tu horario de trabajo cambió', 'El administrador de tu sede actualizó tu horario de trabajo.');
    return res.status(200).json({ horario });
  } catch (error) {
    next(error);
  }
}

// POST /api/administracion/medicos/:id/disponibilidad/bloqueos — {
// fechaInicio, fechaFin, horaInicio?, horaFin?, motivo? }. Avisa cuantas
// citas ya agendadas quedan dentro del bloqueo (no se cancelan solas).
async function crearBloqueoDeMedico(req, res, next) {
  try {
    const medico = await medicoDeLaSede(req, res);
    if (!medico) return undefined;
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

    const bloqueo = await disponibilidadModel.crearBloqueo(medico.id, {
      fechaInicio,
      fechaFin,
      horaInicio: conHoras ? horaInicio : null,
      horaFin: conHoras ? horaFin : null,
      motivo: motivo ? String(motivo).trim() : null,
    });
    const citasAfectadas = await disponibilidadModel.contarCitasEnRango(medico.id, fechaInicio, fechaFin);
    notificaciones.horarioDelMedicoCambio(medico.id, 'Nuevo bloqueo en tu agenda', 'El administrador de tu sede registró fechas en las que no atiendes.');
    return res.status(201).json({ bloqueo, citasAfectadas });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/administracion/medicos/:id/disponibilidad/bloqueos/:bloqueoId
// — solo bloqueos de ese medico.
async function eliminarBloqueoDeMedico(req, res, next) {
  try {
    const medico = await medicoDeLaSede(req, res);
    if (!medico) return undefined;
    if (!/^[0-9a-f-]{36}$/i.test(req.params.bloqueoId)) return res.status(404).json({ mensaje: 'Bloqueo no encontrado.' });
    const eliminado = await disponibilidadModel.eliminarBloqueo(medico.id, req.params.bloqueoId);
    if (!eliminado) return res.status(404).json({ mensaje: 'Bloqueo no encontrado.' });
    return res.status(200).json({ mensaje: 'Bloqueo eliminado.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  obtenerDisponibilidad,
  obtenerDisponibilidadDeMedico,
  guardarHorarioDeMedico,
  crearBloqueoDeMedico,
  eliminarBloqueoDeMedico,
};
