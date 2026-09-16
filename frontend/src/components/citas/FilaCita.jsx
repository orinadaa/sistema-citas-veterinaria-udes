// components/citas/FilaCita.jsx
// Una cita dentro de "Mis citas", con acciones de reprogramar (RF-08) y
// cancelar (RF-09) cuando esta activa.
import { useState } from 'react';
import { reprogramarCita, cancelarCita } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { SelectorFranjas } from './SelectorFranjas';

export function FilaCita({ cita, onActualizada }) {
  const { token } = useAuth();
  const [modo, setModo] = useState('vista'); // vista | reprogramar | confirmarCancelar
  const [nuevaFranja, setNuevaFranja] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const activa = cita.estado === 'agendada';
  const esFutura = new Date(cita.fecha_hora) > new Date();

  async function confirmarReprogramacion() {
    if (!nuevaFranja) return;
    setEnviando(true);
    setError('');
    try {
      await reprogramarCita(cita.id, nuevaFranja, token);
      setModo('vista');
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

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{formatearFechaLarga(cita.fecha_hora)}</p>
          <p className="text-sm text-slate-600">
            {formatearHora(cita.fecha_hora)} · {cita.sede_nombre}
          </p>
          <p className="mt-1 text-sm text-slate-500">Mascota: {cita.nombre_mascota}</p>
          {cita.motivo && <p className="text-sm text-slate-500">Motivo: {cita.motivo}</p>}
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            cita.estado === 'agendada' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {cita.estado === 'agendada' ? 'Agendada' : 'Cancelada'}
        </span>
      </div>

      {activa && esFutura && modo === 'vista' && (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setModo('reprogramar')}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
          >
            Reprogramar
          </button>
          <button
            type="button"
            onClick={() => setModo('confirmarCancelar')}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Cancelar cita
          </button>
        </div>
      )}

      {modo === 'reprogramar' && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <SelectorFranjas sedeId={cita.sede_id} valorSeleccionado={nuevaFranja} onSeleccionar={setNuevaFranja} />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={!nuevaFranja || enviando}
              onClick={confirmarReprogramacion}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>
      )}

      {modo === 'confirmarCancelar' && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-700">¿Seguro que quieres cancelar esta cita?</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              disabled={enviando}
              onClick={confirmarCancelacion}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>
      )}
    </div>
  );
}
