// controllers/cita.controller.js
// RF-06 (agendar), RF-07 (disponibilidad), RF-08 (reprogramar),
// RF-09 (cancelar). Todo el modulo es exclusivo del rol cliente
// (ver cita.routes.js): son las historias de usuario HU-05 a HU-08.

const citaModel = require('../models/cita.model');
const sedeModel = require('../models/sede.model');
const { generarFranjasDelDia, DURACION_SLOT_MINUTOS } = require('../config/horarioAtencion');

function limitesDelDia(fecha) {
  const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const fin = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1);
  return { inicio, fin };
}

function parsearFechaISO(valor) {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

// Valida que `fecha` sea una franja real del horario de atencion y que
// no este ya ocupada en `sedeId`. Devuelve un mensaje de error o null.
async function validarFranjaDisponible(sedeId, fecha) {
  if (fecha <= new Date()) {
    return 'No se puede agendar una fecha en el pasado.';
  }

  const franjasValidas = generarFranjasDelDia(fecha).map((franja) => franja.getTime());
  if (!franjasValidas.includes(fecha.getTime())) {
    return 'La hora seleccionada no coincide con una franja de atención válida.';
  }

  const { inicio, fin } = limitesDelDia(fecha);
  const ocupadas = await citaModel.listarFranjasOcupadas(sedeId, inicio, fin);
  const yaOcupada = ocupadas.some((franja) => franja.getTime() === fecha.getTime());
  if (yaOcupada) {
    return 'Esa franja ya fue reservada. Elige otro horario.';
  }

  return null;
}

// GET /api/citas/disponibilidad?sedeId=...&fecha=YYYY-MM-DD
async function consultarDisponibilidad(req, res, next) {
  try {
    const { sedeId, fecha } = req.query;
    if (!sedeId || !fecha) {
      return res.status(400).json({ mensaje: 'sedeId y fecha son obligatorios.' });
    }

    const sede = await sedeModel.buscarPorId(sedeId);
    if (!sede) {
      return res.status(404).json({ mensaje: 'La sede indicada no existe.' });
    }

    const [anio, mes, dia] = fecha.split('-').map(Number);
    const fechaConsultada = new Date(anio, (mes || 1) - 1, dia || 1);
    if (!anio || !mes || !dia || Number.isNaN(fechaConsultada.getTime())) {
      return res.status(400).json({ mensaje: 'La fecha debe tener el formato YYYY-MM-DD.' });
    }

    const franjas = generarFranjasDelDia(fechaConsultada);
    const { inicio, fin } = limitesDelDia(fechaConsultada);
    const ocupadas = await citaModel.listarFranjasOcupadas(sedeId, inicio, fin);
    const ocupadasEnMs = new Set(ocupadas.map((franja) => franja.getTime()));
    const ahora = new Date();

    const disponibilidad = franjas.map((franja) => ({
      horaInicio: franja.toISOString(),
      disponible: franja > ahora && !ocupadasEnMs.has(franja.getTime()),
    }));

    return res.status(200).json({ fecha, sedeId, duracionMinutos: DURACION_SLOT_MINUTOS, franjas: disponibilidad });
  } catch (error) {
    next(error);
  }
}

// POST /api/citas
async function crear(req, res, next) {
  try {
    const { sedeId, fechaHora, nombreMascota, motivo } = req.body;
    if (!sedeId || !fechaHora || !nombreMascota) {
      return res.status(400).json({ mensaje: 'sedeId, fechaHora y nombreMascota son obligatorios.' });
    }

    const sede = await sedeModel.buscarPorId(sedeId);
    if (!sede) {
      return res.status(404).json({ mensaje: 'La sede indicada no existe.' });
    }

    const fecha = parsearFechaISO(fechaHora);
    if (!fecha) {
      return res.status(400).json({ mensaje: 'fechaHora no es una fecha válida.' });
    }

    const errorFranja = await validarFranjaDisponible(sedeId, fecha);
    if (errorFranja) {
      return res.status(409).json({ mensaje: errorFranja });
    }

    const cita = await citaModel.crear({
      clienteId: req.usuario.id,
      sedeId,
      fechaHora: fecha,
      nombreMascota,
      motivo,
    });

    return res.status(201).json({ cita });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Esa franja ya fue reservada. Elige otro horario.' });
    }
    next(error);
  }
}

// GET /api/citas/mias
async function misCitas(req, res, next) {
  try {
    const citas = await citaModel.listarPorCliente(req.usuario.id);
    return res.status(200).json({ citas });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/citas/:id/reprogramar
async function reprogramarCita(req, res, next) {
  try {
    const { id } = req.params;
    const { nuevaFechaHora } = req.body;
    if (!nuevaFechaHora) {
      return res.status(400).json({ mensaje: 'nuevaFechaHora es obligatoria.' });
    }

    const cita = await citaModel.buscarPorId(id);
    if (!cita) {
      return res.status(404).json({ mensaje: 'Cita no encontrada.' });
    }
    if (cita.cliente_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes modificar una cita que no es tuya.' });
    }
    if (cita.estado !== 'agendada') {
      return res.status(400).json({ mensaje: 'Solo se pueden reprogramar citas activas.' });
    }

    const fecha = parsearFechaISO(nuevaFechaHora);
    if (!fecha) {
      return res.status(400).json({ mensaje: 'nuevaFechaHora no es una fecha válida.' });
    }

    const errorFranja = await validarFranjaDisponible(cita.sede_id, fecha);
    if (errorFranja) {
      return res.status(409).json({ mensaje: errorFranja });
    }

    const actualizada = await citaModel.reprogramar(id, fecha);
    return res.status(200).json({ cita: actualizada });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Esa franja ya fue reservada. Elige otro horario.' });
    }
    next(error);
  }
}

// PATCH /api/citas/:id/cancelar
async function cancelarCita(req, res, next) {
  try {
    const { id } = req.params;

    const cita = await citaModel.buscarPorId(id);
    if (!cita) {
      return res.status(404).json({ mensaje: 'Cita no encontrada.' });
    }
    if (cita.cliente_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes cancelar una cita que no es tuya.' });
    }
    if (cita.estado !== 'agendada') {
      return res.status(400).json({ mensaje: 'La cita ya está cancelada.' });
    }

    const actualizada = await citaModel.cancelar(id);
    return res.status(200).json({ cita: actualizada });
  } catch (error) {
    next(error);
  }
}

module.exports = { consultarDisponibilidad, crear, misCitas, reprogramarCita, cancelarCita };
