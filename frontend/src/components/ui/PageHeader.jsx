// components/ui/PageHeader.jsx
// Encabezado estandar de pantalla: titulo + subtitulo a la izquierda,
// boton de accion primaria (amber) a la derecha. `actionLabel` es
// opcional (algunas pantallas, como Configuracion, no tienen accion
// primaria); `actionColor` permite el caso especial de Reportes, donde
// el boton principal es azul en vez de amber.
import { IconoMas } from '../icons';

export function PageHeader({ title, subtitle, actionLabel, onAction, actionColor = 'amber' }) {
  const colorClases =
    actionColor === 'blue'
      ? 'bg-brand-blue-600 text-white shadow-sm hover:bg-brand-blue-700'
      : 'boton-glass-ambar text-brand-navy';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/90">{subtitle}</p>}
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className={`inline-flex shrink-0 items-center gap-2 rounded-boton px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${colorClases}`}
        >
          <IconoMas className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
