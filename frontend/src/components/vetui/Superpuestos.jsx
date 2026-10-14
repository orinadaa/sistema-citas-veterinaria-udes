// components/vetui/Superpuestos.jsx
// Lo que se abre encima de la página, en cristal fuerte sobre un velo azul
// difuminado: PanelLateral formularios y detalles.
import { useEffect, useRef } from 'react';
import { IconoX } from '../icons';
import { useFocoDialogo } from '../../hooks/useFocoDialogo';

function useCerrarConEscape(abierto, onCerrar) {
  useEffect(() => {
    if (!abierto) return undefined;
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', alPresionarTecla);
    return () => document.removeEventListener('keydown', alPresionarTecla);
  }, [abierto, onCerrar]);
}

export function PanelLateral({ isOpen, onClose, title, children, footer }) {
  useCerrarConEscape(isOpen, onClose);
  const panelRef = useRef(null);
  useFocoDialogo(isOpen, panelRef);
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`velo fixed inset-0 z-50 transition-opacity duration-200 motion-reduce:transition-none ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`cristal-fuerte fixed inset-y-3 right-3 z-50 flex w-[calc(100%-1.5rem)] max-w-[480px] flex-col overflow-hidden rounded-superficie transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1.5rem)]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-900/10 px-6 py-5">
          <h2 className="text-lg font-bold text-brand-navy">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
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

export function Dialogo({ abierto, onCerrar, titulo, descripcion, children }) {
  const contenidoRef = useRef(null);
  useCerrarConEscape(abierto, onCerrar);
  // Foco inicial en la primera acción (por convención, la opción segura).
  useEffect(() => {
    if (abierto) contenidoRef.current?.querySelector('button')?.focus();
  }, [abierto]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="velo absolute inset-0" onClick={onCerrar} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="vetui-dialogo-titulo"
        aria-describedby={descripcion ? 'vetui-dialogo-descripcion' : undefined}
        className="cristal-fuerte relative w-full max-w-sm rounded-superficie p-6"
      >
        <h2 id="vetui-dialogo-titulo" className="text-lg font-bold text-brand-navy">
          {titulo}
        </h2>
        {descripcion && (
          <p id="vetui-dialogo-descripcion" className="mt-2 text-sm text-slate-700">
            {descripcion}
          </p>
        )}
        <div ref={contenidoRef} className="mt-6 flex flex-wrap justify-end gap-3">
          {children}
        </div>
      </div>
    </div>
  );
}
