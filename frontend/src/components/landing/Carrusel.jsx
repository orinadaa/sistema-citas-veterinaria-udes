// components/landing/Carrusel.jsx
// Slider horizontal generico con scroll nativo + snap (sin libreria
// nueva): cada `children` es un slide de ancho fijo por breakpoint
// (`anchoSlide`), 3 visibles en desktop por defecto. Las flechas
// desplazan una pantalla completa (clientWidth) con scroll suave.
import { useEffect, useRef, useState } from 'react';
import { IconoFlechaDerecha } from '../icons';

const ANCHO_SLIDE_DEFECTO = 'w-[85%] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]';

export function Carrusel({ children, anchoSlide = ANCHO_SLIDE_DEFECTO }) {
  const trackRef = useRef(null);
  const [puedeAtras, setPuedeAtras] = useState(false);
  const [puedeAdelante, setPuedeAdelante] = useState(false);

  function actualizarLimites() {
    const track = trackRef.current;
    if (!track) return;
    setPuedeAtras(track.scrollLeft > 4);
    setPuedeAdelante(track.scrollLeft < track.scrollWidth - track.clientWidth - 4);
  }

  useEffect(() => {
    actualizarLimites();
    const track = trackRef.current;
    if (!track) return undefined;
    const alRedimensionar = () => actualizarLimites();
    window.addEventListener('resize', alRedimensionar);
    return () => window.removeEventListener('resize', alRedimensionar);
  }, [children]);

  function desplazar(direccion) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direccion * track.clientWidth, behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => desplazar(-1)}
        disabled={!puedeAtras}
        aria-label="Ver servicios anteriores"
        className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-blue shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-0"
      >
        <IconoFlechaDerecha className="h-4 w-4 rotate-180" />
      </button>

      <div
        ref={trackRef}
        onScroll={actualizarLimites}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 pt-5 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {children.map((hijo, indice) => (
          <div key={hijo.key ?? indice} className={`shrink-0 snap-start ${anchoSlide}`}>
            {hijo}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => desplazar(1)}
        disabled={!puedeAdelante}
        aria-label="Ver más servicios"
        className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-white text-brand-blue shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-0"
      >
        <IconoFlechaDerecha className="h-4 w-4" />
      </button>
    </div>
  );
}
