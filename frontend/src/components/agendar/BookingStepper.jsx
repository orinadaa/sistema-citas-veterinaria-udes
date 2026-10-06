// components/agendar/BookingStepper.jsx
// Los 5 hitos del flujo de agendamiento. El contenido se agrupa en 3
// paginas (1: mascota+servicio, 2: sede+fecha/hora, 3: confirmacion):
// todos los hitos de la pagina activa se resaltan juntos (decision
// confirmada con la usuaria -- el mockup resaltaba solo el primero) y
// los de paginas ya completadas muestran check.
import { useLayoutEffect, useRef } from 'react';
import { IconoCheck } from '../icons';

const DURACION_MUDANZA_MS = 550;
const CURVA_MUDANZA = 'cubic-bezier(0.22, 1, 0.36, 1)';

const HITOS = [
  { numero: 1, etiqueta: 'Mascota', pagina: 1 },
  { numero: 2, etiqueta: 'Servicio', pagina: 1 },
  { numero: 3, etiqueta: 'Sede', pagina: 2 },
  { numero: 4, etiqueta: 'Fecha y hora', pagina: 2 },
  { numero: 5, etiqueta: 'Confirmación', pagina: 3 },
];

function estadoDelHito(hito, paginaActual) {
  if (hito.pagina < paginaActual) return 'completado';
  if (hito.pagina === paginaActual) return 'activo';
  return 'pendiente';
}

export function BookingStepper({ paginaActual }) {
  return (
    <ol className="flex items-start" aria-label="Pasos para agendar la cita">
      {HITOS.map((hito, indice) => {
        const estado = estadoDelHito(hito, paginaActual);
        const siguiente = HITOS[indice + 1];
        // La linea hacia el siguiente hito se pinta si ese hito ya se
        // alcanzo (completado o activo).
        const lineaAlcanzada = siguiente && estadoDelHito(siguiente, paginaActual) !== 'pendiente';

        return (
          <li
            key={hito.numero}
            className="relative flex flex-1 flex-col items-center gap-2 text-center"
            aria-current={estado === 'activo' ? 'step' : undefined}
          >
            {siguiente && (
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-4 h-0.5 w-full ${lineaAlcanzada ? 'bg-brand-blue' : 'bg-slate-200'}`}
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                estado === 'completado'
                  ? 'bg-brand-green text-white'
                  : estado === 'activo'
                    ? 'bg-brand-blue text-white ring-4 ring-blue-100'
                    : 'border-2 border-slate-200 bg-white text-slate-400'
              }`}
            >
              {estado === 'completado' ? <IconoCheck className="h-4 w-4" /> : hito.numero}
            </span>
            <span
              className={`text-xs font-medium sm:text-sm ${
                estado === 'pendiente' ? 'text-slate-400' : estado === 'activo' ? 'text-brand-blue' : 'text-slate-700'
              }`}
            >
              {hito.etiqueta}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Variante vertical y compacta, fija al costado izquierdo de la pantalla.
// Aparece cuando la tarjeta horizontal llega a la topbar (al bajar para
// tocar "Continuar"). Para que se lea como el MISMO stepper mudandose al
// costado (y no como un elemento nuevo), entra con una animacion FLIP:
// arranca encima de la tarjeta horizontal (`origenRef`), achicado y
// transparente, y viaja hasta su lugar mientras la tarjeta se desvanece
// hacia la izquierda. Al volver arriba hace el camino inverso. Mismo lenguaje visual que la pildora de
// la topbar (brand-blue-800 al 75% con blur, forma de capsula). Solo
// circulos: la etiqueta de cada hito va en aria-label y en el tooltip.
export function BookingStepperLateral({ paginaActual, visible, origenRef }) {
  const railRef = useRef(null);
  const primeraVez = useRef(true);

  useLayoutEffect(() => {
    const rail = railRef.current;
    const origen = origenRef?.current;
    // Sin animacion en el primer render, con reduced-motion o si el rail
    // esta oculto por breakpoint (display: none debajo de lg).
    if (primeraVez.current) {
      primeraVez.current = false;
      return undefined;
    }
    // (offsetParent no sirve para detectar display:none: en un elemento
    // position:fixed siempre es null.)
    if (!rail || !origen || getComputedStyle(rail).display === 'none') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    // Desplazamiento desde el lugar del rail hasta el inicio (lado
    // izquierdo, centro vertical) de la tarjeta horizontal.
    const r = rail.getBoundingClientRect();
    const o = origen.getBoundingClientRect();
    const dx = o.left + 24 - (r.left + r.width / 2);
    const dy = o.top + o.height / 2 - (r.top + r.height / 2);
    const enTarjeta = { transform: `translate(${dx}px, ${dy}px) scale(0.5)`, opacity: 0 };
    const enSuLugar = { transform: 'translate(0, 0) scale(1)', opacity: 1 };
    const animacion = rail.animate(visible ? [enTarjeta, enSuLugar] : [enSuLugar, enTarjeta], {
      duration: DURACION_MUDANZA_MS,
      easing: CURVA_MUDANZA,
    });
    return () => animacion.cancel();
  }, [visible, origenRef]);

  return (
    <nav
      ref={railRef}
      aria-label="Progreso de la cita"
      aria-hidden={!visible}
      inert={!visible}
      className={`fixed top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-brand-blue-800/75 px-2 py-3 shadow-[0_12px_32px_-12px_rgb(6_51_138/0.5)] ring-1 ring-white/12 backdrop-blur-[20px] lg:block ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      // Pegado al borde del contenido (max-w-7xl = 80rem) cuando hay margen
      // libre; si no, a 12px del borde de la pantalla.
      style={{ left: 'max(12px, calc((100vw - 80rem) / 2 - 64px))' }}
    >
      <ol className="flex flex-col items-center">
        {HITOS.map((hito, indice) => {
          const estado = estadoDelHito(hito, paginaActual);
          const siguiente = HITOS[indice + 1];
          const lineaAlcanzada = siguiente && estadoDelHito(siguiente, paginaActual) !== 'pendiente';
          return (
            <li
              key={hito.numero}
              className="flex flex-col items-center"
              aria-current={estado === 'activo' ? 'step' : undefined}
            >
              <span
                title={hito.etiqueta}
                aria-label={`${hito.numero}. ${hito.etiqueta}${estado === 'completado' ? ' (completado)' : estado === 'activo' ? ' (paso actual)' : ''}`}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                  estado === 'completado'
                    ? 'bg-brand-green text-white'
                    : estado === 'activo'
                      ? 'bg-white text-brand-blue ring-4 ring-white/25'
                      : 'border-2 border-white/30 text-white/60'
                }`}
              >
                {estado === 'completado' ? <IconoCheck className="h-4 w-4" /> : hito.numero}
              </span>
              {siguiente && (
                <span aria-hidden="true" className={`my-1 h-5 w-0.5 rounded-full ${lineaAlcanzada ? 'bg-white' : 'bg-white/25'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
