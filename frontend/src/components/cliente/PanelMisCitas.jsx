// components/cliente/PanelMisCitas.jsx
// Pestaña "Mis citas" del panel del cliente (RF-15, con reprogramar
// RF-08 y cancelar RF-09 vía DetalleCitaPanel). Filtros por estado
// como pills con conteo real -- nunca un numero inventado. Cada fila:
// foto, mascota, fecha/hora, servicio/sede/medico, estado y "Ver
// detalles" (especificacion final de la usuaria). vetUI: chips de vidrio
// para filtrar, cada cita en una Tarjeta de vidrio (mismo material que las
// tarjetas de seccion del landing; la proxima mas cercana con anillo ambar).
import { useMemo, useState } from 'react';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { Boton, Chips, EstadoVacio, Esqueleto, Insignia, Tarjeta } from '../vetui';
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
        <h2 className="text-xl font-bold text-white">Mis citas</h2>
        <p className="text-sm text-blue-100">Consulta, reprograma o cancela tus citas veterinarias.</p>
      </div>

      <Chips
        items={FILTROS.map((f) => ({ ...f, conteo: conteos[f.id] }))}
        activo={filtro}
        onCambiar={setFiltro}
      />

      {cargando ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((clave) => (
            <Esqueleto key={clave} className="h-20" />
          ))}
        </div>
      ) : citasFiltradas.length === 0 ? (
        <EstadoVacio>No tienes citas en esta categoría.</EstadoVacio>
      ) : (
        <div className="flex flex-col gap-3">
          {citasFiltradas.map((cita) => {
            const destacada = cita.id === idDestacada;
            return (
              <Tarjeta
                key={cita.id}
                material="vidrio"
                destacada={destacada}
                className="grid grid-cols-1 items-center gap-4 p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto_auto]"
              >
                {/* 1-2. Foto + nombre y especie/raza */}
                <div className="flex min-w-0 items-center gap-3">
                  <AvatarMascota
                    mascota={{ nombre: cita.mascota_nombre, foto_url: cita.mascota_foto_url }}
                    className="h-12 w-12"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{cita.mascota_nombre}</p>
                    <p className="truncate text-sm text-blue-100">
                      {[cita.mascota_especie, cita.mascota_raza].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>

                {/* 3. Fecha y hora */}
                <div className="flex min-w-0 items-start gap-2.5">
                  <IconoCalendario className="mt-0.5 h-5 w-5 shrink-0 text-blue-100" />
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{formatearFechaLarga(cita.fecha_hora)}</p>
                    <p className="text-sm text-blue-100">{formatearHora(cita.fecha_hora)}</p>
                  </div>
                </div>

                {/* 4. Servicio, sede y medico */}
                <div className="flex min-w-0 items-start gap-2.5">
                  <IconoEstetoscopio className="mt-0.5 h-5 w-5 shrink-0 text-blue-100" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{cita.servicio_nombre}</p>
                    <p className="truncate text-sm text-blue-100">{cita.sede_nombre}</p>
                    <p className="truncate text-sm text-blue-100">{cita.medico_nombre}</p>
                  </div>
                </div>

                {/* 5. Estado */}
                <div>
                  <Insignia estado={estadoDeCita(cita)} />
                </div>

                {/* 6. Ver detalles */}
                <Boton variante="secundario" tamano="sm" iconoFinal={IconoFlechaDerecha} onClick={() => setCitaDetalle(cita)}>
                  Ver detalles
                </Boton>
              </Tarjeta>
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
