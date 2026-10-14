// controllers/cita.controller.js
// RF-06 (agendar), RF-07 (disponibilidad), RF-08 (reprogramar), RF-09
// (cancelar): historias de usuario HU-05 a HU-08.

const citaModel = require('../models/cita.model');
const sedeModel = require('../models/sede.model');
const servicioModel = require('../models/servicio.model');
const medicoModel = require('../models/medico.model');
const usuarioModel = require('../models/usuario.model');
const horarioModel = require('../models/horario.model');
const mascotaModel = require('../models/mascota.model');
const correoService = require('../services/correo.service');
const notificaciones = require('../services/notificaciones.service');
const { generarFranjasEntreHoras, franjasQueOcupa, DURACION_SLOT_MINUTOS } = require('../utils/franjas');
const { esFechaReal } = require('../utils/validacion');
const disponibilidadModel = require('../models/disponibilidadMedico.model');
const { medicoAtiende } = require('../utils/disponibilidadMedico');

// Un cliente no puede acumular mas citas por atender que estas (evita que
// una sola cuenta reserve toda la agenda). El personal de la clinica no
// tiene este tope al agendarle.
const MAXIMO_CITAS_FUTURAS_POR_CLIENTE = 10;

// Minutos que ocupa la cita segun su servicio (minimo una franja).
const duracionDe = (servicio) => Math.max(DURACION_SLOT_MINUTOS, Number(servicio?.duracion_minutos) || DURACION_SLOT_MINUTOS);

// true si el medico atiende durante TODA la cita (cada franja que ocupa)
// segun su horario propio y sus bloqueos (sin horario propio: siempre,
// dentro del horario de la sede).
async function medicoAtiendeEnFranja(medicoId, sedeId, fecha, duracionMinutos = DURACION_SLOT_MINUTOS) {
  const contexto = await disponibilidadModel.cargarContexto([medicoId], sedeId, fecha);
  return franjasQueOcupa(fecha, duracionMinutos).every((franja) => medicoAtiende(medicoId, franja, contexto));
}

// Citas ya agendadas -> en que franjas esta ocupado cada medico (una cita
// larga ocupa varias). Map<milisegundos, Set<medicoId>>.
function ocupacionPorFranja(ocupadas) {
  const mapa = new Map();
  ocupadas.forEach((fila) => {
    franjasQueOcupa(fila.fecha_hora, fila.duracion_minutos).forEach((franja) => {
      const clave = franja.getTime();
      if (!mapa.has(clave)) mapa.set(clave, new Set());
      mapa.get(clave).add(fila.medico_id);
    });
  });
  return mapa;
}

// true si el medico puede tomar una cita de esa duracion empezando en
// `inicio`: todas las franjas que ocuparia existen en el horario de la sede
// (la cita termina antes del cierre), el medico atiende en ellas y no tiene
// otra cita.
function medicoLibreDurante(medicoId, inicio, duracionMinutos, { franjasDeLaSede, ocupacion, contexto }) {
  return franjasQueOcupa(inicio, duracionMinutos).every((franja) => {
    const clave = franja.getTime();
    return franjasDeLaSede.has(clave) && !(ocupacion.get(clave) || new Set()).has(medicoId) && medicoAtiende(medicoId, franja, contexto);
  });
}

// Quien puede cancelar o reprogramar una cita: el cliente dueño, el
// administrador de la sede donde es la cita y el medico que la atiende.
function puedeGestionarCita(usuario, cita) {
  if (usuario.rol === 'cliente') return cita.cliente_id === usuario.id;
  if (usuario.rol === 'administrador') return cita.sede_id === usuario.sedeId;
  if (usuario.rol === 'veterinario') return cita.medico_id === usuario.id;
  return false;
}

function limitesDelDia(fecha) {
  const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const fin = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1);
  return { inicio, fin };
}

function parsearFechaISO(valor) {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

// RF-13: el horario de atencion es configurable por sede. Si la sede no
// tiene fila para ese dia de la semana, esta cerrada ese dia.
async function franjasDelDiaParaSede(sedeId, fecha) {
  const dia = await horarioModel.buscarDia(sedeId, fecha.getDay());
  if (!dia) return [];
  return generarFranjasEntreHoras(fecha, dia.hora_inicio, dia.hora_fin);
}

// La cita completa (todas las franjas que ocupa) debe caer dentro del
// horario de atencion: una cirugia de 90 minutos no empieza 30 minutos
// antes del cierre.
async function esFranjaValida(sedeId, fecha, duracionMinutos = DURACION_SLOT_MINUTOS) {
  const franjas = new Set((await franjasDelDiaParaSede(sedeId, fecha)).map((franja) => franja.getTime()));
  return franjasQueOcupa(fecha, duracionMinutos).every((franja) => franjas.has(franja.getTime()));
}

// GET /api/citas/disponibilidad?sedeId=...&servicioId=...&fecha=YYYY-MM-DD
// medicoId (opcional): restringe la disponibilidad a un solo medico, en
// vez del agregado de todos los que prestan ese servicio en esa sede.
// Se usa al reprogramar, donde el medico de la cita ya esta fijo.
async function consultarDisponibilidad(req, res, next) {
  try {
    const { sedeId, servicioId, fecha, medicoId } = req.query;
    if (!sedeId || !servicioId || !fecha) {
      return res.status(400).json({ mensaje: 'sedeId, servicioId y fecha son obligatorios.' });
    }

    const [sede, servicio] = await Promise.all([
      sedeModel.buscarPorId(sedeId),
      servicioModel.buscarPorId(servicioId),
    ]);
    if (!sede) return res.status(404).json({ mensaje: 'La sede indicada no existe.' });
    if (!servicio) return res.status(404).json({ mensaje: 'El servicio indicado no existe.' });

    // Fecha real: se rechazan dias que no existen, como un 31 de febrero.
    if (!esFechaReal(fecha)) {
      return res.status(400).json({ mensaje: 'La fecha debe ser un día que exista, con el formato YYYY-MM-DD.' });
    }
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const fechaConsultada = new Date(anio, mes - 1, dia);
    const duracion = duracionDe(servicio);

    let medicos;
    if (medicoId) {
      const medico = await usuarioModel.buscarPorId(medicoId);
      if (!medico || medico.rol !== 'veterinario' || !(await disponibilidadModel.atiendeEnSede(medicoId, sedeId))) {
        return res.status(404).json({ mensaje: 'El médico indicado no existe en esa sede.' });
      }
      const ofrece = await medicoModel.ofreceServicio(medicoId, servicioId);
      if (!ofrece) {
        return res.status(400).json({ mensaje: 'Ese médico no presta el servicio seleccionado.' });
      }
      medicos = [{ id: medicoId }];
    } else {
      medicos = await medicoModel.listarPorSedeYServicio(sedeId, servicioId, fechaConsultada.getDay());
    }
    // medicosEnSede: prestan el servicio en la sede algun dia (distingue
    // "el servicio no se presta aqui" de "nadie lo atiende este dia").
    const medicosEnSede = medicoId ? 1 : (await medicoModel.listarPorSedeYServicio(sedeId, servicioId)).length;

    const franjas = await franjasDelDiaParaSede(sedeId, fechaConsultada);

    if (medicos.length === 0) {
      return res.status(200).json({
        fecha,
        sedeId,
        servicioId,
        duracionMinutos: DURACION_SLOT_MINUTOS,
        duracionServicioMinutos: duracion,
        medicosEnSede,
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

    const ocupacion = ocupacionPorFranja(ocupadas);
    const franjasDeLaSede = new Set(franjas.map((franja) => franja.getTime()));

    // Una franja esta disponible si al menos un medico atiende en ella
    // (horario propio + bloqueos) y no tiene otra cita a esa hora.
    const contexto = await disponibilidadModel.cargarContexto(
      medicos.map((medico) => medico.id),
      sedeId,
      fechaConsultada
    );
    const ahora = new Date();
    const disponibilidad = franjas.map((franja) => ({
      horaInicio: franja.toISOString(),
      disponible:
        franja > ahora && medicos.some((medico) => medicoLibreDurante(medico.id, franja, duracion, { franjasDeLaSede, ocupacion, contexto })),
    }));

    return res.status(200).json({
      fecha,
      sedeId,
      servicioId,
      duracionMinutos: DURACION_SLOT_MINUTOS,
      duracionServicioMinutos: duracion,
      medicosEnSede,
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

    const servicio = await servicioModel.buscarPorId(servicioId);
    const disponibles = (await medicosLibresPara(sedeId, servicioId, fecha, duracionDe(servicio))).map((medico) => ({
      id: medico.id,
      nombreCompleto: medico.nombre_completo,
    }));

    return res.status(200).json({ medicos: disponibles });
  } catch (error) {
    next(error);
  }
}

// Asignacion automatica de medico en el agendamiento del cliente: entre los
// medicos activos de la sede que prestan el servicio y estan libres en
// esa franja, primero el que tenga menos citas activas ese dia;
// desempate por nombre para que el resultado sea estable/predecible.
// Medicos de la sede que prestan el servicio y pueden tomar una cita de
// esa duracion empezando en `fecha` (atienden y estan libres todo el rato).
async function medicosLibresPara(sedeId, servicioId, fecha, duracionMinutos) {
  const todos = await medicoModel.listarPorSedeYServicio(sedeId, servicioId, fecha.getDay());
  if (todos.length === 0) return [];
  const ids = todos.map((medico) => medico.id);
  const fin = new Date(fecha.getTime() + duracionMinutos * 60000);
  const [contexto, ocupadas, franjas] = await Promise.all([
    disponibilidadModel.cargarContexto(ids, sedeId, fecha),
    medicoModel.listarFranjasOcupadas(ids, fecha, fin),
    franjasDelDiaParaSede(sedeId, fecha),
  ]);
  const entorno = { franjasDeLaSede: new Set(franjas.map((franja) => franja.getTime())), ocupacion: ocupacionPorFranja(ocupadas), contexto };
  return todos.filter((medico) => medicoLibreDurante(medico.id, fecha, duracionMinutos, entorno));
}

async function candidatosParaFranja(sedeId, servicioId, fecha, duracionMinutos = DURACION_SLOT_MINUTOS) {
  const medicos = await medicosLibresPara(sedeId, servicioId, fecha, duracionMinutos);
  if (medicos.length === 0) return [];
  const ids = medicos.map((medico) => medico.id);

  const { inicio, fin } = limitesDelDia(fecha);
  const cargas = await medicoModel.contarCitasPorMedico(ids, inicio, fin);
  const cargaPorMedico = new Map(cargas.map((fila) => [fila.medico_id, fila.total]));

  return medicos
    .sort(
      (a, b) =>
        (cargaPorMedico.get(a.id) || 0) - (cargaPorMedico.get(b.id) || 0) ||
        a.nombre_completo.localeCompare(b.nombre_completo, 'es')
    )
    .map((medico) => medico.id);
}

// Envia el correo de confirmacion sin tumbar el agendamiento si el
// SMTP falla: la cita ya quedo creada, el cliente puede usar "Reenviar
// correo" desde la pantalla de confirmacion.
async function intentarEnviarConfirmacion(cita) {
  try {
    await correoService.enviarConfirmacionCita(cita);
    return true;
  } catch (error) {
    console.error(`No se pudo enviar la confirmacion de la cita ${cita.codigo}:`, error.message);
    return false;
  }
}

// POST /api/citas — el cliente agenda para si mismo; el administrador
// agenda en nombre de un cliente de su propia sede (calendario del
// panel administrativo) indicando clienteId explicitamente.
// medicoId es opcional: el flujo de agendamiento del cliente no tiene
// paso de medico, se asigna automaticamente (candidatosParaFranja). El
// calendario del administrador si lo sigue enviando explicito.
async function crear(req, res, next) {
  try {
    const esAdmin = req.usuario.rol === 'administrador';
    // El medico agenda a nombre de un cliente, en SU sede y con EL MISMO
    // como medico: no se aceptan otros valores.
    const esMedico = req.usuario.rol === 'veterinario';
    const agendaPersonal = esAdmin || esMedico;
    const { servicioId, fechaHora, mascotaId, motivo, clienteId: clienteIdBody } = req.body;
    const medicoId = esMedico ? req.usuario.id : req.body.medicoId;
    const sedeId = agendaPersonal ? req.usuario.sedeId : req.body.sedeId;

    if (!sedeId || !servicioId || !fechaHora || !mascotaId) {
      return res.status(400).json({
        mensaje: 'sedeId, servicioId, fechaHora y mascotaId son obligatorios.',
      });
    }
    if (motivo && String(motivo).length > 255) {
      return res.status(400).json({ mensaje: 'El motivo no puede superar los 255 caracteres.' });
    }

    let clienteId = req.usuario.id;
    if (agendaPersonal) {
      if (!clienteIdBody) {
        return res.status(400).json({ mensaje: 'clienteId es obligatorio al agendar a nombre de un cliente.' });
      }
      const cliente = await usuarioModel.buscarPorId(clienteIdBody);
      if (!cliente || cliente.rol !== 'cliente') {
        return res.status(404).json({ mensaje: 'El cliente indicado no existe.' });
      }
      if (cliente.activo === false) {
        return res.status(409).json({ mensaje: 'La cuenta de ese cliente está inactiva.' });
      }
      clienteId = clienteIdBody;
    }

    if (!(await mascotaModel.perteneceACliente(mascotaId, clienteId))) {
      return res.status(404).json({ mensaje: 'La mascota indicada no existe o no pertenece a ese cliente.' });
    }

    const [sede, servicio] = await Promise.all([sedeModel.buscarPorId(sedeId), servicioModel.buscarPorId(servicioId)]);
    if (!sede) return res.status(404).json({ mensaje: 'La sede indicada no existe.' });
    if (!servicio) return res.status(404).json({ mensaje: 'El servicio indicado no existe.' });
    // Sede o servicio desactivados no reciben citas nuevas.
    if (sede.activo === false) return res.status(409).json({ mensaje: 'Esa sede no está recibiendo citas.' });
    if (servicio.activo === false) return res.status(409).json({ mensaje: 'Ese servicio no está disponible.' });
    const duracion = duracionDe(servicio);

    if (medicoId) {
      const medico = await usuarioModel.buscarPorId(medicoId);
      if (!medico || medico.rol !== 'veterinario' || medico.activo === false || !(await disponibilidadModel.atiendeEnSede(medicoId, sedeId))) {
        return res.status(404).json({ mensaje: 'El médico indicado no existe en esa sede.' });
      }
      const ofrece = await medicoModel.ofreceServicio(medicoId, servicioId);
      if (!ofrece) {
        return res.status(400).json({ mensaje: 'Ese médico no presta el servicio seleccionado.' });
      }
    }

    const fecha = parsearFechaISO(fechaHora);
    if (!fecha) {
      return res.status(400).json({ mensaje: 'fechaHora no es una fecha válida.' });
    }
    if (fecha <= new Date()) {
      return res.status(409).json({ mensaje: 'No se puede agendar una fecha en el pasado.' });
    }
    if (!(await esFranjaValida(sedeId, fecha, duracion))) {
      return res.status(409).json({
        mensaje:
          duracion > DURACION_SLOT_MINUTOS
            ? `Ese servicio dura ${duracion} minutos y no alcanza a terminar dentro del horario de atención. Elige una hora más temprana.`
            : 'La hora seleccionada no coincide con una franja de atención válida.',
      });
    }
    // La misma mascota no puede estar en dos citas a la vez.
    if (await citaModel.mascotaOcupada(mascotaId, fecha, duracion)) {
      return res.status(409).json({ mensaje: 'Esa mascota ya tiene una cita a esa hora.' });
    }
    // Tope de citas por atender cuando agenda el propio cliente.
    if (!agendaPersonal && (await citaModel.contarFuturasDeCliente(clienteId)) >= MAXIMO_CITAS_FUTURAS_POR_CLIENTE) {
      return res.status(409).json({
        mensaje: `Ya tienes ${MAXIMO_CITAS_FUTURAS_POR_CLIENTE} citas por atender. Para agendar otra, espera a que pase alguna o comunícate con la clínica.`,
      });
    }

    let candidatos;
    if (medicoId) {
      if (!(await medicoAtiendeEnFranja(medicoId, sedeId, fecha, duracion))) {
        return res.status(409).json({ mensaje: 'El médico no atiende en ese horario. Elige otra hora.' });
      }
      if (await citaModel.existeConflicto(medicoId, fecha, duracion)) {
        return res.status(409).json({ mensaje: 'Ese médico ya tiene una cita en esa franja. Elige otra.' });
      }
      candidatos = [medicoId];
    } else {
      candidatos = await candidatosParaFranja(sedeId, servicioId, fecha, duracion);
      if (candidatos.length === 0) {
        return res.status(409).json({ mensaje: 'Ya no hay médicos disponibles en esa franja. Elige otra hora.' });
      }
    }

    // Se prueba cada candidato en orden: si otro cliente tomo ese medico
    // en esa franja entre la consulta y el INSERT, el indice unico
    // (medico_id, fecha_hora) responde 23505 y se pasa al siguiente.
    let creada = null;
    for (const candidatoId of candidatos) {
      try {
        creada = await citaModel.crear({
          clienteId,
          sedeId,
          sedeCodigo: sede.codigo,
          servicioId,
          medicoId: candidatoId,
          fechaHora: fecha,
          mascotaId,
          motivo,
          duracionMinutos: duracion,
        });
        break;
      } catch (error) {
        if (error.code === 'MASCOTA_OCUPADA') {
          return res.status(409).json({ mensaje: 'Esa mascota ya tiene una cita a esa hora.' });
        }
        if (error.code !== '23505') throw error;
      }
    }
    if (!creada) {
      return res.status(409).json({ mensaje: 'Esa franja se acaba de ocupar. Elige otra hora.' });
    }

    const detalle = (await citaModel.buscarDetallePorId(creada.id)) || creada;
    const correoEnviado = await intentarEnviarConfirmacion(detalle);
    await notificaciones.citaAgendada(creada.id, req.usuario.id);

    return res.status(201).json({ cita: detalle, correoEnviado });
  } catch (error) {
    next(error);
  }
}

// POST /api/citas/:id/reenviar-confirmacion — boton "Reenviar correo"
// de la pantalla de confirmacion. Solo el cliente dueño, solo citas
// activas.
async function reenviarConfirmacion(req, res, next) {
  try {
    const cita = await citaModel.buscarDetallePorId(req.params.id);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada.' });
    if (cita.cliente_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes reenviar la confirmación de una cita que no es tuya.' });
    }
    if (cita.estado !== 'agendada') {
      return res.status(400).json({ mensaje: 'La cita está cancelada.' });
    }

    try {
      await correoService.enviarConfirmacionCita(cita);
    } catch (error) {
      console.error(`No se pudo reenviar la confirmacion de la cita ${cita.codigo}:`, error.message);
      return res.status(502).json({ mensaje: 'No se pudo enviar el correo en este momento. Intenta de nuevo más tarde.' });
    }
    return res.status(200).json({ mensaje: `Enviamos de nuevo la confirmación a ${cita.cliente_correo}.` });
  } catch (error) {
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
    if (!puedeGestionarCita(req.usuario, cita)) {
      return res.status(403).json({ mensaje: 'No puedes modificar una cita que no es tuya.' });
    }
    if (cita.estado !== 'agendada') {
      return res.status(400).json({ mensaje: 'Solo se pueden reprogramar citas activas.' });
    }
    // Una cita que ya ocurrio no se mueve: alteraria el historial y los reportes.
    if (new Date(cita.fecha_hora) <= new Date()) {
      return res.status(409).json({ mensaje: 'Esa cita ya pasó: no se puede reprogramar.' });
    }
    // La cita conserva la duracion con la que se agendo; el servicio solo se consulta si falta ese dato.
    const duracion = cita.duracion_minutos
      ? Math.max(DURACION_SLOT_MINUTOS, Number(cita.duracion_minutos))
      : duracionDe(await servicioModel.buscarPorId(cita.servicio_id));

    const fecha = parsearFechaISO(nuevaFechaHora);
    if (!fecha) {
      return res.status(400).json({ mensaje: 'nuevaFechaHora no es una fecha válida.' });
    }
    if (fecha <= new Date()) {
      return res.status(409).json({ mensaje: 'No se puede reprogramar a una fecha en el pasado.' });
    }
    if (!(await esFranjaValida(cita.sede_id, fecha, duracion))) {
      return res.status(409).json({ mensaje: 'La hora seleccionada no coincide con una franja de atención válida.' });
    }

    const esLaMismaFranjaActual = new Date(cita.fecha_hora).getTime() === fecha.getTime();
    if (!esLaMismaFranjaActual && !(await medicoAtiendeEnFranja(cita.medico_id, cita.sede_id, fecha, duracion))) {
      return res.status(409).json({ mensaje: 'El médico no atiende en ese horario. Elige otra hora.' });
    }
    if (!esLaMismaFranjaActual) {
      // La propia cita no cuenta como choque (puede moverse media hora).
      if (await citaModel.existeConflicto(cita.medico_id, fecha, duracion, cita.id)) {
        return res.status(409).json({ mensaje: 'El médico ya tiene una cita en esa franja. Elige otra.' });
      }
      if (await citaModel.mascotaOcupada(cita.mascota_id, fecha, duracion, cita.id)) {
        return res.status(409).json({ mensaje: 'Esa mascota ya tiene otra cita a esa hora.' });
      }
    }

    const actualizada = await citaModel.reprogramar(id, fecha);
    if (actualizada && !esLaMismaFranjaActual) await notificaciones.citaReprogramada(id, req.usuario.id, cita.fecha_hora);
    return res.status(200).json({ cita: actualizada });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'El médico ya tiene una cita en esa franja. Elige otra.' });
    }
    if (error.code === 'MASCOTA_OCUPADA') {
      return res.status(409).json({ mensaje: 'Esa mascota ya tiene otra cita a esa hora.' });
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
    if (!puedeGestionarCita(req.usuario, cita)) {
      return res.status(403).json({ mensaje: 'No puedes cancelar una cita que no es tuya.' });
    }
    if (cita.estado !== 'agendada') {
      return res.status(400).json({ mensaje: 'La cita ya está cancelada.' });
    }
    // Una cita que ya ocurrio no se cancela: alteraria el historial y los reportes.
    if (new Date(cita.fecha_hora) <= new Date()) {
      return res.status(409).json({ mensaje: 'Esa cita ya pasó: no se puede cancelar.' });
    }

    const actualizada = await citaModel.cancelar(id);
    if (actualizada) await notificaciones.citaCancelada(id, req.usuario.id);
    return res.status(200).json({ cita: actualizada });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  consultarDisponibilidad,
  consultarMedicosDisponibles,
  crear,
  reenviarConfirmacion,
  misCitas,
  reprogramarCita,
  cancelarCita,
};
