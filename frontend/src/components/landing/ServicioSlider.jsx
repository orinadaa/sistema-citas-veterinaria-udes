// components/landing/ServicioSlider.jsx
// Slider fotografico de servicios del landing (sin grilla, thumbnails ni
// flechas).
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';

const INTERVALO_MS = 3000;
const UMBRAL_SWIPE_PX = 50;
const CONSULTA_DOS_POR_VISTA = '(min-width: 48rem)';

// Interseccion de tres degradados: un ovalo amplio (redondea las esquinas
// y da el fundido radial) y dos lineales que garantizan que la foto llegue
// a transparente en los cuatro bordes, sin dejar una linea recta.
// Fundido largo y con paradas intermedias (curva suave, no lineal): la
// foto empieza a apagarse pronto y llega a cero sin un borde perceptible.
const MASCARA = {
  maskImage: [
    'radial-gradient(ellipse 72% 76% at 50% 48%, black 34%, rgb(0 0 0 / 0.85) 52%, rgb(0 0 0 / 0.5) 72%, rgb(0 0 0 / 0.15) 90%, transparent 100%)',
    `linear-gradient(to right, transparent 0%, rgb(0 0 0 / 0.1) 2%, rgb(0 0 0 / 0.35) 7%, rgb(0 0 0 / 0.75) 15%, black 26%, black 74%, rgb(0 0 0 / 0.75) 85%, rgb(0 0 0 / 0.35) 93%, rgb(0 0 0 / 0.1) 98%, transparent 100%)`,
    `linear-gradient(to bottom, transparent 0%, rgb(0 0 0 / 0.1) 2%, rgb(0 0 0 / 0.35) 7%, rgb(0 0 0 / 0.75) 15%, black 26%, black 74%, rgb(0 0 0 / 0.75) 85%, rgb(0 0 0 / 0.35) 93%, rgb(0 0 0 / 0.1) 98%, transparent 100%)`,
  ].join(', '),
  maskComposite: 'intersect',
  WebkitMaskComposite: 'source-in',
};

const OVERLAY = {
  normal: { base: 'bg-black/15', degradado: 'from-black/75' },
  alta: { base: 'bg-black/30', degradado: 'from-black/85' },
};

function suscribirConsulta(alCambiar) {
  const consulta = window.matchMedia(CONSULTA_DOS_POR_VISTA);
  consulta.addEventListener('change', alCambiar);
  return () => consulta.removeEventListener('change', alCambiar);
}

// Indices a montar: los visibles desde `inicio` y los de la vista siguiente.
function indicesCercanos(inicio, porVista, total) {
  return Array.from({ length: Math.min(porVista * 2, total) }, (_, k) => (inicio + k) % total);
}

export function ServicioSlider({ slides }) {
  const total = slides.length;
  const dosPorVista = useSyncExternalStore(suscribirConsulta, () => window.matchMedia(CONSULTA_DOS_POR_VISTA).matches);
  const porVista = Math.min(dosPorVista ? 2 : 1, total);

  const [inicio, setInicio] = useState(0);
  const [visitados, setVisitados] = useState(() => new Set(indicesCercanos(0, 2, total)));
  const [reinicio, setReinicio] = useState(0);
  const [pausadoHover, setPausadoHover] = useState(false);
  const [pausadoFoco, setPausadoFoco] = useState(false);
  const inicioToque = useRef(null);
  const ignorarClick = useRef(false);

  const pausado = pausadoHover || pausadoFoco;
  const visibles = Array.from({ length: porVista }, (_, k) => (inicio + k) % total);

  // Cambia la vista y marca como "cargables" los nuevos y los siguientes.
  const irA = useCallback(
    (nuevo) => {
      const destino = ((nuevo % total) + total) % total;
      setInicio(destino);
      setVisitados((previos) => {
        const cercanos = indicesCercanos(destino, porVista, total);
        return cercanos.every((i) => previos.has(i)) ? previos : new Set([...previos, ...cercanos]);
      });
    },
    [total, porVista]
  );

  // Navegacion manual: ademas de cambiar la vista reinicia los 3000ms.
  const navegar = useCallback(
    (nuevo) => {
      irA(nuevo);
      setReinicio((n) => n + 1);
    },
    [irA]
  );

  useEffect(() => {
    if (pausado || total <= porVista) return undefined;
    const temporizador = setTimeout(() => irA(inicio + porVista), INTERVALO_MS);
    return () => clearTimeout(temporizador);
  }, [inicio, pausado, total, porVista, reinicio, irA]);

  function alHacerClick(evento) {
    if (ignorarClick.current) {
      ignorarClick.current = false;
      return;
    }
    // El boton "Agendar cita" no debe disparar el cambio de vista.
    if (evento.target.closest('a, button')) return;
    const rect = evento.currentTarget.getBoundingClientRect();
    const enMitadIzquierda = evento.clientX - rect.left < rect.width / 2;
    navegar(enMitadIzquierda ? inicio - porVista : inicio + porVista);
  }

  function alPresionar(evento) {
    if (evento.pointerType === 'mouse') return;
    inicioToque.current = { x: evento.clientX, y: evento.clientY };
  }

  function alSoltar(evento) {
    const origen = inicioToque.current;
    inicioToque.current = null;
    if (!origen) return;
    const dx = evento.clientX - origen.x;
    const dy = evento.clientY - origen.y;
    if (Math.abs(dx) < UMBRAL_SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
    // El navegador puede emitir un click despues del gesto: se ignora
    // para que no avance una vista extra por la logica de mitades.
    ignorarClick.current = true;
    navegar(dx < 0 ? inicio + porVista : inicio - porVista);
  }

  function alPresionarTecla(evento) {
    if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      navegar(inicio - porVista);
    } else if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      navegar(inicio + porVista);
    }
  }

  function alSalirFoco(evento) {
    if (!evento.currentTarget.contains(evento.relatedTarget)) setPausadoFoco(false);
  }

  return (
    <div className="relative">
      <div
        role="region"
        aria-roledescription="carrusel"
        aria-label="Servicios veterinarios"
        tabIndex={0}
        onClick={alHacerClick}
        onKeyDown={alPresionarTecla}
        onPointerDown={alPresionar}
        onPointerUp={alSoltar}
        onPointerCancel={() => {
          inicioToque.current = null;
        }}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setPausadoHover(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setPausadoHover(false)}
        onFocus={() => setPausadoFoco(true)}
        onBlur={alSalirFoco}
        className="grid aspect-[3/4] w-full cursor-pointer touch-pan-y select-none grid-cols-1 gap-2 rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-brand-amber/70 sm:aspect-square md:aspect-[2/1] md:grid-cols-2 lg:aspect-auto lg:h-[clamp(22rem,calc(100svh-20.5rem),46rem)] lg:rounded-3xl"
      >
        {visibles.map((indiceVisible, puesto) => (
          <div key={puesto} className="relative overflow-hidden rounded-2xl lg:rounded-3xl">
            {slides.map((slide, i) => {
              const activa = i === indiceVisible;
              const overlay = OVERLAY[slide.oscuridad] ?? OVERLAY.normal;
              return (
                <div
                  key={slide.id}
                  role="group"
                  aria-roledescription="diapositiva"
                  aria-label={`${i + 1} de ${total}: ${slide.titulo}`}
                  aria-hidden={!activa}
                  inert={!activa}
                  // El segundo puesto entra un instante despues del primero.
                  style={{ transitionDelay: activa ? `${puesto * 120}ms` : '0ms' }}
                  className={`absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                    activa ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                >
                  {/* Foto + overlays, desvanecidos juntos hacia las orillas.
                      Algo mas chica que su puesto (deja aire entre las dos
                      fotos y con los bordes de la tarjeta). */}
                  <div className="absolute inset-x-[4%] bottom-[5%] top-[3%]" style={MASCARA}>
                    {visitados.has(i) && (
                      <img
                        src={slide.imagen}
                        alt={slide.alt}
                        decoding="async"
                        fetchPriority={activa ? 'high' : 'low'}
                        draggable={false}
                        style={{ objectPosition: slide.enfoque }}
                        className={`h-full w-full object-cover transition-transform duration-[1200ms] ease-out motion-reduce:scale-100 motion-reduce:transition-none ${
                          activa ? 'scale-100' : 'scale-[1.02]'
                        }`}
                      />
                    )}
                    <div className={`absolute inset-0 ${overlay.base}`} aria-hidden="true" />
                    <div
                      className={`absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t ${overlay.degradado} via-black/35 to-transparent sm:h-2/3`}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8 lg:pb-12">
                    {/* Jerarquia: por debajo del titulo de la seccion (h2, 30px). */}
                    <h3 className="text-xl font-bold tracking-tight [text-shadow:0_1px_12px_rgb(0_0_0/0.35)] sm:text-2xl">
                      {slide.titulo}
                    </h3>
                    {slide.descripcion && (
                      <p className="mt-1.5 max-w-[40ch] text-sm text-white/90 [text-shadow:0_1px_8px_rgb(0_0_0/0.4)] sm:text-base">
                        {slide.descripcion}
                      </p>
                    )}
                    {slide.href && (
                      <Link
                        to={slide.href}
                        className="boton-glass-ambar mt-4 inline-flex items-center rounded-boton px-5 py-2.5 text-sm font-semibold text-slate-900 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        Agendar cita
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Anuncio para lectores de pantalla: solo habla cuando el
            autoplay esta pausado (si no, interrumpiria cada 3s). */}
        <p className="sr-only" aria-live={pausado ? 'polite' : 'off'} aria-atomic="true">
          {`Servicios ${visibles.map((i) => i + 1).join(' y ')} de ${total}: ${visibles.map((i) => slides[i].titulo).join(' y ')}`}
        </p>
      </div>

      {/* Un punto por servicio; los visibles van resaltados. Van debajo del
          carrusel, fuera de su caja: asi el anillo de foco del teclado
          rodea solo las fotos y no pasa por encima de los puntos. */}
      <div className="mt-3 flex justify-center gap-0.5">
        {slides.map((slide, i) => {
          const activa = visibles.includes(i);
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => navegar(i)}
              aria-label={`Ver ${slide.titulo}`}
              aria-current={activa ? 'true' : undefined}
              className="punto-carrusel group rounded-full px-[9px] py-[9px] outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                  activa ? 'w-5 bg-brand-amber' : 'w-1.5 bg-slate-300 group-hover:bg-slate-200 lg:bg-white/60 lg:group-hover:bg-white'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
