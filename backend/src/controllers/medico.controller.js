// controllers/medico.controller.js
// Endpoints propios del panel del medico veterinario (/api/medico),
// siempre acotados al medico que inicio sesion (req.usuario.id).
const usuarioModel = require('../models/usuario.model');
const medicoModel = require('../models/medico.model');
const mascotaModel = require('../models/mascota.model');
const citaModel = require('../models/cita.model');
const pacienteMedicoModel = require('../models/pacienteMedico.model');
const recordatorioModel = require('../models/recordatorio.model');
const correoService = require('../services/correo.service');
const notificaciones = require('../services/notificaciones.service');

// Mismo umbral que "frecuente" en Pacientes del administrador.
const UMBRAL_FRECUENTE = 3;

// GET /api/medico/clientes?busqueda=... — buscar al dueño al agendar, solo
// entre los pacientes del medico. Minimo 2 caracteres.
async function buscarClientes(req, res, next) {
  try {
    const termino = String(req.query.busqueda || '').trim();
    if (termino.length < 2) {
      return res.status(200).json({ clientes: [] });
    }
    const clientes = await usuarioModel.buscarClientes(termino, req.usuario.id);
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

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const PATRON_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const formatoFechaRecordatorio = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// Verifica que la mascota exista, este activa y sea de un paciente de
// este medico. Devuelve la mascota o una respuesta de error ya enviada.
async function mascotaDePaciente(mascotaId, medicoId, res) {
  const mascota = mascotaId ? await mascotaModel.buscarPorId(mascotaId) : null;
  if (!mascota) {
    res.status(404).json({ mensaje: 'Mascota no encontrada.' });
    return null;
  }
  if (!(await pacienteMedicoModel.esPacienteDe(mascota.cliente_id, medicoId))) {
    res.status(403).json({ mensaje: 'Esta mascota no es de un paciente tuyo.' });
    return null;
  }
  return mascota;
}

// POST /api/medico/recordatorios — crea un recordatorio para la mascota
// de un paciente y avisa al dueño por correo (si el correo falla, el
// recordatorio igual queda guardado: correoEnviado=false).
async function crearRecordatorio(req, res, next) {
  try {
    const { tipo, titulo, descripcion, fecha, hora, mascotaId } = req.body;
    if (!recordatorioModel.TIPOS.includes(tipo)) {
      return res.status(400).json({ mensaje: 'Elige un tipo de recordatorio válido.' });
    }
    if (!titulo || !String(titulo).trim() || String(titulo).trim().length > 120) {
      return res.status(400).json({ mensaje: 'El título es obligatorio (máximo 120 caracteres).' });
    }
    if (descripcion && String(descripcion).length > 300) {
      return res.status(400).json({ mensaje: 'La descripción no puede superar los 300 caracteres.' });
    }
    if (!PATRON_FECHA.test(fecha || '') || !PATRON_HORA.test(hora || '')) {
      return res.status(400).json({ mensaje: 'La fecha (AAAA-MM-DD) y la hora (HH:MM) son obligatorias.' });
    }
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const [hh, mm] = hora.split(':').map(Number);
    const momento = new Date(anio, mes - 1, dia, hh, mm);
    if (Number.isNaN(momento.getTime()) || momento.getDate() !== dia) {
      return res.status(400).json({ mensaje: 'La fecha no es válida.' });
    }
    if (momento <= new Date()) {
      return res.status(400).json({ mensaje: 'El recordatorio debe ser para una fecha y hora futuras.' });
    }

    const mascota = await mascotaDePaciente(mascotaId, req.usuario.id, res);
    if (!mascota) return undefined;

    const recordatorio = await recordatorioModel.crear({
      tipo,
      titulo: String(titulo).trim(),
      descripcion: descripcion ? String(descripcion).trim() : null,
      fecha,
      hora,
      mascotaId: mascota.id,
      clienteId: mascota.cliente_id,
      medicoId: req.usuario.id,
    });

    let correoEnviado = true;
    try {
      const [cliente, medico] = await Promise.all([
        usuarioModel.buscarPorId(mascota.cliente_id),
        usuarioModel.buscarPorId(req.usuario.id),
      ]);
      await correoService.enviarRecordatorioCreado({
        correo: cliente.correo,
        nombreCliente: cliente.nombre_completo,
        nombreMascota: mascota.nombre,
        nombreMedico: medico.nombre_completo,
        tipo,
        titulo: recordatorio.titulo,
        descripcion: recordatorio.descripcion,
        fechaTexto: formatoFechaRecordatorio.format(momento),
        hora,
      });
    } catch (error) {
      correoEnviado = false;
      console.error('No se pudo enviar el correo del recordatorio:', error.message);
    }
    // Aviso en la campana del dueño (aunque el correo haya fallado).
    try {
      const medico = await usuarioModel.buscarPorId(req.usuario.id);
      await notificaciones.recordatorioDelMedico({
        clienteId: mascota.cliente_id,
        nombreMascota: mascota.nombre,
        nombreMedico: medico?.nombre_completo ?? 'Tu médico veterinario',
        titulo: recordatorio.titulo,
        fechaTexto: formatoFechaRecordatorio.format(momento),
        hora,
      });
    } catch (error) {
      console.error('No se pudo crear la notificación del recordatorio:', error.message);
    }

    return res.status(201).json({ recordatorio, correoEnviado });
  } catch (error) {
    next(error);
  }
}

// GET /api/medico/recordatorios?mascotaId=... — recordatorios de una
// mascota de sus pacientes.
async function listarRecordatorios(req, res, next) {
  try {
    const mascota = await mascotaDePaciente(req.query.mascotaId, req.usuario.id, res);
    if (!mascota) return undefined;
    const recordatorios = await recordatorioModel.listarPorMascota(mascota.id);
    return res.status(200).json({ recordatorios });
  } catch (error) {
    next(error);
  }
}

module.exports = { buscarClientes, misServicios, misPacientes, detallePaciente, crearRecordatorio, listarRecordatorios };
