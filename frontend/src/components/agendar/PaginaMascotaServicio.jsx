// components/agendar/PaginaMascotaServicio.jsx
// Pagina 1 del flujo de agendamiento (hitos 1 y 2): mascota + servicio.
// La tarjeta "+ Agregar mascota" abre el mismo SidePanel de "Mis
// mascotas" (FormularioMascotaPanel), que AgendarCitaPage renderiza
// fuera del contenido `inert`; la mascota nueva queda seleccionada.
import { SelectableCard } from './SelectableCard';
import { Seccion } from './Seccion';
import { EstadoError } from '../ui/EstadoError';
import { especieYRaza, edadYPeso } from '../../utils/mascota';
import { iconoDeServicio } from '../../utils/iconoServicio';
import { IconoMas, IconoPata } from '../icons';

function Esqueleto({ cantidad = 3 }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

export function PaginaMascotaServicio({
  mascotas,
  servicios,
  cargando,
  errorCarga,
  onReintentar,
  mascotaId,
  servicioId,
  onSeleccionarMascota,
  onSeleccionarServicio,
  onAgregarMascota,
}) {
  if (errorCarga) return <EstadoError mensaje={errorCarga} onReintentar={onReintentar} />;

  return (
    <div className="flex flex-col gap-6">
      <Seccion numero={1} titulo="Selecciona la mascota" descripcion="¿Para quién es la cita?">
        {cargando ? (
          <Esqueleto />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {mascotas.map((mascota) => (
              <SelectableCard
                key={mascota.id}
                seleccionada={mascota.id === mascotaId}
                onSeleccionar={() => onSeleccionarMascota(mascota.id)}
              >
                <div className="flex items-center gap-3 pr-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-brand-amber">
                    <IconoPata className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{mascota.nombre}</p>
                    <p className="truncate text-sm text-slate-500">{especieYRaza(mascota) || 'Sin especie registrada'}</p>
                    {edadYPeso(mascota) && <p className="text-xs text-slate-400">{edadYPeso(mascota)}</p>}
                  </div>
                </div>
              </SelectableCard>
            ))}

            <button
              type="button"
              onClick={onAgregarMascota}
              className="flex min-h-[5.5rem] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-500 transition hover:border-brand-blue hover:text-brand-blue"
            >
              <IconoMas className="h-5 w-5" />
              Agregar mascota
            </button>
          </div>
        )}
      </Seccion>

      <Seccion numero={2} titulo="Selecciona el servicio" descripcion="¿Qué necesita tu mascota?">
        {cargando ? (
          <Esqueleto cantidad={6} />
        ) : servicios.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No hay servicios disponibles en este momento.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {servicios.map((servicio) => {
              const Icono = iconoDeServicio(servicio.nombre);
              return (
                <SelectableCard
                  key={servicio.id}
                  seleccionada={servicio.id === servicioId}
                  onSeleccionar={() => onSeleccionarServicio(servicio.id)}
                >
                  <div className="flex items-start gap-3 pr-6">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
                      <Icono className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{servicio.nombre}</p>
                      {servicio.descripcion && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{servicio.descripcion}</p>
                      )}
                    </div>
                  </div>
                </SelectableCard>
              );
            })}
          </div>
        )}
      </Seccion>
    </div>
  );
}
