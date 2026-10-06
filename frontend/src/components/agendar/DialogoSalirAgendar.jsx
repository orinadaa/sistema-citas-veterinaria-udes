// components/agendar/DialogoSalirAgendar.jsx
// Confirmacion antes de salir del flujo de agendamiento cuando ya hay
// datos elegidos: "Cancelar" no debe borrar el progreso sin avisar.
// Dialogo centrado chico (excepcion a la regla de paneles laterales: es
// una confirmacion de una sola pregunta, no un formulario). Escape o click
// fuera = seguir agendando; el foco arranca en la opcion segura.
import { useEffect, useRef } from 'react';

export function DialogoSalirAgendar({ abierto, onSeguir, onSalir }) {
  const seguirRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    seguirRef.current?.focus();
    const alPresionarTecla = (evento) => {
      if (evento.key === 'Escape') onSeguir();
    };
    document.addEventListener('keydown', alPresionarTecla);
    return () => document.removeEventListener('keydown', alPresionarTecla);
  }, [abierto, onSeguir]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onSeguir} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-salir-agendar"
        aria-describedby="texto-salir-agendar"
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 id="titulo-salir-agendar" className="font-heading text-lg font-semibold text-brand-navy">
          ¿Salir sin agendar la cita?
        </h2>
        <p id="texto-salir-agendar" className="mt-2 text-sm text-slate-600">
          Perderás lo que ya elegiste (servicio, sede, fecha y hora).
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            ref={seguirRef}
            type="button"
            onClick={onSeguir}
            className="rounded-boton border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Seguir agendando
          </button>
          <button
            type="button"
            onClick={onSalir}
            className="rounded-boton bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Sí, salir
          </button>
        </div>
      </div>
    </div>
  );
}
