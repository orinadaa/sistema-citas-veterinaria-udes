// components/ui/EstadoError.jsx
// Reemplaza el estado de carga cuando falla el fetch inicial de un panel
// (antes se quedaba en el skeleton para siempre porque el .then() no
// tenia .catch() y "cargando" nunca volvia a false).
import { IconoAlerta } from '../icons';

export function EstadoError({ mensaje, onReintentar }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      <IconoAlerta className="h-8 w-8 text-red-500" peso="duotone" />
      <p className="text-sm text-slate-600">{mensaje}</p>
      <button
        type="button"
        onClick={onReintentar}
        className="rounded-boton border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
      >
        Reintentar
      </button>
    </div>
  );
}
