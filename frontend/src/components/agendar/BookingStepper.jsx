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
