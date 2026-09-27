// utils/fecha.js
// Formato de fechas/horas en espanol, consistente en toda la app.

const formatoHora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
const formatoFechaLarga = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatearHora(iso) {
  return formatoHora.format(new Date(iso));
}

export function formatearFechaLarga(iso) {
  const texto = formatoFechaLarga.format(new Date(iso));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const formatoFechaCorta = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

// Fecha corta sin hora (ej. fecha de nacimiento de una mascota) -- a
// diferencia de formatearFechaLarga, sin dia de la semana.
export function formatearFechaCorta(iso) {
  return formatoFechaCorta.format(new Date(iso));
}

// YYYY-MM-DD en horario local (evita el corrimiento de un dia que da
// toISOString() al convertir a UTC).
export function hoyComoFechaLocal() {
  const hoy = new Date();
  const offset = hoy.getTimezoneOffset() * 60000;
  return new Date(hoy - offset).toISOString().slice(0, 10);
}

// Date (hora local) <-> "YYYY-MM-DD", sin pasar por UTC.
export function aFechaLocal(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function desdeFechaLocal(texto) {
  const [anio, mes, dia] = texto.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

// Utilidades de calendario (vista semanal del panel administrativo).

export function sumarDias(fecha, dias) {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

// Lunes de la semana que contiene `fecha` (hora local).
export function inicioDeSemana(fecha) {
  const dia = fecha.getDay(); // 0=domingo ... 6=sabado
  const diferencia = dia === 0 ? -6 : 1 - dia;
  const lunes = sumarDias(fecha, diferencia);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

export function esMismoDia(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const formatoMesAnio = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });
const formatoDiaMes = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

export function formatearMesAnio(fecha) {
  const texto = formatoMesAnio.format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatearRangoSemana(inicio, fin) {
  const mismoMes = inicio.getMonth() === fin.getMonth();
  const inicioTexto = mismoMes ? String(inicio.getDate()) : formatoDiaMes.format(inicio);
  return `${inicioTexto} – ${formatoDiaMes.format(fin)}`;
}
