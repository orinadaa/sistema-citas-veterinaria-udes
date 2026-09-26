// utils/rutas.js
// `servicioId` (opcional) preselecciona el servicio en el formulario de
// agendamiento -- lo usan las tarjetas de servicio del landing.
export function rutaAgendarCita(estaAutenticado, servicioId) {
  const parametros = new URLSearchParams({ agendar: '1' });
  if (servicioId) parametros.set('servicioId', servicioId);
  const destino = `/panel?${parametros.toString()}`;
  return estaAutenticado ? destino : `/iniciar-sesion?next=${encodeURIComponent(destino)}`;
}

// A donde va cada rol despues de iniciar sesion cuando no hay un
// "next" explicito en la URL: /panel es la vista del cliente, /admin
// es el panel administrativo/veterinario (ver App.jsx).
export function rutaPanelPorRol(rol) {
  return rol === 'administrador' || rol === 'veterinario' ? '/admin' : '/panel';
}
