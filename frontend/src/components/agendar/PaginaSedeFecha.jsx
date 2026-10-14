// components/agendar/PaginaSedeFecha.jsx
// Pagina 2 del flujo de agendamiento (hitos 3 y 4): sede + fecha y hora.
import { Seccion } from './Seccion';
import { SedeListCard } from './SedeListCard';
import { DatePickerCalendar } from './DatePickerCalendar';
import { TimeSlotPicker } from './TimeSlotPicker';
import { AreaTexto, Boton, Tarjeta } from '../vetui';
import { IconoUbicacion } from '../icons';
import { urlComoLlegar, urlVerEnMaps } from '../../utils/mapas';

function Ubicacion({ sede }) {
  if (!sede) {
    return (
      <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-tarjeta border-2 border-dashed border-slate-300 p-5 text-center text-sm text-slate-700">
        <IconoUbicacion className="h-7 w-7" />
        Selecciona una sede para ver cómo llegar.
      </div>
    );
  }

  return (
    <Tarjeta tono="celeste" className="flex h-full flex-col gap-4 p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-brand-blue-700">
        <IconoUbicacion className="h-6 w-6" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">Ubicación</p>
        <p className="mt-1 font-semibold">{sede.nombre}</p>
        <p className="mt-1 text-sm text-slate-700">{sede.direccion ? `${sede.direccion}, ${sede.ciudad}` : sede.ciudad}</p>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <Boton as="a" variante="contorno" tamano="sm" href={urlComoLlegar(sede)} target="_blank" rel="noopener noreferrer">
          Cómo llegar
        </Boton>
        <Boton as="a" variante="contorno" tamano="sm" href={urlVerEnMaps(sede)} target="_blank" rel="noopener noreferrer">
          Ver en Google Maps
        </Boton>
      </div>
    </Tarjeta>
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
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
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
          <p className="text-sm text-slate-700">Selecciona primero una sede.</p>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-2">
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

        <div className="mt-6 border-t border-slate-200 pt-5">
          <AreaTexto
            id="motivo-cita"
            etiqueta="Motivo de la consulta (opcional)"
            rows={2}
            maxLength={255}
            value={motivo}
            onChange={(e) => onCambiarMotivo(e.target.value)}
            placeholder="Ej. Revisión anual, vómito desde ayer, refuerzo de vacuna..."
          />
        </div>
      </Seccion>
    </div>
  );
}
