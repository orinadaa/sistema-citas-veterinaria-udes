// components/agendar/PaginaSedeFecha.jsx
// Pagina 2 del flujo de agendamiento (hitos 3 y 4): sede + fecha y hora.
//
// Mapa: sin mapa interactivo embebido (seria una integracion externa
// nueva con API key, fuera del alcance documentado del proyecto). El
// recuadro de ubicacion muestra la direccion y dos hipervinculos de
// salida a Google Maps ("Cómo llegar" / "Ver en Google Maps"), armados
// con la direccion de la sede -- no hay intercambio de datos, solo abre
// una pestaña nueva.
import { Seccion } from './Seccion';
import { SedeListCard } from './SedeListCard';
import { DatePickerCalendar } from './DatePickerCalendar';
import { TimeSlotPicker } from './TimeSlotPicker';
import { IconoUbicacion } from '../icons';

function consultaMaps(sede) {
  return encodeURIComponent([sede.nombre, sede.direccion, sede.ciudad, 'Colombia'].filter(Boolean).join(', '));
}

function Ubicacion({ sede }) {
  if (!sede) {
    return (
      <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center text-sm text-slate-400">
        <IconoUbicacion className="h-7 w-7" />
        Selecciona una sede para ver cómo llegar.
      </div>
    );
  }

  const q = consultaMaps(sede);
  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl bg-gradient-to-b from-brand-blue-500 to-brand-blue-800 p-5 text-white">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
        <IconoUbicacion className="h-6 w-6" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Ubicación</p>
        <p className="mt-1 font-semibold">{sede.nombre}</p>
        <p className="mt-1 text-sm text-blue-50">{sede.direccion ? `${sede.direccion}, ${sede.ciudad}` : sede.ciudad}</p>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${q}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-brand-blue transition hover:bg-blue-50"
        >
          Cómo llegar
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${q}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl px-4 py-2 text-center text-sm font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/10"
        >
          Ver en Google Maps
        </a>
      </div>
    </div>
  );
}

export function PaginaSedeFecha({
  sedes,
  horariosPorSede,
  sedeId,
  servicioId,
  fecha,
  franja,
  motivo,
  refrescoDisponibilidad,
  onSeleccionarSede,
  onSeleccionarFecha,
  onSeleccionarFranja,
  onCambiarMotivo,
}) {
  const sede = sedes.find((s) => s.id === sedeId);
  const horarioSede = sedeId ? horariosPorSede[sedeId] : undefined;
  const diasAbiertos = horarioSede ? new Set(horarioSede.map((h) => h.dia_semana)) : null;

  return (
    <div className="flex flex-col gap-6">
      <Seccion numero={3} titulo="Selecciona la sede" descripcion="¿Dónde quieres que atiendan a tu mascota?">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
          <div className="flex flex-col gap-3">
            {sedes.map((s) => (
              <SedeListCard
                key={s.id}
                sede={s}
                horario={horariosPorSede[s.id]}
                seleccionada={s.id === sedeId}
                onSeleccionar={() => onSeleccionarSede(s.id)}
              />
            ))}
          </div>
          <Ubicacion sede={sede} />
        </div>
      </Seccion>

      <Seccion numero={4} titulo="Selecciona la fecha y hora" descripcion="Solo se muestran los horarios con médicos disponibles.">
        {!sede ? (
          <p className="text-sm text-slate-500">Selecciona primero una sede.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            <DatePickerCalendar valor={fecha} onChange={onSeleccionarFecha} diasAbiertos={diasAbiertos} />
            <div>
              <p className="mb-4 font-heading text-base font-semibold text-brand-navy">Horarios disponibles</p>
              <TimeSlotPicker
                key={refrescoDisponibilidad}
                sedeId={sedeId}
                servicioId={servicioId}
                fecha={fecha}
                valor={franja}
                onChange={onSeleccionarFranja}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-1.5 border-t border-slate-100 pt-5">
          <label htmlFor="motivo-cita" className="text-sm font-medium text-slate-700">
            Motivo de la consulta (opcional)
          </label>
          <textarea
            id="motivo-cita"
            rows={2}
            maxLength={255}
            value={motivo}
            onChange={(e) => onCambiarMotivo(e.target.value)}
            placeholder="Ej. Revisión anual, vómito desde ayer, refuerzo de vacuna..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
        </div>
      </Seccion>
    </div>
  );
}
