// utils/guardiaSalida.js
// Permiso para salir de una pagina con trabajo sin terminar, para las
// salidas que NO pasan por el router (hoy: "Cerrar sesion", que recarga
// la pagina completa). Las navegaciones normales (enlaces, atras del
// navegador) las frena useBlocker en la propia pagina.
//
// La pagina con algo pendiente (agendar una cita a medias) registra una
// guardia; quien va a sacar al usuario llama a salirConPermiso(accion):
// con guardia, es ella quien decide si ejecuta la accion (tras confirmar
// con el usuario); sin guardia, la accion corre de una vez.

let guardia = null;

// Devuelve la funcion para quitar la guardia (cleanup de un useEffect).
export function registrarGuardiaSalida(nueva) {
  guardia = nueva;
  return () => {
    if (guardia === nueva) guardia = null;
  };
}

export function salirConPermiso(accion) {
  if (guardia) guardia(accion);
  else accion();
}
