// components/admin/ConfirmarCitasAfectadas.jsx
// Antes de guardar un cambio de agenda (horario de la sede, cierre de un dia
// o bloqueo de un medico) que deja citas sin poder atenderse, la sede ve
// cuales son y confirma. Al confirmar, el servidor las pasa a otro medico
// libre (si aplica) o las deja "por reagendar" y avisa a cada cliente.
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { IconoAlerta } from '../icons';

// confirmacion: { titulo, explicacion, textoConfirmar, citas } o null.
export function ConfirmarCitasAfectadas({ confirmacion, onConfirmar, onCancelar, enviando }) {
  useEffect(() => {
    if (!confirmacion) return undefined;
    function alPresionarTecla(evento) {
      if (evento.key !== 'Escape' || enviando) return;
      evento.stopPropagation();
      onCancelar();
    }
    document.addEventListener('keydown', alPresionarTecla, true);
    return () => document.removeEventListener('keydown', alPresionarTecla, true);
  }, [confirmacion, enviando, onCancelar]);

  if (!confirmacion) return null;
  const { titulo, explicacion, textoConfirmar, citas } = confirmacion;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="velo absolute inset-0" onClick={enviando ? undefined : onCancelar} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-citas-afectadas"
        aria-describedby="detalle-citas-afectadas"
        className="cristal-fuerte relative flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-superficie"
      >
        <div className="flex items-start gap-3 border-b border-slate-900/10 px-6 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <IconoAlerta className="h-5 w-5" />
          </span>
          <div>
            <h2 id="titulo-citas-afectadas" className="text-lg font-bold text-brand-navy">
              {titulo}
            </h2>
            <p id="detalle-citas-afectadas" className="mt-0.5 text-sm text-slate-700">
              {explicacion}
            </p>
          </div>
        </div>

        <ul className="flex max-h-72 flex-col divide-y divide-slate-900/10 overflow-y-auto px-6">
          {citas.map((cita) => (
            <li key={cita.id} className="py-3 text-sm">
              <p className="font-semibold text-slate-900">
                {formatearFechaLarga(cita.fecha_hora)}, {formatearHora(cita.fecha_hora)}
              </p>
              <p className="text-slate-700">
                {cita.mascota_nombre} ({cita.cliente_nombre}) · {cita.servicio_nombre} · {cita.medico_nombre}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-900/10 px-6 py-4">
          <button
            type="button"
            onClick={onCancelar}
            disabled={enviando}
            className="rounded-boton border border-slate-400 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white/60 disabled:opacity-60"
          >
            No guardar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={enviando}
            className="rounded-boton bg-brand-amber px-4 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-95 disabled:opacity-60"
          >
            {enviando ? 'Guardando...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
