// components/citas/ReprogramarCitaModal.jsx
// Ventana "Reprogramar cita" (RF-08).
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { DatePickerCalendar } from '../agendar/DatePickerCalendar';
import { TimeSlotPicker } from '../agendar/TimeSlotPicker';
import { Boton } from '../vetui';
import { IconoX } from '../icons';

export function ReprogramarCitaModal({
  abierto,
  cita,
  onCerrar,
  onConfirmar,
  fecha,
  onCambiarFecha,
  franja,
  onCambiarFranja,
  diasAbiertos,
  enviando,
  error,
}) {
  useEffect(() => {
    if (!abierto) return undefined;
    // En fase de captura y sin propagar: Escape cierra solo esta ventana,
    // no tambien el detalle de la cita que esta detras.
    function alPresionarTecla(evento) {
      if (evento.key !== 'Escape') return;
      evento.stopPropagation();
      onCerrar();
    }
    document.addEventListener('keydown', alPresionarTecla, true);
    return () => document.removeEventListener('keydown', alPresionarTecla, true);
  }, [abierto, onCerrar]);

  if (!abierto || !cita) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="velo absolute inset-0" onClick={onCerrar} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-reprogramar-cita"
        aria-describedby="detalle-reprogramar-cita"
        className="cristal-fuerte relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-superficie"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-900/10 px-6 py-5">
          <div>
            <h2 id="titulo-reprogramar-cita" className="text-lg font-bold text-brand-navy">
              Reprogramar cita
            </h2>
            <p id="detalle-reprogramar-cita" className="mt-0.5 text-sm text-slate-700">
              {/* Sin punto tras la hora: "a. m." ya termina en punto. */}
              {cita.mascota_nombre} · {cita.servicio_nombre} con {cita.medico_nombre} (se mantiene el mismo médico).
              <span className="block">
                Cita actual: {formatearFechaLarga(cita.fecha_hora)}, {formatearHora(cita.fecha_hora)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="boton-texto rounded-boton p-1.5 text-slate-600 transition hover:text-slate-900"
          >
            <IconoX className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] flex-1 gap-6 overflow-y-auto px-6 py-5 md:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
          <div>
            <p className="mb-3 text-sm font-semibold text-brand-navy">1. Elige el día</p>
            <DatePickerCalendar
              valor={fecha}
              onChange={(valor) => {
                onCambiarFecha(valor);
                onCambiarFranja(null);
              }}
              diasAbiertos={diasAbiertos}
            />
          </div>

          <div className="flex flex-col">
            <p className="mb-3 text-sm font-semibold text-brand-navy">2. Elige la hora</p>
            <TimeSlotPicker
              sedeId={cita.sede_id}
              servicioId={cita.servicio_id}
              medicoId={cita.medico_id}
              fecha={fecha}
              valor={franja}
              onChange={onCambiarFranja}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-900/10 px-6 py-4">
          {/* Resumen de lo elegido (o el error), junto a las acciones. */}
          <p role="status" className={`min-w-0 flex-1 text-sm ${error ? 'font-medium text-red-700' : 'text-slate-700'}`}>
            {error ||
              (franja ? (
                <>
                  Nueva fecha:{' '}
                  <span className="font-semibold text-brand-blue-800">
                    {formatearFechaLarga(franja)}, {formatearHora(franja)}
                  </span>
                </>
              ) : (
                'Elige un día y una hora para continuar.'
              ))}
          </p>
          <div className="flex shrink-0 gap-3">
            <Boton variante="contorno" onClick={onCerrar} disabled={enviando}>
              Cancelar
            </Boton>
            <Boton onClick={onConfirmar} disabled={!franja || enviando}>
              {enviando ? 'Guardando...' : 'Confirmar nueva fecha'}
            </Boton>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
