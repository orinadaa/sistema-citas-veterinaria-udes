// utils/horarioMedico.js
// Reglas del horario propio de un medico que comparten el editor
// (EditorHorarioMedico) y el panel que lo guarda (HorarioMedicoPanel).
const formatoHora = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function hora12(valor) {
  const [h, m] = valor.split(":").map(Number);
  return formatoHora.format(new Date(2000, 0, 1, h, m));
}

// Primer problema del dia, o null. Son los mismos que rechaza el servidor:
// se dicen aqui para no esperar a guardar.
export function problemaDelDia(d, atencion) {
  if (!d?.activo || !atencion) return null;
  if (d.horaInicio >= d.horaFin)
    return "La hora de salida debe ser posterior a la de entrada.";
  if (d.horaInicio < atencion.inicio || d.horaFin > atencion.fin) {
    return `Debe quedar dentro del horario de la sede (de ${hora12(atencion.inicio)} a ${hora12(atencion.fin)}).`;
  }
  if (d.conPausa) {
    if (d.pausaInicio >= d.pausaFin)
      return "La pausa debe terminar después de empezar.";
    if (d.pausaInicio < d.horaInicio || d.pausaFin > d.horaFin)
      return "La pausa debe quedar dentro del horario del día.";
  }
  return null;
}
