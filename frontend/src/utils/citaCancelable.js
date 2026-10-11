// utils/citaCancelable.js
// Solo se puede cancelar una cita agendada que todavia no ocurre (el
// servidor aplica la misma regla).
export function sePuedeCancelar(cita) {
  return Boolean(cita) && cita.estado === 'agendada' && new Date(cita.fecha_hora) > new Date();
}
