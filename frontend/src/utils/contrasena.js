// utils/contrasena.js
// Reglas de una contraseña nueva. Son las mismas que valida el servidor
// (backend/src/utils/contrasena.util.js): si se cambia una, cambiar la otra.

export const REGLAS_CONTRASENA = [
  { id: 'largo', texto: 'Al menos 8 caracteres', cumple: (clave) => clave.length >= 8 },
  { id: 'minuscula', texto: 'Una letra minúscula', cumple: (clave) => /\p{Ll}/u.test(clave) },
  { id: 'mayuscula', texto: 'Una letra mayúscula', cumple: (clave) => /\p{Lu}/u.test(clave) },
  { id: 'numero', texto: 'Un número', cumple: (clave) => /\d/.test(clave) },
  { id: 'especial', texto: 'Un carácter especial, como ! # $ % o *', cumple: (clave) => /[^\p{L}\d\s]/u.test(clave) },
];

// Nivel de la barra: débil con dos reglas o menos, media con tres o cuatro y
// fuerte con las cinco. Solo se acepta la contraseña fuerte.
export function nivelContrasena(contrasena) {
  const clave = String(contrasena ?? '');
  if (!clave) return null;
  const cumplidas = REGLAS_CONTRASENA.filter((regla) => regla.cumple(clave)).length;
  if (cumplidas === REGLAS_CONTRASENA.length) return 'fuerte';
  return cumplidas >= 3 ? 'media' : 'debil';
}

// Mensaje del primer problema, o null si la contraseña cumple todas las reglas.
export function errorContrasenaNueva(contrasena) {
  const clave = String(contrasena ?? '');
  const faltan = REGLAS_CONTRASENA.filter((regla) => !regla.cumple(clave));
  if (!faltan.length) return null;
  return `La contraseña debe tener: ${faltan.map((regla) => regla.texto.toLowerCase()).join(', ')}.`;
}
