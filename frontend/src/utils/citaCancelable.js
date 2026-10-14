// utils/citaCancelable.js
// Se puede cancelar (y reprogramar) una cita agendada que todavia no ocurre,
// o una que esta por reagendar (el servidor aplica la misma regla).
export function sePuedeCancelar(cita) {
  if (!cita) return false;
  return cita.estado === 'por_reagendar' || (cita.estado === 'agendada' && new Date(cita.fecha_hora) > new Date());
}
