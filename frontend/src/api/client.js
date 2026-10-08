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

export function solicitarCodigoRecuperacion(datos) {
  return solicitar('/auth/olvide-clave', { metodo: 'POST', cuerpo: datos });
}

export function restablecerContrasena(datos) {
  return solicitar('/auth/restablecer-clave', { metodo: 'POST', cuerpo: datos });
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

export function reenviarConfirmacionCita(id, token) {
  return solicitar(`/citas/${id}/reenviar-confirmacion`, { metodo: 'POST', token });
}

export function eliminarMascota(id, token) {
  return solicitar(`/mascotas/${id}`, { metodo: 'DELETE', token });
}

// Sube la foto final (ya recortada en el navegador) como multipart. No
// usa solicitar(): el navegador debe poner el Content-Type con el
// boundary del FormData, no application/json.
export async function subirFotoMascota(id, archivo, token) {
  const datos = new FormData();
  datos.append('foto', archivo, 'foto.jpg');
  const respuesta = await fetch(`/api/mascotas/${id}/foto`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: datos,
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(cuerpo.mensaje || `Error inesperado (${respuesta.status})`);
  return cuerpo;
}

// Panel del medico veterinario.
export function buscarClientesMedico(busqueda, token) {
  return solicitar(`/medico/clientes?${new URLSearchParams({ busqueda })}`, { token });
}

export function obtenerMisServiciosMedico(token) {
  return solicitar('/medico/servicios', { token });
}

export function obtenerPacientesMedico({ busqueda, sedeId } = {}, token) {
  const parametros = new URLSearchParams();
  if (busqueda) parametros.set('busqueda', busqueda);
  if (sedeId) parametros.set('sedeId', sedeId);
  return solicitar(`/medico/pacientes?${parametros}`, { token });
}

export function obtenerDetallePacienteMedico(clienteId, token) {
  return solicitar(`/medico/pacientes/${clienteId}`, { token });
}

export function crearRecordatorioMedico(datos, token) {
  return solicitar('/medico/recordatorios', { metodo: 'POST', cuerpo: datos, token });
}

export function obtenerRecordatoriosMascota(mascotaId, token) {
  return solicitar(`/medico/recordatorios?${new URLSearchParams({ mascotaId })}`, { token });
}

// Mi perfil (medico)
export function obtenerPerfilMedico(token) {
  return solicitar('/medico/perfil', { token });
}

export function actualizarPerfilMedico(datos, token) {
  return solicitar('/medico/perfil', { metodo: 'PUT', cuerpo: datos, token });
}

export async function subirFotoPerfilMedico(archivo, token) {
  const datos = new FormData();
  datos.append('foto', archivo, 'foto.jpg');
  const respuesta = await fetch('/api/medico/perfil/foto', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: datos,
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(cuerpo.mensaje || `Error inesperado (${respuesta.status})`);
  return cuerpo;
}

export function cambiarContrasenaMedico(datos, token) {
  return solicitar('/medico/perfil/contrasena', { metodo: 'PUT', cuerpo: datos, token });
}

export function solicitarCambioCorreoMedico(correoNuevo, token) {
  return solicitar('/medico/perfil/correo', { metodo: 'POST', cuerpo: { correoNuevo }, token });
}

export function confirmarCambioCorreoMedico(codigo, token) {
  return solicitar('/medico/perfil/correo/confirmar', { metodo: 'POST', cuerpo: { codigo }, token });
}

// Disponibilidad propia del medico
export function obtenerDisponibilidadMedico(token) {
  return solicitar('/medico/disponibilidad', { token });
}

export function guardarHorarioMedico(dias, token) {
  return solicitar('/medico/disponibilidad/horario', { metodo: 'PUT', cuerpo: { dias }, token });
}

export function crearBloqueoMedico(datos, token) {
  return solicitar('/medico/disponibilidad/bloqueos', { metodo: 'POST', cuerpo: datos, token });
}

export function eliminarBloqueoMedico(id, token) {
  return solicitar(`/medico/disponibilidad/bloqueos/${id}`, { metodo: 'DELETE', token });
}

// Subida de archivos (multipart). No usa solicitar(): el navegador debe
// poner el Content-Type con el boundary del FormData.
async function subirArchivo(ruta, archivo, token, campos = {}) {
  const datos = new FormData();
  datos.append('foto', archivo, 'foto.jpg');
  Object.entries(campos).forEach(([nombre, valor]) => datos.append(nombre, valor));
  const respuesta = await fetch(`/api${ruta}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: datos,
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(cuerpo.mensaje || `Error inesperado (${respuesta.status})`);
  return cuerpo;
}

// Fotos que el administrador sube como archivo (antes eran un enlace).
export function subirFotoSede(id, archivo, token) {
  return subirArchivo(`/sedes/${id}/foto`, archivo, token);
}

export function subirFotoMedicoAdmin(id, archivo, token) {
  return subirArchivo(`/administracion/medicos/${id}/foto`, archivo, token);
}

// Foto del servicio en la pagina publica. fondoClaro: la foto es clara en
// la zona del texto (el slider la oscurece mas).
export function subirFotoServicio(id, archivo, fondoClaro, token) {
  return subirArchivo(`/servicios/${id}/foto`, archivo, token, { fondoClaro: String(fondoClaro) });
}

export function quitarFotoServicio(id, token) {
  return solicitar(`/servicios/${id}/foto`, { metodo: 'DELETE', token });
}

// Galeria del inicio (fotos del Hero).
export function obtenerGaleria() {
  return solicitar('/galeria');
}

export function obtenerGaleriaAdmin(token) {
  return solicitar('/galeria/admin', { token });
}

export function subirFotoGaleria(archivo, descripcion, token) {
  return subirArchivo('/galeria', archivo, token, { descripcion });
}

export function actualizarFotoGaleria(id, datos, token) {
  return solicitar(`/galeria/${id}`, { metodo: 'PUT', cuerpo: datos, token });
}

export function reordenarGaleria(ids, token) {
  return solicitar('/galeria/orden', { metodo: 'PUT', cuerpo: { ids }, token });
}

export function eliminarFotoGaleria(id, token) {
  return solicitar(`/galeria/${id}`, { metodo: 'DELETE', token });
}

// Campos personalizados administrables (Configuracion > Campos).
export function obtenerCampos(entidad, token) {
  return solicitar(`/campos?${new URLSearchParams({ entidad })}`, { token });
}

export function obtenerEntidadesCampos(token) {
  return solicitar('/campos/entidades', { token });
}

export function crearCampo(datos, token) {
  return solicitar('/campos', { metodo: 'POST', cuerpo: datos, token });
}

export function actualizarCampo(id, datos, token) {
  return solicitar(`/campos/${id}`, { metodo: 'PUT', cuerpo: datos, token });
}

export function reordenarCampos(entidad, ids, token) {
  return solicitar('/campos/orden', { metodo: 'PUT', cuerpo: { entidad, ids }, token });
}

// Adjunto de un campo personalizado de tipo archivo (PDF o imagen). Va con
// su nombre original, que es el que se le muestra despues al usuario.
export async function subirArchivoCampoMascota(mascotaId, clave, archivo, token) {
  const datos = new FormData();
  datos.append('archivo', archivo, archivo.name || 'archivo');
  const respuesta = await fetch(`/api/mascotas/${mascotaId}/campos/${encodeURIComponent(clave)}/archivo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: datos,
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(cuerpo.mensaje || `Error inesperado (${respuesta.status})`);
  return cuerpo;
}

export function quitarArchivoCampoMascota(mascotaId, clave, token) {
  return solicitar(`/mascotas/${mascotaId}/campos/${encodeURIComponent(clave)}/archivo`, { metodo: 'DELETE', token });
}
