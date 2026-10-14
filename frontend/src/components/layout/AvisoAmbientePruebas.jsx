// components/layout/AvisoAmbientePruebas.jsx
// Marca fija que distingue el ambiente de pruebas del de produccion. Solo se
// compila con VITE_AMBIENTE=pruebas (ver docs/despliegue.md); en el entorno
// local y en produccion no aparece.
// z-[35]: queda por debajo de la barra superior (z-40), de los paneles
// laterales y de los dialogos, para no tapar sus botones. Tampoco recibe
// clics: lo que haya debajo sigue siendo pulsable.
import { IconoAlerta } from '../icons';

export const ES_AMBIENTE_PRUEBAS = import.meta.env.VITE_AMBIENTE === 'pruebas';

export function AvisoAmbientePruebas() {
  if (!ES_AMBIENTE_PRUEBAS) return null;
  return (
    <div
      role="note"
      className="pointer-events-none fixed bottom-3 left-3 z-[35] flex items-center gap-1.5 rounded-boton bg-brand-amber px-3 py-1.5 text-xs font-semibold text-brand-navy shadow-lg"
    >
      <IconoAlerta aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>Ambiente de pruebas</span>
    </div>
  );
}
