// components/cliente/PanelMisCitas.jsx
// Pestaña "Mis citas" del panel del cliente (RF-15, con reprogramar RF-08 y
// cancelar RF-09 vía DetalleCitaPanel).
import { useMemo, useState } from 'react';
import { aFechaLocal, desdeFechaLocal, formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { Boton, Chips, EstadoVacio, Esqueleto, Insignia, Superficie, Tarjeta } from '../vetui';
import { DatePickerCalendar } from '../agendar/DatePickerCalendar';
import { DetalleCitaPanel, estadoDeCita } from '../citas/DetalleCitaPanel';
import { IconoCalendario, IconoEstetoscopio, IconoFlechaDerecha, IconoX } from '../icons';
import { AvatarMascota } from './AvatarMascota';

const FILTROS = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'proxima', etiqueta: 'Próximas' },
  { id: 'completada', etiqueta: 'Completadas' },
  { id: 'cancelada', etiqueta: 'Canceladas' },
];

const LEYENDA = [
  { estado: 'proxima', etiqueta: 'Próxima', punto: 'bg-brand-blue-600' },
  { estado: 'completada', etiqueta: 'Completada', punto: 'bg-emerald-600' },
  { estado: 'cancelada', etiqueta: 'Cancelada', punto: 'bg-red-600' },
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
  // Confirmacion de lo ultimo que se hizo desde el detalle (cancelar, reprogramar).
  const [aviso, setAviso] = useState('');
  // Dia elegido en el calendario ("YYYY-MM-DD"), o '' = todas las fechas.
  const [dia, setDia] = useState('');

  const conteos = useMemo(() => {
    const base = { todas: citas.length, proxima: 0, completada: 0, cancelada: 0 };
    citas.forEach((cita) => {
      base[estadoDeCita(cita)] += 1;
    });
    return base;
  }, [citas]);

  const citasPorEstado = useMemo(() => {
    if (filtro === 'todas') return citas;
    return citas.filter((cita) => estadoDeCita(cita) === filtro);
  }, [citas, filtro]);

  // Puntos del calendario: los estados de las citas de cada dia (segun el
  // filtro de estado activo, igual que la lista).
  const marcas = useMemo(() => {
    const porDia = {};
    citasPorEstado.forEach((cita) => {
      const clave = aFechaLocal(new Date(cita.fecha_hora));
      (porDia[clave] ||= []).push(estadoDeCita(cita));
    });
    return porDia;
  }, [citasPorEstado]);

  const citasFiltradas = useMemo(() => {
    if (!dia) return citasPorEstado;
    return citasPorEstado.filter((cita) => aFechaLocal(new Date(cita.fecha_hora)) === dia);
  }, [citasPorEstado, dia]);

  const idDestacada = useMemo(() => idProximaMasCercana(citas), [citas]);

  return (
    <>
    <div className="flex flex-col gap-6" inert={Boolean(citaDetalle)} aria-hidden={Boolean(citaDetalle)}>
      {/* "Agendar nueva cita" vive en la fila de tabs (PanelClientePage.jsx). */}
      <div>
        <h2 className="text-xl font-bold text-white">Mis citas</h2>
        <p className="text-sm text-blue-100">Consulta, reprograma o cancela tus citas veterinarias.</p>
      </div>

      <Chips
        items={FILTROS.map((f) => ({ ...f, conteo: conteos[f.id] }))}
        activo={filtro}
        onCambiar={setFiltro}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Calendario: a la derecha de las citas (pedido de Oriana) y a la
            vista mientras se recorre la lista. En el codigo va primero para
            que en celular quede arriba; lg:order-2 lo pasa a la derecha. */}
        <Superficie as="aside" tono="blanco" aria-label="Calendario de mis citas" className="lg:sticky lg:top-28 lg:order-2">
          <DatePickerCalendar valor={dia} onChange={setDia} minimo={null} marcas={marcas} permiteQuitar />
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-900/10 pt-4 text-xs text-slate-700">
            {LEYENDA.map((item) => (
              <li key={item.estado} className="flex items-center gap-1.5">
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${item.punto}`} />
                {item.etiqueta}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-700">Toca un día para ver solo sus citas.</p>
        </Superficie>

        <div className="flex min-w-0 flex-col gap-3">
          {aviso && (
            <p role="status" className="vidrio rounded-tarjeta px-4 py-2.5 text-sm font-medium text-white">
              {aviso}
            </p>
          )}
          {dia && (
            <div className="vidrio flex flex-wrap items-center justify-between gap-2 rounded-tarjeta px-4 py-2.5">
              <p role="status" className="text-sm font-medium text-white">
                {formatearFechaLarga(desdeFechaLocal(dia))}: {citasFiltradas.length}{' '}
                {citasFiltradas.length === 1 ? 'cita' : 'citas'}
              </p>
              <button
                type="button"
                onClick={() => setDia('')}
                className="boton-texto inline-flex items-center gap-1.5 rounded-boton px-2 py-1 text-sm font-semibold text-white"
              >
                <IconoX className="h-3.5 w-3.5" peso="bold" />
                Ver todas las fechas
              </button>
            </div>
          )}

      {cargando ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((clave) => (
            <Esqueleto key={clave} className="h-20" />
          ))}
        </div>
      ) : citasFiltradas.length === 0 ? (
        <EstadoVacio>{dia ? 'No tienes citas ese día.' : 'No tienes citas en esta categoría.'}</EstadoVacio>
      ) : (
        <div className="flex flex-col gap-3">
          {citasFiltradas.map((cita) => {
            const destacada = cita.id === idDestacada;
            return (
              <Tarjeta
                key={cita.id}
                material="blanco"
                destacada={destacada}
                className="grid grid-cols-1 items-center gap-4 p-4 md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1.2fr)_auto] md:gap-5"
              >
                {/* 1-2. Foto grande arriba + nombre y especie/raza, centrados en
                    una columna angosta (12rem) para no dejar un hueco grande
                    hasta la fecha. */}
                <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                  <AvatarMascota
                    mascota={{ nombre: cita.mascota_nombre, foto_url: cita.mascota_foto_url }}
                    className="h-20 w-20 shadow-md ring-4 ring-white"
                    iconoClassName="h-9 w-9"
                  />
                  <div className="min-w-0 max-w-full">
                    <p className="truncate font-semibold text-slate-900">{cita.mascota_nombre}</p>
                    <p className="line-clamp-2 text-sm text-slate-700">
                      {[cita.mascota_especie, cita.mascota_raza].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>

                {/* 3. Fecha y hora */}
                <div className="flex min-w-0 items-start gap-2.5">
                  <IconoCalendario className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue-700" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{formatearFechaLarga(cita.fecha_hora)}</p>
                    <p className="text-sm text-slate-700">{formatearHora(cita.fecha_hora)}</p>
                  </div>
                </div>

                {/* 4. Servicio, sede y medico */}
                <div className="flex min-w-0 items-start gap-2.5">
                  <IconoEstetoscopio className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue-700" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{cita.servicio_nombre}</p>
                    <p className="truncate text-sm text-slate-700">{cita.sede_nombre}</p>
                    <p className="truncate text-sm text-slate-700">{cita.medico_nombre}</p>
                  </div>
                </div>

                {/* 5-6. Estado y "Ver detalles", apilados: con el calendario al
                    lado la tarjeta es mas angosta y no caben en fila. */}
                <div className="flex flex-row items-center justify-between gap-3 md:flex-col md:items-end">
                  <Insignia estado={estadoDeCita(cita)} />
                  <Boton variante="contorno" tamano="sm" iconoFinal={IconoFlechaDerecha} onClick={() => setCitaDetalle(cita)}>
                    Ver detalles
                  </Boton>
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}
        </div>
      </div>

    </div>

    <DetalleCitaPanel
      cita={citaDetalle}
      onClose={() => setCitaDetalle(null)}
      onActualizada={(mensaje) => {
        onActualizada();
        setAviso(typeof mensaje === 'string' ? mensaje : '');
        setCitaDetalle(null);
      }}
    />
    </>
  );
}
