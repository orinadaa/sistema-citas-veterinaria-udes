// utils/rutas.js
// `servicioId` (opcional) preselecciona el servicio en el flujo de
// agendamiento (/agendar) -- lo usan las tarjetas de servicio del landing.
// Un invitado (sin sesion) se manda primero a Registrarse, no a
// Iniciar sesion: la mayoria de quienes agendan por primera vez no
// tienen cuenta todavia, y RegistroPage ya tiene un link a "Inicia
// sesión" (con este mismo "next") para quien si la tiene.
// servicioId / sedeId (opcionales): llegan a /agendar ya preseleccionados
// (tarjetas de Servicios y de Horarios del landing).
export function rutaAgendarCita(estaAutenticado, servicioId, sedeId) {
  const parametros = new URLSearchParams();
  if (servicioId) parametros.set('servicioId', servicioId);
  if (sedeId) parametros.set('sedeId', sedeId);
  const destino = parametros.size > 0 ? `/agendar?${parametros}` : '/agendar';
  return estaAutenticado ? destino : `/registrarse?next=${encodeURIComponent(destino)}`;
}

// A donde va cada rol despues de iniciar sesion cuando no hay un
// "next" explicito en la URL: /panel es la vista del cliente, /admin
// es el panel administrativo/veterinario (ver App.jsx).
export function rutaPanelPorRol(rol) {
  return rol === 'administrador' || rol === 'veterinario' ? '/admin' : '/panel';
}

// A donde navegar justo despues de iniciar sesion. "next" (si viene en
// la URL de login, ej. desde rutaAgendarCita -> Registrarse -> "Inicia
// sesión" cuando el invitado ya tenia cuenta) solo es un destino valido
// si corresponde al
// panel del rol que efectivamente inicio sesion -- si no, ProtectedRoute
// lo rebota silenciosamente a "/" (ej. un next="/panel..." armado para
// un cliente, pero quien inicia sesion es administrador/veterinario).
// En ese caso se ignora el next y se usa el panel correcto del rol.
// Rutas protegidas a las que puede ir cada rol (ver App.jsx).
const RUTAS_DEL_ROL = {
  cliente: ['/panel', '/agendar'],
  administrador: ['/admin'],
  veterinario: ['/admin'],
};

export function destinoTrasLogin(siguienteExplicito, rol) {
  const panelDelRol = rutaPanelPorRol(rol);
  if (!siguienteExplicito) return panelDelRol;
  const permitido = (RUTAS_DEL_ROL[rol] || []).some(
    (ruta) => siguienteExplicito === ruta || siguienteExplicito.startsWith(`${ruta}?`)
  );
  return permitido ? siguienteExplicito : panelDelRol;
}
