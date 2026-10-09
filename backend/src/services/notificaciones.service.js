// services/notificaciones.service.js
// Crea los avisos de la campana cuando pasa algo que a alguien le importa:
// cita agendada, reprogramada o cancelada, mascota registrada, recordatorio
// creado por el medico y recordatorio automatico previo a la cita (RF-18).
//
// Reglas:
// - Nunca hace fallar la accion que lo origina: si un aviso no se puede
//   guardar, se anota en la consola y la cita (o la mascota) queda igual.
// - No se avisa a quien hizo la accion de lo que el mismo acaba de hacer,
//   salvo al cliente, que siempre ve el registro de sus citas y mascotas.
// - Destinatarios de una cita: el cliente y el medico que la atiende. Los
//   administradores y el superadministrador NO reciben notificaciones
//   (decision de Oriana): ven las citas en su panel.
// - En las pruebas automaticas no escribe (los modelos estan simulados).
const notificacionModel = require('../models/notificacion.model');
const correoService = require('./correo.service');

const HORAS_ANTES = 24;
// Los datos de ejemplo y de prueba usan correos que no existen: a esos no
// se les envia el correo del recordatorio (el aviso de la campana si).
const DOMINIOS_SIN_CORREO = ['demo.udes.co', 'prueba.invalid'];

const formatoFecha = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true });
const cuando = (fecha) => formatoFecha.format(new Date(fecha));

const activo = () => process.env.NODE_ENV !== 'test' || Boolean(process.env.NOTIFICACIONES_EN_PRUEBAS);

async function enviar(avisos) {
  await Promise.all(
    avisos
      .filter((aviso) => aviso.usuarioId)
      // Una hora termina en "p. m.": si cierra la frase, no se repite el punto.
      .map((aviso) => ({ ...aviso, mensaje: aviso.mensaje.replace(/\.\.(\s|$)/g, '.$1') }))
      .map((aviso) => notificacionModel.crear(aviso).catch((error) => console.error('No se pudo guardar una notificación:', error.message)))
  );
}

// Arma los avisos de una cita para el cliente y el medico. `actorId` es
// quien hizo la accion: no recibe su propio aviso, salvo que sea el cliente.
async function avisarCita(citaId, actorId, textos) {
  if (!activo()) return;
  try {
    const cita = await notificacionModel.detalleCita(citaId);
    if (!cita) return;
    const t = textos(cita, actorId === cita.cliente_id);
    const avisos = [{ usuarioId: cita.cliente_id, tipo: t.tipo, titulo: t.titulo, mensaje: t.cliente, enlace: '/panel?tab=citas' }];
    if (cita.medico_id !== actorId) {
      avisos.push({ usuarioId: cita.medico_id, tipo: t.tipo, titulo: t.tituloPersonal, mensaje: t.personal, enlace: '/medico' });
    }
    await enviar(avisos);
  } catch (error) {
    console.error('No se pudieron crear las notificaciones de la cita:', error.message);
  }
}

function citaAgendada(citaId, actorId) {
  return avisarCita(citaId, actorId, (c, porElCliente) => ({
    tipo: 'cita_agendada',
    titulo: 'Cita agendada',
    cliente: `${porElCliente ? 'Agendaste' : 'La clínica agendó'} ${c.servicio_nombre} para ${c.mascota_nombre} el ${cuando(c.fecha_hora)} en ${c.sede_nombre}.`,
    tituloPersonal: 'Nueva cita',
    personal: `${c.cliente_nombre} tiene ${c.servicio_nombre} con ${c.mascota_nombre} el ${cuando(c.fecha_hora)}.`,
  }));
}

function citaReprogramada(citaId, actorId, fechaAnterior) {
  return avisarCita(citaId, actorId, (c) => ({
    tipo: 'cita_reprogramada',
    titulo: 'Cita reprogramada',
    cliente: `La cita de ${c.mascota_nombre} (${c.servicio_nombre}) pasó del ${cuando(fechaAnterior)} al ${cuando(c.fecha_hora)}.`,
    tituloPersonal: 'Cita reprogramada',
    personal: `${c.cliente_nombre} movió la cita de ${c.mascota_nombre} (${c.servicio_nombre}) del ${cuando(fechaAnterior)} al ${cuando(c.fecha_hora)}.`,
  }));
}

function citaCancelada(citaId, actorId) {
  return avisarCita(citaId, actorId, (c) => ({
    tipo: 'cita_cancelada',
    titulo: 'Cita cancelada',
    cliente: `Se canceló la cita de ${c.mascota_nombre} (${c.servicio_nombre}) del ${cuando(c.fecha_hora)}.`,
    tituloPersonal: 'Cita cancelada',
    personal: `${c.cliente_nombre} canceló la cita de ${c.mascota_nombre} (${c.servicio_nombre}) del ${cuando(c.fecha_hora)}.`,
  }));
}

// mascota: { nombre, cliente_id }
async function mascotaRegistrada(mascota, actorId) {
  if (!activo() || !mascota) return;
  const propia = actorId === mascota.cliente_id;
  await enviar([
    {
      usuarioId: mascota.cliente_id,
      tipo: 'mascota_registrada',
      titulo: 'Mascota registrada',
      mensaje: propia ? `${mascota.nombre} ya hace parte de tu cuenta. Puedes agendarle una cita cuando quieras.` : `La clínica registró a ${mascota.nombre} en tu cuenta.`,
      enlace: '/panel?tab=mascotas',
    },
  ]);
}

async function recordatorioDelMedico({ clienteId, nombreMascota, nombreMedico, titulo, fechaTexto, hora }) {
  if (!activo()) return;
  await enviar([
    {
      usuarioId: clienteId,
      tipo: 'recordatorio',
      titulo: `Recordatorio para ${nombreMascota}`,
      mensaje: `${nombreMedico} te dejó un recordatorio: ${titulo}. ${fechaTexto}${hora ? `, ${hora}` : ''}.`,
      enlace: '/panel?tab=mascotas',
    },
  ]);
}

// RF-18: recordatorio automatico de las citas que empiezan en las proximas
// 24 horas. Aviso en la campana del cliente y correo (si su correo es real).
// Devuelve cuantas citas se recordaron.
async function recordarCitasProximas() {
  const ids = await notificacionModel.tomarCitasParaRecordar(HORAS_ANTES);
  for (const id of ids) {
    const cita = await notificacionModel.detalleCita(id);
    if (!cita) continue;
    await enviar([
      {
        usuarioId: cita.cliente_id,
        tipo: 'recordatorio_cita',
        titulo: 'Tu cita se acerca',
        mensaje: `${cita.mascota_nombre} tiene ${cita.servicio_nombre} el ${cuando(cita.fecha_hora)} en ${cita.sede_nombre}, con ${cita.medico_nombre}. Te recomendamos llegar 10 minutos antes.`,
        enlace: '/panel?tab=citas',
      },
    ]);
    const dominio = String(cita.cliente_correo).split('@')[1];
    if (!DOMINIOS_SIN_CORREO.includes(dominio)) {
      await correoService
        .enviarRecordatorioCita({ ...cita, fechaTexto: cuando(cita.fecha_hora) })
        .catch((error) => console.error(`No se pudo enviar el correo de recordatorio de la cita ${cita.codigo}:`, error.message));
    }
  }
  return ids.length;
}

// Revisa al arrancar y luego cada 10 minutos. Solo lo llama server.js.
function iniciarRecordatorios(minutos = 10) {
  const revisar = () => recordarCitasProximas().catch((error) => console.error('No se pudieron revisar los recordatorios de citas:', error.message));
  revisar();
  return setInterval(revisar, minutos * 60 * 1000);
}

module.exports = { citaAgendada, citaReprogramada, citaCancelada, mascotaRegistrada, recordatorioDelMedico, recordarCitasProximas, iniciarRecordatorios };
