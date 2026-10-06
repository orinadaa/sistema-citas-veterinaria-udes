// components/landing/ServicioSlider.jsx
// Slider fotografico de servicios del landing: una sola foto grande a la
// vez (sin grilla, thumbnails ni flechas). Capas por slide: foto
// (object-cover) -> overlay oscuro general -> degradado inferior ->
// texto abajo a la izquierda. La intensidad del overlay se ajusta por
// foto (`oscuridad`): las fotos con fondo claro (paredes blancas, batas)
// necesitan mas oscuridad para que el texto blanco cumpla WCAG AA.
//
// Comportamiento:
// - Autoplay cada 3000ms con UN solo setTimeout, recreado en cada cambio
//   de slide (el cleanup del efecto elimina el anterior, nunca hay dos
//   corriendo). Toda interaccion manual incrementa `reinicio`, lo que
//   reinicia el conteo aunque el indice no cambie.
// - Desktop: click en mitad izquierda = anterior, mitad derecha =
//   siguiente; hover pausa el autoplay.
// - Movil: swipe horizontal con pointer events + `touch-pan-y`, asi el
//   navegador sigue manejando el scroll vertical de la pagina (si el
//   gesto es vertical llega `pointercancel` y no se navega).
// - Teclado: flechas izquierda/derecha con el foco en el slider; el foco
//   dentro del slider tambien pausa el autoplay.
// - Lazy loading: solo se monta la <img> del slide actual, el siguiente
//   y los ya visitados (los demas no descargan nada todavia).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const INTERVALO_MS = 3000;
const UMBRAL_SWIPE_PX = 50;

const OVERLAY = {
  normal: { base: 'bg-black/15', degradado: 'from-black/75' },
  alta: { base: 'bg-black/30', degradado: 'from-black/85' },
};

function indicesIniciales(total) {
  return new Set(total > 1 ? [0, 1] : [0]);
}

export function ServicioSlider({ slides }) {
  const total = slides.length;
  const [indice, setIndice] = useState(0);
  const [visitados, setVisitados] = useState(() => indicesIniciales(total));
  const [reinicio, setReinicio] = useState(0);
  const [pausadoHover, setPausadoHover] = useState(false);
  const [pausadoFoco, setPausadoFoco] = useState(false);
  const inicioToque = useRef(null);
  const ignorarClick = useRef(false);

  const pausado = pausadoHover || pausadoFoco;

  // Cambia de slide y marca el nuevo + el siguiente como "cargables".
  const irA = useCallback(
    (nuevo) => {
      const destino = (nuevo + total) % total;
      setIndice(destino);
      setVisitados((previos) => {
        const siguiente = (destino + 1) % total;
        if (previos.has(destino) && previos.has(siguiente)) return previos;
        return new Set([...previos, destino, siguiente]);
      });
    },
    [total]
  );

  // Navegacion manual: ademas de cambiar de slide reinicia los 3000ms.
  const navegar = useCallback(
    (nuevo) => {
      irA(nuevo);
      setReinicio((n) => n + 1);
    },
    [irA]
  );

  useEffect(() => {
    if (pausado || total < 2) return undefined;
    const temporizador = setTimeout(() => irA(indice + 1), INTERVALO_MS);
    return () => clearTimeout(temporizador);
  }, [indice, pausado, total, reinicio, irA]);

  function alHacerClick(evento) {
    if (ignorarClick.current) {
      ignorarClick.current = false;
      return;
    }
    // El boton "Agendar cita" no debe disparar el cambio de slide.
    if (evento.target.closest('a, button')) return;
    const rect = evento.currentTarget.getBoundingClientRect();
    const enMitadIzquierda = evento.clientX - rect.left < rect.width / 2;
    navegar(enMitadIzquierda ? indice - 1 : indice + 1);
  }

  function alPresionar(evento) {
    if (evento.pointerType === 'mouse') return;
    inicioToque.current = { x: evento.clientX, y: evento.clientY };
  }

  function alSoltar(evento) {
    const inicio = inicioToque.current;
    inicioToque.current = null;
    if (!inicio) return;
    const dx = evento.clientX - inicio.x;
    const dy = evento.clientY - inicio.y;
    if (Math.abs(dx) < UMBRAL_SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
    // El navegador puede emitir un click despues del gesto: se ignora
    // para que no avance un slide extra por la logica de mitades.
    ignorarClick.current = true;
    navegar(dx < 0 ? indice + 1 : indice - 1);
  }

  function alPresionarTecla(evento) {
    if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      navegar(indice - 1);
    } else if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      navegar(indice + 1);
    }
  }

  function alSalirFoco(evento) {
    if (!evento.currentTarget.contains(evento.relatedTarget)) setPausadoFoco(false);
  }

  const actual = slides[indice];

  return (
    <div>
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
        className="relative aspect-[4/5] w-full cursor-pointer touch-pan-y select-none overflow-hidden rounded-2xl bg-slate-900 shadow-xl outline-none focus-visible:ring-4 focus-visible:ring-brand-amber/70 sm:aspect-[16/10] lg:aspect-[2/1] lg:rounded-3xl"
      >
        {slides.map((slide, i) => {
          const activa = i === indice;
          const overlay = OVERLAY[slide.oscuridad] ?? OVERLAY.normal;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${total}: ${slide.titulo}`}
              aria-hidden={!activa}
              inert={!activa}
              className={`absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                activa ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              {visitados.has(i) && (
                <img
                  src={slide.imagen}
                  alt={slide.alt}
                  decoding="async"
                  fetchPriority={activa ? 'high' : 'low'}
                  draggable={false}
                  className={`h-full w-full object-cover transition-transform duration-[1200ms] ease-out motion-reduce:scale-100 motion-reduce:transition-none ${
                    slide.enfoque
                  } ${activa ? 'scale-100' : 'scale-[1.02]'}`}
                />
              )}

              <div className={`absolute inset-0 ${overlay.base}`} aria-hidden="true" />
              <div
                className={`absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t ${overlay.degradado} via-black/35 to-transparent sm:h-2/3`}
                aria-hidden="true"
              />

              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
                <h3 className="text-3xl font-bold tracking-tight [text-shadow:0_1px_12px_rgb(0_0_0/0.35)] sm:text-4xl lg:text-5xl">
                  {slide.titulo}
                </h3>
                {slide.descripcion && (
                  <p className="mt-2 max-w-[48ch] text-base text-white/90 [text-shadow:0_1px_8px_rgb(0_0_0/0.4)] sm:mt-3 sm:text-lg">
                    {slide.descripcion}
                  </p>
                )}
                {slide.href && (
                  <Link
                    to={slide.href}
                    className="mt-5 inline-flex items-center rounded-full bg-brand-amber px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-md transition hover:bg-brand-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Agendar cita
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {/* Anuncio para lectores de pantalla: solo habla cuando el
            autoplay esta pausado (si no, interrumpiria cada 3s). */}
        <p className="sr-only" aria-live={pausado ? 'polite' : 'off'} aria-atomic="true">
          {`Servicio ${indice + 1} de ${total}: ${actual.titulo}`}
        </p>
      </div>

      <div className="mt-5 flex justify-center gap-1">
        {slides.map((slide, i) => {
          const activa = i === indice;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => navegar(i)}
              aria-label={`Ver ${slide.titulo}`}
              aria-current={activa ? 'true' : undefined}
              className="group rounded-full p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                  activa ? 'w-7 bg-brand-amber' : 'w-2 bg-slate-300 group-hover:bg-slate-400'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
