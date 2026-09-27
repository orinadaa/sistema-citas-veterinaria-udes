// components/agendar/BookingSummarySidebar.jsx
// Resumen lateral pegajoso (sticky) del flujo de agendamiento. Cada
// fila tiene "Cambiar", que regresa a la pagina donde se elige ese dato
// sin perder las demas selecciones (el estado vive en AgendarCitaPage).
// top-24: el Navbar publico es sticky (h ~ 4.5rem, z-40), el resumen
// queda debajo de el en vez de pasar por detras.
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { especieYRaza } from '../../utils/mascota';
import { IconoCalendario, IconoEstetoscopio, IconoPata, IconoReloj, IconoUbicacion } from '../icons';

function Fila({ icono: Icono, etiqueta, valor, detalle, placeholder, onCambiar }) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
        <Icono className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{etiqueta}</p>
        {valor ? (
          <>
            <p className="truncate text-sm font-semibold text-slate-900">{valor}</p>
            {detalle && <p className="text-xs text-slate-500">{detalle}</p>}
          </>
        ) : (
          <p className="text-sm text-slate-400">{placeholder}</p>
        )}
      </div>
      {valor && onCambiar && (
        <button
          type="button"
          onClick={onCambiar}
          className="shrink-0 text-xs font-semibold text-brand-blue transition hover:text-brand-blue-700 hover:underline"
        >
          Cambiar
        </button>
      )}
    </div>
  );
}

export function BookingSummarySidebar({ mascota, servicio, sede, fechaHora, sedeSugerida, onIrAPagina }) {
  return (
    <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-24">
      <h2 className="font-heading text-base font-semibold text-brand-navy">Resumen de tu cita</h2>

      <div className="mt-2 divide-y divide-slate-100">
        <Fila
          icono={IconoPata}
          etiqueta="Mascota"
          valor={mascota?.nombre}
          detalle={mascota ? especieYRaza(mascota) : undefined}
          placeholder="Selecciona una mascota"
          onCambiar={() => onIrAPagina(1)}
        />
        <Fila
          icono={IconoEstetoscopio}
          etiqueta="Servicio"
          valor={servicio?.nombre}
          detalle={servicio ? `Duración estimada: ${servicio.duracion_minutos} minutos` : undefined}
          placeholder="Selecciona un servicio"
          onCambiar={() => onIrAPagina(1)}
        />
        <Fila
          icono={IconoUbicacion}
          etiqueta="Sede"
          valor={sede?.nombre}
          detalle={sede ? (sedeSugerida ? 'Sede de tu última cita' : sede.direccion || sede.ciudad) : undefined}
          placeholder="Selecciona una sede"
          onCambiar={() => onIrAPagina(2)}
        />
        <Fila
          icono={fechaHora ? IconoCalendario : IconoReloj}
          etiqueta="Fecha y hora"
          valor={fechaHora ? formatearFechaLarga(fechaHora) : null}
          detalle={fechaHora ? formatearHora(fechaHora) : undefined}
          placeholder="Selecciona una fecha y hora"
          onCambiar={() => onIrAPagina(2)}
        />
      </div>
    </aside>
  );
}
