// api/client.js
// Cliente HTTP minimo para hablar con el backend. El proxy de Vite
// redirige "/api/..." al backend en desarrollo (ver vite.config.js).

async function solicitar(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const encabezados = { 'Content-Type': 'application/json' };
  if (token) {
    encabezados.Authorization = `Bearer ${token}`;
  }

  const respuesta = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: encabezados,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || `Error inesperado (${respuesta.status})`);
  }

  return datos;
}

export function registrarCliente(datos) {
  return solicitar('/auth/registro', { metodo: 'POST', cuerpo: datos });
}

export function iniciarSesion(datos) {
  return solicitar('/auth/login', { metodo: 'POST', cuerpo: datos });
}

export function obtenerSedes() {
  return solicitar('/sedes');
}

export function obtenerPerfil(token) {
  return solicitar('/auth/perfil', { token });
}

export function obtenerServicios() {
  return solicitar('/servicios');
}

export function obtenerDisponibilidad({ sedeId, servicioId, fecha, medicoId, token }) {
  const parametros = new URLSearchParams({ sedeId, servicioId, fecha });
  if (medicoId) parametros.set('medicoId', medicoId);
  return solicitar(`/citas/disponibilidad?${parametros}`, { token });
}

export function obtenerMedicosDisponibles({ sedeId, servicioId, fechaHora, token }) {
  const parametros = new URLSearchParams({ sedeId, servicioId, fechaHora });
  return solicitar(`/citas/medicos-disponibles?${parametros}`, { token });
}

export function agendarCita(datos, token) {
  return solicitar('/citas', { metodo: 'POST', cuerpo: datos, token });
}

export function obtenerMisCitas(token) {
  return solicitar('/citas/mias', { token });
}

export function reprogramarCita(id, nuevaFechaHora, token) {
  return solicitar(`/citas/${id}/reprogramar`, { metodo: 'PATCH', cuerpo: { nuevaFechaHora }, token });
}

export function cancelarCita(id, token) {
  return solicitar(`/citas/${id}/cancelar`, { metodo: 'PATCH', token });
}
