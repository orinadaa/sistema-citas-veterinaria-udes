// components/citas/DetalleCitaPanel.jsx
// Detalle de una cita en "Mis citas" del panel del cliente, con
// reprogramar (RF-08) y cancelar (RF-09) cuando esta activa y es
// futura. Antes esto vivia inline en cada fila (FilaCita.jsx); ahora
// se abre en un SidePanel, como el resto de la app. Los botones de
// accion viven en el pie fijo del panel (prop "footer" de
// SidePanel.jsx), fuera del scroll del cuerpo.
import { useEffect, useState } from 'react';
import { reprogramarCita, cancelarCita } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaLarga, formatearFechaCorta, formatearHora } from '../../utils/fecha';
import { formatearCOP } from '../../utils/moneda';
import { SidePanel } from '../ui/SidePanel';
import { StatusBadge } from '../ui/StatusBadge';
import { SelectorFranjas } from './SelectorFranjas';
import { IconoUbicacion, IconoSede } from '../icons';

const ETIQUETA_SEXO = { macho: 'Macho', hembra: 'Hembra' };

export function estadoDeCita(cita) {
  if (cita.estado === 'cancelada') return 'cancelada';
  return new Date(cita.fecha_hora) > new Date() ? 'proxima' : 'completada';
}

export function DetalleCitaPanel({ cita, onClose, onActualizada }) {
  const { token } = useAuth();
  const [modo, setModo] = useState('vista');
  const [nuevaFranja, setNuevaFranja] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setModo('vista');
    setNuevaFranja(null);
    setError('');
  }, [cita?.id]);

  async function confirmarReprogramacion() {
    if (!nuevaFranja) return;
    setEnviando(true);
    setError('');
    try {
      await reprogramarCita(cita.id, nuevaFranja, token);
      onActualizada();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarCancelacion() {
    setEnviando(true);
    setError('');
    try {
      await cancelarCita(cita.id, token);
      onActualizada();
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  const estado = cita ? estadoDeCita(cita) : null;
  const puedeGestionar = estado === 'proxima';

  let footer = null;
  if (cita && puedeGestionar && modo === 'vista') {
    footer = (
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setModo('reprogramar')}
          className="flex-1 rounded-lg border border-brand-blue px-4 py-2 text-sm font-semibold text-brand-blue transition hover:bg-blue-50"
        >
          Reprogramar
        </button>
        <button
          type="button"
          onClick={() => setModo('confirmarCancelar')}
          className="flex-1 rounded-lg border border-brand-red px-4 py-2 text-sm font-semibold text-brand-red transition hover:bg-red-50"
        >
          Cancelar cita
        </button>
      </div>
    );
  } else if (cita && modo === 'reprogramar') {
    footer = (
      <div className="flex gap-3">
        <button
          type="button"
          disabled={!nuevaFranja || enviando}
          onClick={confirmarReprogramacion}
          className="flex-1 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? 'Guardando...' : 'Confirmar nueva fecha'}
        </button>
        <button
          type="button"
          onClick={() => {
            setModo('vista');
            setNuevaFranja(null);
            setError('');
          }}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Volver
        </button>
      </div>
    );
  } else if (cita && modo === 'confirmarCancelar') {
    footer = (
      <div className="flex gap-3">
        <button
          type="button"
          disabled={enviando}
          onClick={confirmarCancelacion}
          className="flex-1 rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? 'Cancelando...' : 'Sí, cancelar'}
        </button>
        <button
          type="button"
          onClick={() => setModo('vista')}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          No, mantenerla
        </button>
      </div>
    );
  }

  return (
    <SidePanel isOpen={Boolean(cita)} onClose={onClose} title="Detalle de la cita" footer={footer}>
      {cita && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="font-heading text-base font-semibold text-brand-navy">
              {cita.mascota_nombre}
              {[cita.mascota_especie, cita.mascota_raza].filter(Boolean).length > 0
                ? ` (${[cita.mascota_especie, cita.mascota_raza].filter(Boolean).join(' · ')})`
                : ''}
            </p>
            <StatusBadge status={estado} />
          </div>

          {(cita.mascota_sexo || cita.mascota_fecha_nacimiento || cita.mascota_peso_kg || cita.mascota_color) && (
            <p className="text-xs text-slate-500">
              {[
                cita.mascota_sexo && (ETIQUETA_SEXO[cita.mascota_sexo] ?? cita.mascota_sexo),
                cita.mascota_fecha_nacimiento && `Nació el ${formatearFechaCorta(cita.mascota_fecha_nacimiento)}`,
                cita.mascota_peso_kg && `${cita.mascota_peso_kg} kg`,
                cita.mascota_color,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}

          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Fecha y hora</p>
              <p className="text-slate-800">
                {formatearFechaLarga(cita.fecha_hora)} · {formatearHora(cita.fecha_hora)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Servicio</p>
              <p className="text-slate-800">{cita.servicio_nombre}</p>
              {cita.servicio_precio != null && <p className="text-xs text-slate-400">{formatearCOP(cita.servicio_precio)}</p>}
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Médico veterinario</p>
              <p className="text-slate-800">{cita.medico_nombre}</p>
              {cita.medico_especialidad && <p className="text-xs text-slate-400">{cita.medico_especialidad}</p>}
            </div>

            {cita.motivo && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Motivo</p>
                <p className="text-slate-800">{cita.motivo}</p>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            {cita.sede_foto_url && (
              <img src={cita.sede_foto_url} alt="" className="h-28 w-full object-cover" />
            )}
            <div className="flex items-start gap-2 p-3">
              <IconoSede className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
              <div>
                <p className="text-sm font-medium text-slate-800">{cita.sede_nombre}</p>
                {cita.sede_direccion && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <IconoUbicacion className="h-3 w-3 shrink-0" />
                    {cita.sede_direccion}
                  </p>
                )}
              </div>
            </div>
          </div>

          {modo === 'reprogramar' && (
            <div className="border-t border-slate-100 pt-4">
              <SelectorFranjas
                sedeId={cita.sede_id}
                servicioId={cita.servicio_id}
                medicoId={cita.medico_id}
                valorSeleccionado={nuevaFranja}
                onSeleccionar={setNuevaFranja}
              />
              <p className="mt-2 text-xs text-slate-400">Se mantiene el mismo médico ({cita.medico_nombre}).</p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
          )}

          {modo === 'confirmarCancelar' && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-700">¿Seguro que quieres cancelar esta cita?</p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
          )}
        </div>
      )}
    </SidePanel>
  );
}
