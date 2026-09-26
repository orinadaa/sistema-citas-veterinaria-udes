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

// A donde navegar justo despues de iniciar sesion. "next" (si viene en
// la URL de login, ej. desde rutaAgendarCita cuando un invitado hace
// clic en "Agendar cita") solo es un destino valido si corresponde al
// panel del rol que efectivamente inicio sesion -- si no, ProtectedRoute
// lo rebota silenciosamente a "/" (ej. un next="/panel..." armado para
// un cliente, pero quien inicia sesion es administrador/veterinario).
// En ese caso se ignora el next y se usa el panel correcto del rol.
export function destinoTrasLogin(siguienteExplicito, rol) {
  const panelDelRol = rutaPanelPorRol(rol);
  if (!siguienteExplicito) return panelDelRol;
  const apuntaAlPanelDelRol = siguienteExplicito === panelDelRol || siguienteExplicito.startsWith(`${panelDelRol}?`);
  return apuntaAlPanelDelRol ? siguienteExplicito : panelDelRol;
}
