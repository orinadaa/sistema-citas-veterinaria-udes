// components/medico/DetallePacienteMedicoPanel.jsx
// "Detalle del paciente" en el panel del medico.
import { useEffect, useState } from 'react';
import { obtenerDetallePacienteMedico } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { iniciales } from '../../utils/texto';
import { SidePanel } from '../ui/SidePanel';
import { Tabs } from '../ui/Tabs';
import { StatusBadge } from '../ui/StatusBadge';
import { EstadoError } from '../ui/EstadoError';
import { estadoDeCita } from '../citas/DetalleCitaPanel';
import { MascotasPaciente } from '../admin/MascotasPaciente';
import { IconoCalendario, IconoPata, IconoPersona } from '../icons';

const TABS = [
  { id: 'info', label: 'Información', icon: IconoPersona },
  { id: 'mascotas', label: 'Mascota(s)', icon: IconoPata },
  { id: 'citas', label: 'Citas', icon: IconoCalendario },
];

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{etiqueta}</p>
      <p className="text-sm text-slate-800">{valor}</p>
    </div>
  );
}

export function DetallePacienteMedicoPanel({ clienteId, onClose, onCambio, accionesMascota = [] }) {
  const { token } = useAuth();
  const [pestana, setPestana] = useState('info');
  const [resultado, setResultado] = useState({ clienteId: null, detalle: null, error: '' });
  const [intento, setIntento] = useState(0);

  // Al abrir otro paciente, vuelve a la primera pestaña.
  const [clientePrevio, setClientePrevio] = useState(clienteId);
  if (clientePrevio !== clienteId) {
    setClientePrevio(clienteId);
    setPestana('info');
  }

  useEffect(() => {
    if (!clienteId) return undefined;
    let vigente = true;
    obtenerDetallePacienteMedico(clienteId, token)
      .then((detalle) => vigente && setResultado({ clienteId, detalle, error: '' }))
      .catch((err) => vigente && setResultado({ clienteId, detalle: null, error: err.message || 'No se pudo cargar el paciente.' }));
    return () => {
      vigente = false;
    };
  }, [clienteId, token, intento]);

  const cargando = clienteId && resultado.clienteId !== clienteId;
  const detalle = resultado.clienteId === clienteId ? resultado.detalle : null;

  function recargar() {
    setIntento((n) => n + 1);
    onCambio?.();
  }

  return (
    <SidePanel isOpen={Boolean(clienteId)} onClose={onClose} title="Detalle del paciente">
      {cargando ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((k) => (
            <div key={k} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : resultado.error ? (
        <EstadoError mensaje={resultado.error} onReintentar={() => setIntento((n) => n + 1)} />
      ) : detalle ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-blue-600 text-sm font-bold text-white">
              {iniciales(detalle.cliente.nombre_completo)}
            </span>
            <div>
              <p className="font-heading text-base font-semibold text-brand-navy">{detalle.cliente.nombre_completo}</p>
              <span
                className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  detalle.cliente.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${detalle.cliente.activo ? 'bg-brand-green' : 'bg-slate-400'}`} />
                {detalle.cliente.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          <Tabs items={TABS} activeItem={pestana} onChange={setPestana} />

          {pestana === 'info' && (
            <div className="flex flex-col gap-4">
              <Dato etiqueta="Nombre" valor={detalle.cliente.nombre_completo} />
              <Dato etiqueta="Correo" valor={detalle.cliente.correo} />
              <Dato etiqueta="Teléfono" valor={detalle.cliente.telefono || 'No registrado'} />
              <Dato etiqueta="Cliente desde" valor={formatearFechaLarga(detalle.cliente.creado_en)} />
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Solo lectura: los datos del dueño los actualiza el propio cliente o el administrador.
              </p>
            </div>
          )}

          {pestana === 'mascotas' && (
            <MascotasPaciente
              clienteId={detalle.cliente.id}
              mascotas={detalle.mascotas}
              onCambio={recargar}
              formularioColapsable
              accionesExtra={accionesMascota.map((accion) => ({
                ...accion,
                onClick: (mascota) => accion.onClick(mascota, detalle.cliente),
              }))}
            />
          )}

          {pestana === 'citas' && (
            <div className="flex flex-col gap-2">
              {detalle.citas.length === 0 ? (
                <p className="text-sm text-slate-400">Sin citas contigo todavía.</p>
              ) : (
                detalle.citas.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {c.mascota_nombre} · {c.servicio_nombre}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatearFechaLarga(c.fecha_hora)} · {formatearHora(c.fecha_hora)}
                      </p>
                    </div>
                    <StatusBadge status={estadoDeCita(c)} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : null}
    </SidePanel>
  );
}
