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

export function obtenerSedesAdmin(token) {
  return solicitar('/sedes/admin', { token });
}

export function crearSede(datos, token) {
  return solicitar('/sedes', { metodo: 'POST', cuerpo: datos, token });
}

export function actualizarSede(id, datos, token) {
  return solicitar(`/sedes/${id}`, { metodo: 'PUT', cuerpo: datos, token });
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

export function obtenerHorarios(sedeId) {
  return solicitar(`/horarios?${new URLSearchParams({ sedeId })}`);
}

export function actualizarHorario(datos, token) {
  return solicitar('/horarios', { metodo: 'PUT', cuerpo: datos, token });
}

export function cerrarDiaHorario(sedeId, diaSemana, token) {
  return solicitar(`/horarios/${sedeId}/${diaSemana}`, { metodo: 'DELETE', token });
}

export function obtenerServiciosAdmin(token) {
  return solicitar('/servicios/admin', { token });
}

export function obtenerCategoriasServicio() {
  return solicitar('/servicios/categorias');
}

export function crearServicio(datos, token) {
  return solicitar('/servicios', { metodo: 'POST', cuerpo: datos, token });
}

export function actualizarServicio(id, datos, token) {
  return solicitar(`/servicios/${id}`, { metodo: 'PUT', cuerpo: datos, token });
}

export function obtenerMedicosAdmin(token) {
  return solicitar('/administracion/medicos', { token });
}

export function crearMedico(datos, token) {
  return solicitar('/administracion/medicos', { metodo: 'POST', cuerpo: datos, token });
}

export function actualizarMedico(id, datos, token) {
  return solicitar(`/administracion/medicos/${id}`, { metodo: 'PUT', cuerpo: datos, token });
}

export function actualizarServiciosDeMedico(medicoId, servicioIds, token) {
  return solicitar(`/administracion/medicos/${medicoId}/servicios`, {
    metodo: 'PUT',
    cuerpo: { servicioIds },
    token,
  });
}

export function actualizarEspecialidadesDeMedico(medicoId, categoriaIds, token) {
  return solicitar(`/administracion/medicos/${medicoId}/especialidades`, {
    metodo: 'PUT',
    cuerpo: { categoriaIds },
    token,
  });
}

export function obtenerCitasAdministracion(token) {
  return solicitar('/administracion/citas', { token });
}

export function obtenerPacientes({ sedeId, busqueda } = {}, token) {
  const parametros = new URLSearchParams();
  if (sedeId) parametros.set('sedeId', sedeId);
  if (busqueda) parametros.set('busqueda', busqueda);
  return solicitar(`/administracion/pacientes?${parametros}`, { token });
}

export function obtenerDetallePaciente(id, token) {
  return solicitar(`/administracion/pacientes/${id}`, { token });
}

export function obtenerReportes({ sedeId, desde, hasta } = {}, token) {
  const parametros = new URLSearchParams();
  if (sedeId) parametros.set('sedeId', sedeId);
  if (desde) parametros.set('desde', desde);
  if (hasta) parametros.set('hasta', hasta);
  return solicitar(`/administracion/reportes?${parametros}`, { token });
}

export function actualizarUsuario(id, datos, token) {
  return solicitar(`/usuarios/${id}`, { metodo: 'PATCH', cuerpo: datos, token });
}

export function obtenerClientes(token) {
  return solicitar(`/usuarios?${new URLSearchParams({ rol: 'cliente' })}`, { token });
}

export function obtenerUsuarios(token) {
  return solicitar('/usuarios', { token });
}

export function crearUsuarioStaff(datos, token) {
  return solicitar('/usuarios', { metodo: 'POST', cuerpo: datos, token });
}

export function cambiarRolUsuario(id, datos, token) {
  return solicitar(`/usuarios/${id}/rol`, { metodo: 'PATCH', cuerpo: datos, token });
}

export function obtenerMisMascotas(token) {
  return solicitar('/mascotas/mias', { token });
}

export function obtenerMascotasDeCliente(clienteId, token) {
  return solicitar(`/mascotas?${new URLSearchParams({ clienteId })}`, { token });
}

export function crearMascota(datos, token) {
  return solicitar('/mascotas', { metodo: 'POST', cuerpo: datos, token });
}

export function actualizarMascota(id, datos, token) {
  return solicitar(`/mascotas/${id}`, { metodo: 'PUT', cuerpo: datos, token });
}
