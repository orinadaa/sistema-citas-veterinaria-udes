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

// YYYY-MM-DD en horario local (evita el corrimiento de un dia que da
// toISOString() al convertir a UTC).
export function hoyComoFechaLocal() {
  const hoy = new Date();
  const offset = hoy.getTimezoneOffset() * 60000;
  return new Date(hoy - offset).toISOString().slice(0, 10);
}
