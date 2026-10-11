// utils/datos.js
// Como se muestra un valor del explorador de Datos segun el tipo de su
// columna (lo usan la tabla, el detalle de un registro y lo relacionado).
export const ROLES_DATOS = { superadministrador: 'Superadministrador', administrador: 'Administrador de sede', veterinario: 'Médico', cliente: 'Cliente' };

export function formatearDato(valor, columna = {}) {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (columna.tipo === 'booleano') return valor ? 'Sí' : 'No';
  if (columna.tipo === 'fecha') return new Date(valor).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: String(valor).length <= 10 ? 'UTC' : undefined });
  if (columna.tipo === 'fechaHora') return new Date(valor).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  if (columna.tipo === 'dinero') return `$ ${Number(valor).toLocaleString('es-CO')}`;
  const opcion = columna.opciones?.find((o) => o.valor === String(valor));
  return opcion ? opcion.etiqueta : String(valor);
}

// "3 años", "5 meses"; null si no hay fecha de nacimiento.
export function edadDesde(nacimiento) {
  if (!nacimiento) return null;
  const nace = new Date(nacimiento);
  const hoy = new Date();
  let meses = (hoy.getFullYear() - nace.getFullYear()) * 12 + hoy.getMonth() - nace.getMonth();
  if (hoy.getDate() < nace.getUTCDate()) meses -= 1;
  if (meses < 0) return null;
  if (meses < 1) return 'Menos de un mes';
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  const anios = Math.floor(meses / 12);
  return `${anios} ${anios === 1 ? 'año' : 'años'}`;
}

// Titulo de la ventana de detalle segun la entidad.
export const TITULO_DETALLE = {
  usuarios: 'Detalle de la cuenta',
  mascotas: 'Detalle de la mascota',
  citas: 'Detalle de la cita',
  servicios: 'Detalle del servicio',
  sedes: 'Detalle de la sede',
};
