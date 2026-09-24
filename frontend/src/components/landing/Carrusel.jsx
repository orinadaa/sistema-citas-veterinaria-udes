// components/landing/Carrusel.jsx
// Slider horizontal generico con scroll nativo + snap (sin libreria
// nueva): cada `children` es un slide de ancho fijo por breakpoint
// (`anchoSlide`), 3 visibles en desktop por defecto. Las flechas viven
// en su propia columna de flex (no superpuestas sobre el track), asi
// nunca tapan la tarjeta que se asoma al costado.
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
    <div className="flex items-center gap-2 sm:gap-4">
      <button
        type="button"
        onClick={() => desplazar(-1)}
        disabled={!puedeAtras}
        aria-label="Ver servicios anteriores"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-blue shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-0"
      >
        <IconoFlechaDerecha className="h-4 w-4 rotate-180" />
      </button>

      <div
        ref={trackRef}
        onScroll={actualizarLimites}
        className="flex min-w-0 flex-1 snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-1 pb-4 pt-5 [&::-webkit-scrollbar]:hidden"
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
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-blue shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-0"
      >
        <IconoFlechaDerecha className="h-4 w-4" />
      </button>
    </div>
  );
}
