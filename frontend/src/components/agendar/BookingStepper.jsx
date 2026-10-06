// components/agendar/BookingStepper.jsx
// Los 5 hitos del flujo de agendamiento. El contenido se agrupa en 3
// paginas (1: mascota+servicio, 2: sede+fecha/hora, 3: confirmacion):
// todos los hitos de la pagina activa se resaltan juntos (decision
// confirmada con la usuaria -- el mockup resaltaba solo el primero) y
// los de paginas ya completadas muestran check.
//
// Ambas variantes (horizontal y lateral) son navegables: cada hito al que
// se puede ir (`puedeIrAHito`, decidido por AgendarCitaPage) es un boton
// que llama a `onIrAHito`; los demas se muestran sin interaccion.
import { IconoCheck } from '../icons';

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

function etiquetaAccesible(hito, estado, navegable) {
  const sufijo = estado === 'completado' ? ' (completado)' : estado === 'activo' ? ' (paso actual)' : '';
  return `${navegable ? 'Ir al paso ' : ''}${hito.numero}. ${hito.etiqueta}${sufijo}`;
}

// Boton si el hito es navegable; si no, un elemento sin interaccion.
function Hito({ navegable, onClick, etiqueta, className, children }) {
  if (navegable) {
    return (
      <button type="button" onClick={onClick} aria-label={etiqueta} title={etiqueta} className={className}>
        {children}
      </button>
    );
  }
  return (
    <span aria-label={etiqueta} title={etiqueta} className={className}>
      {children}
    </span>
  );
}

export function BookingStepper({ paginaActual, puedeIrAHito = () => false, onIrAHito }) {
  return (
    <ol className="flex items-start" aria-label="Pasos para agendar la cita">
      {HITOS.map((hito, indice) => {
        const estado = estadoDelHito(hito, paginaActual);
        const siguiente = HITOS[indice + 1];
        // La linea hacia el siguiente hito se pinta si ese hito ya se
        // alcanzo (completado o activo).
        const lineaAlcanzada = siguiente && estadoDelHito(siguiente, paginaActual) !== 'pendiente';
        const navegable = puedeIrAHito(hito);

        return (
          <li
            key={hito.numero}
            className="relative flex flex-1 justify-center"
            aria-current={estado === 'activo' ? 'step' : undefined}
          >
            {siguiente && (
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-4 h-0.5 w-full ${lineaAlcanzada ? 'bg-white' : 'bg-white/25'}`}
              />
            )}
            <Hito
              navegable={navegable}
              onClick={() => onIrAHito?.(hito)}
              etiqueta={etiquetaAccesible(hito, estado, navegable)}
              className={`group relative z-10 flex flex-col items-center gap-2 text-center ${
                navegable ? 'cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white' : ''
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                  estado === 'completado'
                    ? 'bg-brand-green text-white'
                    : estado === 'activo'
                      ? 'bg-white text-brand-blue-800 ring-4 ring-brand-amber/70'
                      : 'border-2 border-white/45 bg-white/5 text-blue-50'
                } ${navegable ? 'group-hover:scale-110' : ''}`}
              >
                {estado === 'completado' ? <IconoCheck className="h-4 w-4" /> : hito.numero}
              </span>
              <span
                className={`text-xs font-medium sm:text-sm ${
                  estado === 'pendiente' ? 'text-blue-100' : estado === 'activo' ? 'font-semibold text-white' : 'text-blue-50'
                } ${navegable ? 'group-hover:underline' : ''}`}
              >
                {hito.etiqueta}
              </span>
            </Hito>
          </li>
        );
      })}
    </ol>
  );
}

// Variante vertical, fija al costado izquierdo (el resumen de la cita ocupa
// el derecho). Suelta sobre el fondo de la pagina: sin tarjeta, solo
// circulos y linea conectora (vetUI, fondo oscuro).
// - Activo: circulo mas grande (48px), blanco con anillo ambar (el ambar
//   es el color de "activo" en vetUI) y numero azul en negrita.
// - Completado: mismo estilo que el horizontal (verde con check), 40px.
// - Pendiente: 40px, circulo de vidrio con numero claro.
//
// Relevo con la tarjeta horizontal atado al progreso de la topbar (--flow
// en <html>, ver Navbar.jsx), sin listener propio: aparece entre flow 0.7
// y 1, justo antes de que la tarjeta termine de irse (0.8). Antes de la
// decima 7 queda invisible (sin clicks ni foco). Con reduced-motion no hay
// fundido: solo cambia la visibilidad. Solo desde lg.
export function BookingStepperLateral({ paginaActual, puedeIrAHito = () => false, onIrAHito }) {
  return (
    <nav
      aria-label="Progreso de la cita"
      className="invisible fixed top-1/2 z-30 hidden -translate-y-1/2 [opacity:clamp(0,calc((var(--flow,0)_-_0.7)_/_0.3),1)] motion-reduce:[opacity:1] lg:block [[data-topbar-decima='7']_&]:visible [[data-topbar-decima='8']_&]:visible [[data-topbar-decima='9']_&]:visible [[data-topbar-decima='10']_&]:visible"
      // Pegado al borde del contenido (max-w-7xl = 80rem) cuando hay margen
      // libre; si no, a 12px del borde de la pantalla.
      style={{ left: 'max(12px, calc((100vw - 80rem) / 2 - 64px))' }}
    >
      <ol className="flex flex-col items-center">
        {HITOS.map((hito, indice) => {
          const estado = estadoDelHito(hito, paginaActual);
          const siguiente = HITOS[indice + 1];
          const lineaAlcanzada = siguiente && estadoDelHito(siguiente, paginaActual) !== 'pendiente';
          const navegable = puedeIrAHito(hito);
          return (
            <li
              key={hito.numero}
              className="flex flex-col items-center"
              aria-current={estado === 'activo' ? 'step' : undefined}
            >
              <Hito
                navegable={navegable}
                onClick={() => onIrAHito?.(hito)}
                etiqueta={etiquetaAccesible(hito, estado, navegable)}
                className={`flex items-center justify-center rounded-full font-semibold transition ${
                  estado === 'activo'
                    ? 'h-12 w-12 bg-white text-base font-bold text-brand-blue-800 shadow-sm ring-4 ring-brand-amber/70'
                    : estado === 'completado'
                      ? 'h-10 w-10 bg-brand-green text-sm text-white'
                      : 'vidrio h-10 w-10 text-sm text-blue-50'
                } ${navegable ? 'cursor-pointer outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue-800' : ''}`}
              >
                {estado === 'completado' ? <IconoCheck className="h-4 w-4" /> : hito.numero}
              </Hito>
              {siguiente && (
                <span aria-hidden="true" className={`my-1.5 h-6 w-0.5 rounded-full ${lineaAlcanzada ? 'bg-white' : 'bg-white/25'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
