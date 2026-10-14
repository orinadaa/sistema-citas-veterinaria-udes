// components/ui/SidePanel.jsx
// Panel lateral derecho, usado por todos los formularios/detalles del sistema.
import { useEffect, useRef } from 'react';
import { IconoX } from '../icons';
import { useFocoDialogo } from '../../hooks/useFocoDialogo';

export function SidePanel({ isOpen, onClose, title, children, footer }) {
  const panelRef = useRef(null);
  useFocoDialogo(isOpen, panelRef);
  useEffect(() => {
    if (!isOpen) return undefined;
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', alPresionarTecla);
    return () => document.removeEventListener('keydown', alPresionarTecla);
  }, [isOpen, onClose]);

  return (
    <>
    <div
      aria-hidden="true"
      onClick={onClose}
      className={`velo fixed inset-0 z-50 transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    />
    <div
      ref={panelRef}
      tabIndex={-1}
      className={`cristal-fuerte fixed inset-y-3 right-3 z-50 flex w-[calc(100%-1.5rem)] max-w-[480px] flex-col overflow-hidden rounded-superficie transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'
      }`}
      aria-hidden={!isOpen}
      // inert: cerrado, sus botones y campos no reciben foco ni lector de pantalla.
      inert={!isOpen}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex items-center justify-between border-b border-slate-900/10 px-6 py-5">
        <h2 className="font-heading text-lg font-semibold text-brand-navy">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel"
          className="boton-texto rounded-boton p-1.5 text-slate-600 transition hover:text-slate-900"
        >
          <IconoX className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

      {footer && <div className="border-t border-slate-900/10 px-6 py-4">{footer}</div>}
    </div>
    </>
  );
}
