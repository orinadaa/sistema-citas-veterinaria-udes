// components/form/EncuadreModal.jsx
// Ventana "Ajustar foto" para las fotos rectangulares que el sitio recorta
// (hoy: la foto de un servicio). Saca del formulario lo que la mayoria no
// necesita tocar: el encuadre (que parte debe verse siempre) y la
// descripcion de la foto. En el panel solo queda la foto y un boton
// "Ajustar foto"; quien quiera afinar abre esta ventana (divulgacion
// progresiva: lo opcional y avanzado no ocupa el formulario).
//
// Misma forma que el editor de fotos circulares (FotoMascotaModal):
// ventana centrada sobre un velo, titulo con X, cuerpo y pie con
// Cancelar / accion principal. Trabaja sobre un borrador: nada cambia en
// el formulario hasta "Aplicar"; Cancelar, la X, Escape o un clic afuera
// lo descartan.
//
// z-[60]: por encima del SidePanel (z-50) desde el que se abre. Se monta
// en <body> (portal) porque el panel usa transform, y un ancestro con
// transform encerraria el position:fixed de la ventana dentro de el.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Campo } from './Campo';
import { SelectorEncuadre } from './SelectorEncuadre';
import { IconoX } from '../icons';

export function EncuadreModal({
  isOpen,
  onClose,
  onAplicar,
  src,
  focoX,
  focoY,
  descripcion,
  titulo = 'Ajustar foto',
  // Proporcion del marco donde el sitio muestra la foto (clase de Tailwind).
  proporcionVista = 'aspect-square',
  textoVista = 'Así se verá en el inicio',
}) {
  const [borrador, setBorrador] = useState({ focoX, focoY, descripcion });

  // Al abrir: el borrador arranca con los valores actuales del formulario.
  const [abiertoAntes, setAbiertoAntes] = useState(false);
  if (isOpen !== abiertoAntes) {
    setAbiertoAntes(isOpen);
    if (isOpen) setBorrador({ focoX, focoY, descripcion });
  }

  useEffect(() => {
    if (!isOpen) return undefined;
    // En fase de captura y sin propagar: Escape cierra solo esta ventana,
    // no tambien el panel lateral desde el que se abrio.
    function alPresionarTecla(evento) {
      if (evento.key !== 'Escape') return;
      evento.stopPropagation();
      onClose();
    }
    document.addEventListener('keydown', alPresionarTecla, true);
    return () => document.removeEventListener('keydown', alPresionarTecla, true);
  }, [isOpen, onClose]);

  return createPortal(
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-200 motion-reduce:transition-none ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-ajustar-foto"
        className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="titulo-ajustar-foto" className="font-heading text-lg font-semibold text-brand-navy">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-boton p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <IconoX className="h-5 w-5" />
          </button>
        </div>

        {src && (
          <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-[minmax(0,1fr)_240px]">
            <SelectorEncuadre
              src={src}
              focoX={borrador.focoX}
              focoY={borrador.focoY}
              onCambiar={(foco) => setBorrador((actual) => ({ ...actual, ...foco }))}
              mostrarVista={false}
            />

            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">{textoVista}</p>
                <img
                  src={src}
                  alt=""
                  style={{ objectPosition: `${borrador.focoX}% ${borrador.focoY}%` }}
                  className={`${proporcionVista} w-full rounded-xl object-cover`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Campo
                  id="ajustar-foto-descripcion"
                  label="Descripción de la foto (opcional)"
                  value={borrador.descripcion}
                  maxLength={200}
                  onChange={(e) => setBorrador((actual) => ({ ...actual, descripcion: e.target.value }))}
                  placeholder="Ej. Veterinaria vacunando a un perro"
                />
                <p className="text-xs text-slate-500">
                  Di qué se ve en la foto: es lo que escuchan las personas que usan lector de pantalla.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-boton border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onAplicar({ ...borrador, descripcion: borrador.descripcion.trim() })}
            className="rounded-boton bg-brand-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-600"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
