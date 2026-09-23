// components/ui/SidePanel.jsx
// Panel lateral derecho: el contenido principal sigue visible a la
// izquierda (no es un modal con overlay oscuro), tal como especifica
// el sistema de diseno.
import { IconoX } from '../icons';

export function SidePanel({ isOpen, onClose, title, children }) {
  return (
    <div
      className={`fixed inset-y-0 right-0 z-30 w-full max-w-md transform border-l border-slate-200 bg-white shadow-xl transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full flex-col">
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
      </div>
    </div>
  );
}
