// components/cliente/PanelMisCitas.jsx
// Pestaña "Mis citas" del panel del cliente (RF-15, con reprogramar
// RF-08 y cancelar RF-09 vía DetalleCitaPanel). Filtros por estado
// como pills con conteo real -- nunca un numero inventado.
import { useMemo, useState } from 'react';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { StatusBadge } from '../ui/StatusBadge';
import { FormularioAgendar } from '../citas/FormularioAgendar';
import { DetalleCitaPanel, estadoDeCita } from '../citas/DetalleCitaPanel';
import { IconoCalendario, IconoEstetoscopio, IconoPata } from '../icons';

const FILTROS = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'proxima', etiqueta: 'Próximas' },
  { id: 'completada', etiqueta: 'Completadas' },
  { id: 'cancelada', etiqueta: 'Canceladas' },
];

export function PanelMisCitas({
  citas,
  cargando,
  onActualizada,
  mostrarFormulario,
  onAbrirFormulario,
  onCerrarFormulario,
  servicioIdInicial,
}) {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-brand-navy">Mis citas</h2>
          <p className="text-sm text-slate-500">Consulta, reprograma o cancela tus citas veterinarias.</p>
        </div>
        <button
          type="button"
          onClick={mostrarFormulario ? onCerrarFormulario : onAbrirFormulario}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
        >
          <IconoCalendario className="h-4 w-4" />
          {mostrarFormulario ? 'Cerrar formulario' : 'Agendar cita'}
        </button>
      </div>

      {mostrarFormulario && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <FormularioAgendar
            servicioIdInicial={servicioIdInicial}
            onAgendada={() => {
              onCerrarFormulario();
              onActualizada();
            }}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filtro === f.id ? 'bg-blue-50 text-brand-blue' : 'text-slate-500 hover:bg-slate-100'
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
        <div className="flex flex-col gap-3">
          {citasFiltradas.map((cita) => (
            <div
              key={cita.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                  <IconoPata className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-slate-900">
                    {cita.mascota_nombre}
                    {cita.mascota_especie ? ` (${cita.mascota_especie})` : ''}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <IconoCalendario className="h-3.5 w-3.5 shrink-0" />
                    {formatearFechaLarga(cita.fecha_hora)} · {formatearHora(cita.fecha_hora)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <IconoEstetoscopio className="h-3.5 w-3.5 shrink-0" />
                    {cita.servicio_nombre} · {cita.sede_nombre} · {cita.medico_nombre}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={estadoDeCita(cita)} />
                <button
                  type="button"
                  onClick={() => setCitaDetalle(cita)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Ver detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DetalleCitaPanel
        cita={citaDetalle}
        onClose={() => setCitaDetalle(null)}
        onActualizada={() => {
          onActualizada();
          setCitaDetalle(null);
        }}
      />
    </div>
  );
}
