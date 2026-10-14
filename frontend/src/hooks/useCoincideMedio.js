// hooks/useCoincideMedio.js
// Indica si la pantalla cumple una media query (por ejemplo '(max-width: 639px)')
// y se actualiza al girar el telefono o cambiar el tamaño de la ventana. Sirve
// para lo que CSS no alcanza a cambiar, como el texto de ayuda de un campo.
import { useEffect, useState } from 'react';

export function useCoincideMedio(consulta) {
  const [coincide, setCoincide] = useState(() => typeof window !== 'undefined' && window.matchMedia(consulta).matches);
  useEffect(() => {
    const medio = window.matchMedia(consulta);
    const alCambiar = () => setCoincide(medio.matches);
    alCambiar();
    medio.addEventListener('change', alCambiar);
    return () => medio.removeEventListener('change', alCambiar);
  }, [consulta]);
  return coincide;
}
