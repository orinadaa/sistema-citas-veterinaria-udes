// utils/rutas.js
// `servicioId` (opcional) preselecciona el servicio en el formulario de
// agendamiento -- lo usan las tarjetas de servicio del landing.
export function rutaAgendarCita(estaAutenticado, servicioId) {
  const parametros = new URLSearchParams({ agendar: '1' });
  if (servicioId) parametros.set('servicioId', servicioId);
  const destino = `/panel?${parametros.toString()}`;
  return estaAutenticado ? destino : `/iniciar-sesion?next=${encodeURIComponent(destino)}`;
}
