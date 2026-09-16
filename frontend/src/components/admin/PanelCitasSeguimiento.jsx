// components/admin/PanelCitasSeguimiento.jsx
// RF-12: consultar y hacer seguimiento de citas programadas. Solo
// lectura: reprogramar/cancelar es una accion del cliente (RF-08/RF-09).
import { useEffect, useState } from 'react';
import { obtenerCitasAdministracion } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';

export function PanelCitasSeguimiento() {
  const { token, usuario } = useAuth();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerCitasAdministracion(token).then((datos) => {
      setCitas(datos.citas);
      setCargando(false);
    });
  }, [token]);

  if (cargando) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((clave) => (
          <div key={clave} className="h-16 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (citas.length === 0) {
    return <p className="text-sm text-slate-500">No hay citas programadas todavía.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-4">Fecha</th>
            <th className="py-2 pr-4">Hora</th>
            <th className="py-2 pr-4">Servicio</th>
            {usuario.rol === 'administrador' && <th className="py-2 pr-4">Médico</th>}
            <th className="py-2 pr-4">Cliente</th>
            <th className="py-2 pr-4">Mascota</th>
            <th className="py-2 pr-4">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {citas.map((cita) => (
            <tr key={cita.id}>
              <td className="py-2.5 pr-4 text-slate-700">{formatearFechaLarga(cita.fecha_hora)}</td>
              <td className="py-2.5 pr-4 text-slate-700">{formatearHora(cita.fecha_hora)}</td>
              <td className="py-2.5 pr-4 text-slate-700">{cita.servicio_nombre}</td>
              {usuario.rol === 'administrador' && (
                <td className="py-2.5 pr-4 text-slate-700">{cita.medico_nombre}</td>
              )}
              <td className="py-2.5 pr-4 text-slate-700">
                {cita.cliente_nombre}
                {cita.cliente_telefono && <span className="block text-xs text-slate-400">{cita.cliente_telefono}</span>}
              </td>
              <td className="py-2.5 pr-4 text-slate-700">{cita.nombre_mascota}</td>
              <td className="py-2.5 pr-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    cita.estado === 'agendada' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {cita.estado === 'agendada' ? 'Agendada' : 'Cancelada'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
