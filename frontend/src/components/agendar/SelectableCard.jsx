// components/agendar/SelectableCard.jsx
// Tarjeta seleccionable generica (grilla de mascotas y de servicios del
// flujo de agendamiento): borde azul + check cuando esta seleccionada.
// Es un boton real (aria-pressed) para que funcione con teclado.
import { IconoCheck } from '../icons';

export function SelectableCard({ seleccionada, onSeleccionar, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onSeleccionar}
      aria-pressed={seleccionada}
      className={`hover-ilumina relative flex w-full rounded-2xl bg-white p-4 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${
        seleccionada
          ? 'border-2 border-brand-blue bg-blue-50/40 shadow-sm'
          : 'border-2 border-slate-200 hover:border-brand-blue-400 hover:shadow-sm'
      } ${className}`}
    >
      {seleccionada && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-white">
          <IconoCheck className="h-3.5 w-3.5" />
        </span>
      )}
      {children}
    </button>
  );
}
