// controllers/cita.controller.js
// RF-06 (agendar), RF-07 (disponibilidad), RF-08 (reprogramar),
// RF-09 (cancelar). Todo el modulo es exclusivo del rol cliente
// (ver cita.routes.js): son las historias de usuario HU-05 a HU-08.
//
// El agendamiento pide sede + servicio + franja + medico: la
// disponibilidad de una franja depende de que al menos un medico que
// preste ese servicio en esa sede este libre; el cliente elige despues
// el medico especifico entre los libres en la franja escogida.

const citaModel = require('../models/cita.model');
const sedeModel = require('../models/sede.model');
const servicioModel = require('../models/servicio.model');
const medicoModel = require('../models/medico.model');
const usuarioModel = require('../models/usuario.model');
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

function esFranjaValida(fecha) {
  const franjasValidas = generarFranjasDelDia(fecha).map((franja) => franja.getTime());
  return franjasValidas.includes(fecha.getTime());
}

// GET /api/citas/disponibilidad?sedeId=...&servicioId=...&fecha=YYYY-MM-DD
async function consultarDisponibilidad(req, res, next) {
  try {
    const { sedeId, servicioId, fecha } = req.query;
    if (!sedeId || !servicioId || !fecha) {
      return res.status(400).json({ mensaje: 'sedeId, servicioId y fecha son obligatorios.' });
    }

    const [sede, servicio] = await Promise.all([
      sedeModel.buscarPorId(sedeId),
      servicioModel.buscarPorId(servicioId),
    ]);
    if (!sede) return res.status(404).json({ mensaje: 'La sede indicada no existe.' });
    if (!servicio) return res.status(404).json({ mensaje: 'El servicio indicado no existe.' });

    const [anio, mes, dia] = fecha.split('-').map(Number);
    const fechaConsultada = new Date(anio, (mes || 1) - 1, dia || 1);
    if (!anio || !mes || !dia || Number.isNaN(fechaConsultada.getTime())) {
      return res.status(400).json({ mensaje: 'La fecha debe tener el formato YYYY-MM-DD.' });
    }

    const medicos = await medicoModel.listarPorSedeYServicio(sedeId, servicioId);
    const franjas = generarFranjasDelDia(fechaConsultada);

    if (medicos.length === 0) {
      return res.status(200).json({
        fecha,
        sedeId,
        servicioId,
        duracionMinutos: DURACION_SLOT_MINUTOS,
        medicosDisponiblesEnSede: 0,
        franjas: franjas.map((franja) => ({ horaInicio: franja.toISOString(), disponible: false })),
      });
    }

    const { inicio, fin } = limitesDelDia(fechaConsultada);
    const ocupadas = await medicoModel.listarFranjasOcupadas(
      medicos.map((medico) => medico.id),
      inicio,
      fin
    );

    const ocupadosPorFranja = new Map();
    ocupadas.forEach((fila) => {
      const clave = new Date(fila.fecha_hora).getTime();
      if (!ocupadosPorFranja.has(clave)) ocupadosPorFranja.set(clave, new Set());
      ocupadosPorFranja.get(clave).add(fila.medico_id);
    });

    const ahora = new Date();
    const disponibilidad = franjas.map((franja) => {
      const ocupados = ocupadosPorFranja.get(franja.getTime())?.size || 0;
      return {
        horaInicio: franja.toISOString(),
        disponible: franja > ahora && ocupados < medicos.length,
      };
    });

    return res.status(200).json({
      fecha,
      sedeId,
      servicioId,
      duracionMinutos: DURACION_SLOT_MINUTOS,
      medicosDisponiblesEnSede: medicos.length,
      franjas: disponibilidad,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/citas/medicos-disponibles?sedeId=...&servicioId=...&fechaHora=ISO
async function consultarMedicosDisponibles(req, res, next) {
  try {
    const { sedeId, servicioId, fechaHora } = req.query;
    if (!sedeId || !servicioId || !fechaHora) {
      return res.status(400).json({ mensaje: 'sedeId, servicioId y fechaHora son obligatorios.' });
    }

    const fecha = parsearFechaISO(fechaHora);
    if (!fecha) {
      return res.status(400).json({ mensaje: 'fechaHora no es una fecha válida.' });
    }

    const medicos = await medicoModel.listarPorSedeYServicio(sedeId, servicioId);
    if (medicos.length === 0) {
      return res.status(200).json({ medicos: [] });
    }

    const finExclusivo = new Date(fecha.getTime() + 1000);
    const ocupadas = await medicoModel.listarFranjasOcupadas(
      medicos.map((medico) => medico.id),
      fecha,
      finExclusivo
    );
    const ocupadosIds = new Set(ocupadas.map((fila) => fila.medico_id));

    const disponibles = medicos
      .filter((medico) => !ocupadosIds.has(medico.id))
      .map((medico) => ({ id: medico.id, nombreCompleto: medico.nombre_completo }));

    return res.status(200).json({ medicos: disponibles });
  } catch (error) {
    next(error);
  }
}

// POST /api/citas
async function crear(req, res, next) {
  try {
    const { sedeId, servicioId, medicoId, fechaHora, nombreMascota, motivo } = req.body;
    if (!sedeId || !servicioId || !medicoId || !fechaHora || !nombreMascota) {
      return res.status(400).json({
        mensaje: 'sedeId, servicioId, medicoId, fechaHora y nombreMascota son obligatorios.',
      });
    }

    const [sede, servicio, medico] = await Promise.all([
      sedeModel.buscarPorId(sedeId),
      servicioModel.buscarPorId(servicioId),
      usuarioModel.buscarPorId(medicoId),
    ]);
    if (!sede) return res.status(404).json({ mensaje: 'La sede indicada no existe.' });
    if (!servicio) return res.status(404).json({ mensaje: 'El servicio indicado no existe.' });
    if (!medico || medico.rol !== 'veterinario' || medico.sede_id !== sedeId) {
      return res.status(404).json({ mensaje: 'El médico indicado no existe en esa sede.' });
    }

    const ofrece = await medicoModel.ofreceServicio(medicoId, servicioId);
    if (!ofrece) {
      return res.status(400).json({ mensaje: 'Ese médico no presta el servicio seleccionado.' });
    }

    const fecha = parsearFechaISO(fechaHora);
    if (!fecha) {
      return res.status(400).json({ mensaje: 'fechaHora no es una fecha válida.' });
    }
    if (fecha <= new Date()) {
      return res.status(409).json({ mensaje: 'No se puede agendar una fecha en el pasado.' });
    }
    if (!esFranjaValida(fecha)) {
      return res.status(409).json({ mensaje: 'La hora seleccionada no coincide con una franja de atención válida.' });
    }

    const ocupado = await citaModel.existeConflicto(medicoId, fecha);
    if (ocupado) {
      return res.status(409).json({ mensaje: 'Ese médico ya tiene una cita en esa franja. Elige otra.' });
    }

    const cita = await citaModel.crear({
      clienteId: req.usuario.id,
      sedeId,
      servicioId,
      medicoId,
      fechaHora: fecha,
      nombreMascota,
      motivo,
    });

    return res.status(201).json({ cita });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ese médico ya tiene una cita en esa franja. Elige otra.' });
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
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada.' });
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
    if (fecha <= new Date()) {
      return res.status(409).json({ mensaje: 'No se puede reprogramar a una fecha en el pasado.' });
    }
    if (!esFranjaValida(fecha)) {
      return res.status(409).json({ mensaje: 'La hora seleccionada no coincide con una franja de atención válida.' });
    }

    const esLaMismaFranjaActual = new Date(cita.fecha_hora).getTime() === fecha.getTime();
    if (!esLaMismaFranjaActual) {
      const ocupado = await citaModel.existeConflicto(cita.medico_id, fecha);
      if (ocupado) {
        return res.status(409).json({ mensaje: 'El médico ya tiene una cita en esa franja. Elige otra.' });
      }
    }

    const actualizada = await citaModel.reprogramar(id, fecha);
    return res.status(200).json({ cita: actualizada });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'El médico ya tiene una cita en esa franja. Elige otra.' });
    }
    next(error);
  }
}

// PATCH /api/citas/:id/cancelar
async function cancelarCita(req, res, next) {
  try {
    const { id } = req.params;

    const cita = await citaModel.buscarPorId(id);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada.' });
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

module.exports = {
  consultarDisponibilidad,
  consultarMedicosDisponibles,
  crear,
  misCitas,
  reprogramarCita,
  cancelarCita,
};
