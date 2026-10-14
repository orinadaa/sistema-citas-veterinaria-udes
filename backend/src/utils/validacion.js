// utils/validacion.js
// Validaciones compartidas de datos que escribe una persona. Devuelven el
// mensaje del problema (para responder 400) o null si el dato sirve.

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^[0-9+\s()-]{7,20}$/;
const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const PATRON_HORA = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

// Correo en minusculas y sin espacios: "Ana@correo.com" y "ana@correo.com"
// son la misma cuenta.
function normalizarCorreo(correo) {
  return String(correo ?? '').trim().toLowerCase();
}

function errorCorreo(correo) {
  if (!correo) return 'El correo es obligatorio.';
  if (correo.length > 150 || !CORREO_REGEX.test(correo)) return 'El correo electrónico no tiene un formato válido.';
  return null;
}

// Nombre de persona: sin enlaces ni saltos de linea (el nombre viaja en los
// correos que envia el sistema).
function errorNombre(nombre) {
  const texto = String(nombre ?? '').trim();
  if (texto.length < 2) return 'Escribe el nombre completo.';
  if (texto.length > 150) return 'El nombre no puede superar los 150 caracteres.';
  if (/[\r\n<>]|https?:|www\./i.test(texto)) return 'El nombre contiene caracteres que no se permiten.';
  return null;
}

function errorTelefono(telefono) {
  if (telefono === undefined || telefono === null || telefono === '') return null;
  return TELEFONO_REGEX.test(String(telefono)) ? null : 'El teléfono solo admite números, espacios, +, - y paréntesis (entre 7 y 20 caracteres).';
}

// limites: { campo: maximoDeCaracteres }. etiquetas: como se llama cada campo.
function errorLongitud(datos, limites, etiquetas = {}) {
  for (const [campo, maximo] of Object.entries(limites)) {
    const valor = datos[campo];
    if (valor !== undefined && valor !== null && String(valor).length > maximo) {
      return `${etiquetas[campo] || campo} no puede superar los ${maximo} caracteres.`;
    }
  }
  return null;
}

// true si "YYYY-MM-DD" es una fecha que existe (2026-02-31 no existe).
function esFechaReal(texto) {
  if (!PATRON_FECHA.test(String(texto ?? ''))) return false;
  const [anio, mes, dia] = texto.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
}

function esHora(texto) {
  return PATRON_HORA.test(String(texto ?? ''));
}

function aMinutos(hora) {
  const [h, m] = String(hora).split(':').map(Number);
  return h * 60 + m;
}

module.exports = { normalizarCorreo, errorCorreo, errorNombre, errorTelefono, errorLongitud, esFechaReal, esHora, aMinutos };
