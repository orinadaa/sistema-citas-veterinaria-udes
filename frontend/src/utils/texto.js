// utils/texto.js
// Iniciales de un nombre (maximo 2), para avatares de personas sin foto.
export function iniciales(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}
