// components/agendar/PaginaMascotaServicio.jsx
// Pagina 1 del flujo de agendamiento (hitos 1 y 2): mascota + servicio.
// La tarjeta "+ Agregar mascota" abre el mismo SidePanel de "Mis
// mascotas" (FormularioMascotaPanel), que AgendarCitaPage renderiza
// fuera del contenido `inert`; la mascota nueva queda seleccionada.
import { SelectableCard } from './SelectableCard';
import { Seccion } from './Seccion';
import { EstadoError, EstadoVacio, Esqueleto as Bloque } from '../vetui';
import { especieYRaza, edadYPeso } from '../../utils/mascota';
import { iconoDeServicio } from '../../utils/iconoServicio';
import { IconoMas } from '../icons';
import { AvatarMascota } from '../cliente/AvatarMascota';

function Esqueleto({ cantidad = 3 }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cantidad }, (_, i) => (
        <Bloque key={i} />
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
                  <AvatarMascota mascota={mascota} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{mascota.nombre}</p>
                    <p className="truncate text-sm text-slate-700">{especieYRaza(mascota) || 'Sin especie registrada'}</p>
                    {edadYPeso(mascota) && <p className="text-xs font-medium text-slate-700">{edadYPeso(mascota)}</p>}
                  </div>
                </div>
              </SelectableCard>
            ))}

            <button
              type="button"
              onClick={onAgregarMascota}
              className="hover-ilumina flex min-h-[5.5rem] items-center justify-center gap-2 rounded-tarjeta border-2 border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-700 transition hover:border-brand-blue hover:text-brand-blue-700"
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
          <EstadoVacio>No hay servicios disponibles en este momento.</EstadoVacio>
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
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-brand-blue-700">
                      <Icono className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{servicio.nombre}</p>
                      {servicio.descripcion && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-700">{servicio.descripcion}</p>
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
