// utils/disponibilidadMedico.js
// Logica pura (sin base de datos) de la disponibilidad propia del medico
// (opcion A: horario por medico y sede + bloqueos). Las franjas siguen
// saliendo del horario de la sede (utils/franjas.js); esto solo decide
// si UN medico atiende en una franja concreta:
// - Sin horario propio configurado: atiende siempre (en su sede), como
//   funcionaba antes -- la sede ya se filtro en la consulta de medicos.
// - Con horario propio: debe tener fila ese dia EN ESA SEDE, la franja
//   debe caber completa dentro de su rango y no cruzarse con su pausa.
// - En cualquier caso, un bloqueo (dia completo, o rango de horas) que
//   cubra esa fecha y se cruce con la franja la deja fuera.
const { DURACION_SLOT_MINUTOS } = require('./franjas');

function aMinutos(hora) {
  const [h, m] = String(hora).split(':').map(Number);
  return h * 60 + m;
}

// YYYY-MM-DD en hora local (misma convencion que el resto del backend).
function fechaLocalISO(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function seCruzan(inicioA, finA, inicioB, finB) {
  return inicioA < finB && inicioB < finA;
}

// contexto (ver disponibilidadMedico.model.js#cargarContexto):
//   sedeId, conHorarioPropio: Set<medicoId>,
//   horarioDelDia: Map<medicoId, { sede_id, hora_inicio, hora_fin, pausa_inicio, pausa_fin }>,
//   bloqueos: [{ medico_id, fecha_inicio, fecha_fin, hora_inicio, hora_fin }] (fechas 'YYYY-MM-DD')
function medicoAtiende(medicoId, franja, contexto) {
  const inicio = franja.getHours() * 60 + franja.getMinutes();
  const fin = inicio + DURACION_SLOT_MINUTOS;

  if (contexto.conHorarioPropio.has(medicoId)) {
    const dia = contexto.horarioDelDia.get(medicoId);
    if (!dia || dia.sede_id !== contexto.sedeId) return false;
    if (inicio < aMinutos(dia.hora_inicio) || fin > aMinutos(dia.hora_fin)) return false;
    if (dia.pausa_inicio && seCruzan(inicio, fin, aMinutos(dia.pausa_inicio), aMinutos(dia.pausa_fin))) return false;
  }

  const fecha = fechaLocalISO(franja);
  const bloqueado = contexto.bloqueos.some(
    (b) =>
      b.medico_id === medicoId &&
      fecha >= b.fecha_inicio &&
      fecha <= b.fecha_fin &&
      (!b.hora_inicio || seCruzan(inicio, fin, aMinutos(b.hora_inicio), aMinutos(b.hora_fin)))
  );
  return !bloqueado;
}

module.exports = { medicoAtiende, aMinutos, fechaLocalISO };
