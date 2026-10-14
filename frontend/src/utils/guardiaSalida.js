// utils/guardiaSalida.js
// Permiso para salir de una pagina con trabajo sin terminar, para las salidas
// que NO pasan por el router (hoy: "Cerrar sesion", que recarga la pagina
// completa).

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
