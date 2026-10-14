// hooks/useTextosSitio.js
// Textos de marca de la pagina publica (hero, titulos de seccion, pie de
// pagina), editables por el superadministrador. Mientras cargan, o si el
// servidor no responde, se muestran los originales: la pagina nunca queda en
// blanco.
import { useEffect, useState } from 'react';
import { obtenerTextosSitio } from '../api/client';
import { TEXTOS_ORIGINALES } from '../utils/textosSitio';

let cache = null;
let peticion = null;

// Lo llama el panel del superadministrador despues de guardar.
export function olvidarTextosSitio() {
  cache = null;
  peticion = null;
}

export function useTextosSitio() {
  const [textos, setTextos] = useState(cache ?? TEXTOS_ORIGINALES);

  useEffect(() => {
    if (cache) return undefined;
    let vigente = true;
    peticion ??= obtenerTextosSitio().then((datos) => {
      cache = { ...TEXTOS_ORIGINALES, ...datos.textos };
      return cache;
    });
    peticion
      .then((datos) => vigente && setTextos(datos))
      .catch(() => {
        peticion = null;
      });
    return () => {
      vigente = false;
    };
  }, []);

  return textos;
}
