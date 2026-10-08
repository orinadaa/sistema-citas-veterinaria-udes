// components/admin/AvisosAtencion.jsx
// "Requiere tu atención": lista de cosas por resolver que arma el servidor
// (tablero.controller.js). Cada aviso dice que pasa y lleva al modulo donde
// se arregla (onIr). Sin avisos, lo dice en positivo. Lo usan el inicio del
// administrador de sede y el del superadministrador.
import { IconoAlerta, IconoCheck, IconoFlechaDerecha } from '../icons';

export function AvisosAtencion({ avisos, onIr, etiquetaModulo = {} }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-heading text-base font-semibold text-brand-navy">Requiere tu atención</h2>

      {avisos.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <IconoCheck className="h-4 w-4" peso="bold" />
          </span>
          Todo está en orden.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-slate-900/10">
          {avisos.map((aviso) => (
            <li key={aviso.titulo} className="flex items-start gap-3 py-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <IconoAlerta className="h-4 w-4" peso="bold" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{aviso.titulo}</p>
                <p className="text-sm text-slate-700">{aviso.detalle}</p>
              </div>
              {onIr && aviso.modulo && (
                <button
                  type="button"
                  onClick={() => onIr(aviso.modulo)}
                  className="boton-texto inline-flex shrink-0 items-center gap-1 rounded-boton px-2 py-1 text-sm font-semibold text-brand-blue-700 transition"
                >
                  {etiquetaModulo[aviso.modulo] ?? 'Revisar'}
                  <IconoFlechaDerecha className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
