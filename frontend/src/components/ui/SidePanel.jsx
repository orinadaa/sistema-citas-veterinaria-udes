// components/ui/SidePanel.jsx
// Unica ventana flotante del sistema: nunca un modal centrado con
// overlay oscuro. El contenido detras sigue visible con su color
// normal -- modal en comportamiento (el padre debe marcar su
// contenido principal `inert` mientras esto esta abierto, ver
// cualquier PanelXxx.jsx que lo use), no modal en apariencia.
// `footer` (opcional) fija los botones de accion abajo, fuera del
// scroll del cuerpo -- si no se pasa, el panel queda sin pie fijo.
import { IconoX } from '../icons';

export function SidePanel({ isOpen, onClose, title, children, footer }) {
  return (
    <div
      className={`fixed inset-y-0 right-0 z-30 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <h2 className="font-heading text-lg font-semibold text-brand-navy">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <IconoX className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

      {footer && <div className="border-t border-slate-100 px-6 py-4">{footer}</div>}
    </div>
  );
}
