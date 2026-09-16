// utils/rutas.js
export function rutaAgendarCita(estaAutenticado) {
  const destino = '/panel?agendar=1';
  return estaAutenticado ? destino : `/iniciar-sesion?next=${encodeURIComponent(destino)}`;
}
