// components/agendar/BookingStepper.jsx
// Los 5 hitos del flujo de agendamiento. El contenido se agrupa en 3
// paginas (1: mascota+servicio, 2: sede+fecha/hora, 3: confirmacion):
// todos los hitos de la pagina activa se resaltan juntos (decision
// confirmada con la usuaria -- el mockup resaltaba solo el primero) y
// los de paginas ya completadas muestran check.
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

// Variante vertical, fija al costado izquierdo (el resumen de la cita ocupa
// el derecho). Suelta sobre el fondo de la pagina: sin tarjeta, borde ni
// sombra; solo circulos, linea conectora y el boton Cancelar.
// - Activo: circulo mas grande (48px), brand-blue, numero blanco en negrita.
// - Completado: mismo estilo que el horizontal (verde con check), 40px.
// - Pendiente: 40px, fondo blanco, borde gris claro, numero gris.
//
// Crossfade con la tarjeta horizontal atado al progreso de la topbar
// (--flow en <html>, ver Navbar.jsx): opacidad = --flow, sin listener
// propio. Con reduced-motion el cambio es directo (round()). Mientras esta
// casi transparente (data-topbar-progreso="inicio") queda invisible: no
// recibe clicks ni foco. Solo desde lg.
export function BookingStepperLateral({ paginaActual, onCancelar }) {
  return (
    <nav
      aria-label="Progreso de la cita"
      className="invisible fixed top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-5 [opacity:var(--flow,0)] motion-reduce:[opacity:round(var(--flow,0))] lg:flex [[data-topbar-progreso=fin]_&]:visible [[data-topbar-progreso=medio]_&]:visible"
      // Columna de 96px (ancho del boton Cancelar) pegada al borde del
      // contenido (max-w-7xl = 80rem) cuando hay margen; si no, a 12px.
      style={{ left: 'max(12px, calc((100vw - 80rem) / 2 - 96px))', width: '96px' }}
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
                className={`flex items-center justify-center rounded-full font-semibold transition-colors ${
                  estado === 'activo'
                    ? 'h-12 w-12 bg-brand-blue text-base font-bold text-white shadow-sm'
                    : estado === 'completado'
                      ? 'h-10 w-10 bg-brand-green text-sm text-white'
                      : 'h-10 w-10 border border-slate-200 bg-white text-sm text-slate-400'
                }`}
              >
                {estado === 'completado' ? <IconoCheck className="h-4 w-4" /> : hito.numero}
              </span>
              {siguiente && (
                <span aria-hidden="true" className={`my-1.5 h-6 w-0.5 rounded-full ${lineaAlcanzada ? 'bg-brand-blue' : 'bg-slate-200'}`} />
              )}
            </li>
          );
        })}
      </ol>
      {onCancelar && (
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-boton border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
      )}
    </nav>
  );
}
