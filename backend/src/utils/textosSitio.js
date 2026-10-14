// utils/textosSitio.js
// Textos de marca de la pagina publica que puede cambiar el superadministrador.
// Es la unica lista valida: la API rechaza cualquier otra clave. Los textos
// originales son los mismos de frontend/src/utils/textosSitio.js (la pagina
// los usa si el servidor no responde): si cambia uno, cambiar los dos.

const TEXTOS_SITIO = [
  { clave: 'hero_titulo', seccion: 'Portada', etiqueta: 'Título', maximo: 70, original: 'Cuidamos de quienes hacen parte de' },
  { clave: 'hero_destacado', seccion: 'Portada', etiqueta: 'Parte destacada del título (en ámbar, al final)', maximo: 40, original: 'tu familia', vacioPermitido: true },
  { clave: 'hero_descripcion', seccion: 'Portada', etiqueta: 'Descripción', maximo: 200, original: 'Atención veterinaria integral, con profesionales comprometidos y tecnología al servicio de la salud de tu mascota.' },
  { clave: 'hero_vineta_1', seccion: 'Portada', etiqueta: 'Viñeta 1', maximo: 60, original: '2 sedes en Bucaramanga y Valledupar', vacioPermitido: true },
  { clave: 'hero_vineta_2', seccion: 'Portada', etiqueta: 'Viñeta 2', maximo: 60, original: 'Atención veterinaria integral', vacioPermitido: true },
  { clave: 'servicios_titulo', seccion: 'Secciones', etiqueta: 'Servicios: título', maximo: 50, original: 'Servicios veterinarios' },
  { clave: 'servicios_subtitulo', seccion: 'Secciones', etiqueta: 'Servicios: subtítulo', maximo: 160, original: 'Contamos con una amplia gama de servicios para el cuidado integral de tu mascota.' },
  { clave: 'sedes_titulo', seccion: 'Secciones', etiqueta: 'Sedes: título', maximo: 50, original: 'Nuestras sedes' },
  { clave: 'sedes_subtitulo', seccion: 'Secciones', etiqueta: 'Sedes: subtítulo', maximo: 160, original: 'Atendemos en dos ciudades. Elige la que te quede más cerca al agendar tu cita.' },
  { clave: 'horarios_titulo', seccion: 'Secciones', etiqueta: 'Horarios: título', maximo: 50, original: 'Horarios de atención' },
  { clave: 'horarios_subtitulo', seccion: 'Secciones', etiqueta: 'Horarios: subtítulo', maximo: 160, original: 'Conoce nuestros horarios en cada sede y agenda tu cita fácilmente.' },
  { clave: 'pie_descripcion', seccion: 'Pie de página', etiqueta: 'Descripción de la clínica', maximo: 200, original: 'Servicio de extensión de la Universidad de Santander para el cuidado de tu mascota, en Bucaramanga y Valledupar.' },
  { clave: 'pie_institucional', seccion: 'Pie de página', etiqueta: 'Texto institucional', maximo: 160, original: 'Clínica Veterinaria UDES, un servicio de la Vicerrectoría de Extensión.' },
];

const POR_CLAVE = Object.fromEntries(TEXTOS_SITIO.map((t) => [t.clave, t]));

// Texto plano de una linea: sin saltos ni caracteres de control, espacios
// repetidos reducidos a uno. La pagina lo muestra como texto (React no
// interpreta HTML), asi que no hace falta escapar nada mas.
function limpiarTexto(valor) {
  return String(valor ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { TEXTOS_SITIO, POR_CLAVE, limpiarTexto };
