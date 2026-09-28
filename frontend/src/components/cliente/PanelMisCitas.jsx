// components/cliente/PanelMisCitas.jsx
// Pestaña "Mis citas" del panel del cliente (RF-15, con reprogramar
// RF-08 y cancelar RF-09 vía DetalleCitaPanel). Filtros por estado
// como pills con conteo real -- nunca un numero inventado. Cada fila:
// foto, mascota, fecha/hora, servicio/sede/medico, estado y "Ver
// detalles" (especificacion final de la usuaria).
import { useMemo, useState } from 'react';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { StatusBadge } from '../ui/StatusBadge';
import { DetalleCitaPanel, estadoDeCita } from '../citas/DetalleCitaPanel';
import { IconoCalendario, IconoEstetoscopio, IconoFlechaDerecha } from '../icons';
import { AvatarMascota } from './AvatarMascota';

const FILTROS = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'proxima', etiqueta: 'Próximas' },
  { id: 'completada', etiqueta: 'Completadas' },
  { id: 'cancelada', etiqueta: 'Canceladas' },
];

// La proxima cita mas cercana en el tiempo lleva fondo y borde de
// acento permanentes (no es hover): para que salte a la vista.
function idProximaMasCercana(citas) {
  const proximas = citas
    .filter((cita) => estadoDeCita(cita) === 'proxima')
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  return proximas[0]?.id ?? null;
}

export function PanelMisCitas({ citas, cargando, onActualizada }) {
  const [filtro, setFiltro] = useState('todas');
  const [citaDetalle, setCitaDetalle] = useState(null);

  const conteos = useMemo(() => {
    const base = { todas: citas.length, proxima: 0, completada: 0, cancelada: 0 };
    citas.forEach((cita) => {
      base[estadoDeCita(cita)] += 1;
    });
    return base;
  }, [citas]);

  const citasFiltradas = useMemo(() => {
    if (filtro === 'todas') return citas;
    return citas.filter((cita) => estadoDeCita(cita) === filtro);
  }, [citas, filtro]);

  const idDestacada = useMemo(() => idProximaMasCercana(citas), [citas]);

  return (
    <>
    <div className="flex flex-col gap-6" inert={Boolean(citaDetalle)} aria-hidden={Boolean(citaDetalle)}>
      {/* "Agendar nueva cita" vive en la fila de tabs (PanelClientePage.jsx). */}
      <div>
        <h2 className="font-heading text-xl font-bold text-brand-navy">Mis citas</h2>
        <p className="text-sm text-slate-500">Consulta, reprograma o cancela tus citas veterinarias.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            aria-pressed={filtro === f.id}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition ${
              filtro === f.id
                ? 'bg-[#EAF4FD] text-brand-blue ring-transparent'
                : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.etiqueta} ({conteos[f.id]})
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((clave) => (
            <div key={clave} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : citasFiltradas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No tienes citas en esta categoría.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {citasFiltradas.map((cita) => {
            const destacada = cita.id === idDestacada;
            return (
              <div
                key={cita.id}
                className={`grid grid-cols-1 items-center gap-4 rounded-xl border p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto_auto] ${
                  destacada ? 'border-brand-blue-400 bg-[#EAF4FD]' : 'border-slate-200 bg-white'
                }`}
              >
                {/* 1-2. Foto + nombre y especie/raza */}
                <div className="flex min-w-0 items-center gap-3">
                  <AvatarMascota
                    mascota={{ nombre: cita.mascota_nombre, foto_url: cita.mascota_foto_url }}
                    className="h-12 w-12"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{cita.mascota_nombre}</p>
                    <p className="truncate text-sm text-slate-500">
                      {[cita.mascota_especie, cita.mascota_raza].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>

                {/* 3. Fecha y hora */}
                <div className="flex min-w-0 items-start gap-2.5">
                  <IconoCalendario className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{formatearFechaLarga(cita.fecha_hora)}</p>
                    <p className="text-sm text-slate-500">{formatearHora(cita.fecha_hora)}</p>
                  </div>
                </div>

                {/* 4. Servicio, sede y medico */}
                <div className="flex min-w-0 items-start gap-2.5">
                  <IconoEstetoscopio className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{cita.servicio_nombre}</p>
                    <p className="truncate text-sm text-slate-500">{cita.sede_nombre}</p>
                    <p className="truncate text-sm text-slate-500">{cita.medico_nombre}</p>
                  </div>
                </div>

                {/* 5. Estado */}
                <div>
                  <StatusBadge status={estadoDeCita(cita)} />
                </div>

                {/* 6. Ver detalles */}
                <button
                  type="button"
                  onClick={() => setCitaDetalle(cita)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-blue bg-white px-3 py-1.5 text-sm font-semibold text-brand-blue transition hover:bg-blue-50"
                >
                  Ver detalles
                  <IconoFlechaDerecha className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>

    <DetalleCitaPanel
      cita={citaDetalle}
      onClose={() => setCitaDetalle(null)}
      onActualizada={() => {
        onActualizada();
        setCitaDetalle(null);
      }}
    />
    </>
  );
}
