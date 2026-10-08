// hooks/useCatalogoEspecies.js
// Especies y razas que ofrecen los formularios de mascota. Vienen del
// catalogo que el superadministrador gestiona (Catalogos > Especies y
// razas): solo las activas. Se piden una vez por visita y se comparten entre
// todos los formularios (cache en memoria).
// Mientras carga, o si el servidor no responde, se usa la lista que venia
// en el codigo (utils/razas.js), para que el formulario nunca quede vacio.
// Devuelve [{ nombre, icono, razas: [nombres] }].
import { useEffect, useState } from 'react';
import { obtenerEspecies } from '../api/client';
import { ESPECIES, RAZAS_POR_ESPECIE } from '../utils/razas';

const ICONO_RESPALDO = { Canino: 'perro', Felino: 'gato', Ave: 'ave' };
const RESPALDO = ESPECIES.map((nombre) => ({ nombre, icono: ICONO_RESPALDO[nombre] ?? 'pata', razas: RAZAS_POR_ESPECIE[nombre] ?? [] }));

let cache = null;
let peticion = null;

// Lo llama la pantalla de Catalogos despues de un cambio: el siguiente
// formulario que se abra vuelve a pedir la lista.
export function olvidarCatalogoEspecies() {
  cache = null;
  peticion = null;
}

export function useCatalogoEspecies() {
  const [especies, setEspecies] = useState(cache ?? RESPALDO);

  useEffect(() => {
    if (cache) return undefined;
    let vigente = true;
    peticion ??= obtenerEspecies().then((datos) => {
      cache = datos.especies;
      return cache;
    });
    peticion
      .then((lista) => vigente && setEspecies(lista))
      .catch(() => {
        // Sin servidor: queda la lista de respaldo, y se reintenta la proxima vez.
        peticion = null;
      });
    return () => {
      vigente = false;
    };
  }, []);

  return especies;
}
