// hooks/useInfoClinica.js
// Informacion general de la clinica (RF-23) para la pagina publica: el
// WhatsApp de la burbuja y las redes del pie de pagina. Se pide una vez por
// visita y se comparte (cache en memoria). Mientras carga, o si el servidor
// no responde, devuelve null: la burbuja y las redes simplemente no salen.
import { useEffect, useState } from 'react';
import { obtenerInfoClinica } from '../api/client';

let cache = null;
let peticion = null;

// Lo llama el panel del superadministrador despues de guardar.
export function olvidarInfoClinica() {
  cache = null;
  peticion = null;
}

export function useInfoClinica() {
  const [clinica, setClinica] = useState(cache);

  useEffect(() => {
    if (cache) return undefined;
    let vigente = true;
    peticion ??= obtenerInfoClinica().then((datos) => {
      cache = datos.clinica;
      return cache;
    });
    peticion
      .then((datos) => vigente && setClinica(datos))
      .catch(() => {
        peticion = null;
      });
    return () => {
      vigente = false;
    };
  }, []);

  return clinica;
}
