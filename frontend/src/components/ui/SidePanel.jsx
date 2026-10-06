// components/ui/SidePanel.jsx
// Panel lateral derecho, usado por todos los formularios/detalles del
// sistema. Lleva overlay oscuro de fondo (cambio pedido por la usuaria,
// reemplaza la regla anterior de "sin overlay"): oscurece el contenido
// de atras y un clic sobre el, o la tecla Escape, cierra el panel. El
// padre sigue marcando su contenido principal `inert` mientras esta
// abierto (ver cualquier PanelXxx.jsx que lo use) para que tampoco se
// pueda llegar a el con el teclado.
// `footer` (opcional) fija los botones de accion abajo, fuera del
// scroll del cuerpo -- si no se pasa, el panel queda sin pie fijo.
// z-50: mas alto que el navbar publico (Navbar.jsx, sticky z-40) -- con
// z-30 el navbar tapaba el encabezado del panel (titulo + boton de
// cerrar) en /panel y en el landing, porque ambos arrancan en y=0. El
// overlay tambien es z-50 pero va antes en el DOM, asi queda debajo
// del panel y encima del navbar.
import { useEffect } from 'react';
import { IconoX } from '../icons';

export function SidePanel({ isOpen, onClose, title, children, footer }) {
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
      className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    />
    <div
      className={`fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[480px] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <h2 className="font-heading text-lg font-semibold text-brand-navy">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-boton p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <IconoX className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

      {footer && <div className="border-t border-slate-100 px-6 py-4">{footer}</div>}
    </div>
    </>
  );
}
