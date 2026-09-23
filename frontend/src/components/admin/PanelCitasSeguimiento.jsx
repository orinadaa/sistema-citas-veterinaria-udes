// components/admin/PanelCitasSeguimiento.jsx
// RF-12: consultar y hacer seguimiento de citas programadas. Solo
// lectura: reprogramar/cancelar es una accion del cliente (RF-08/RF-09).
import { useEffect, useState } from 'react';
import { obtenerCitasAdministracion } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { PageHeader } from '../ui/PageHeader';
import { DataTable } from '../ui/DataTable';

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

  const columnas = [
    { header: 'Fecha', render: (c) => formatearFechaLarga(c.fecha_hora) },
    { header: 'Hora', render: (c) => formatearHora(c.fecha_hora) },
    { header: 'Servicio', render: (c) => c.servicio_nombre },
    ...(usuario.rol === 'administrador' ? [{ header: 'Médico', render: (c) => c.medico_nombre }] : []),
    {
      header: 'Cliente',
      render: (c) => (
        <div>
          <p>{c.cliente_nombre}</p>
          {c.cliente_telefono && <p className="text-xs text-slate-400">{c.cliente_telefono}</p>}
        </div>
      ),
    },
    { header: 'Mascota', render: (c) => c.nombre_mascota },
    {
      header: 'Estado',
      render: (c) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            c.estado === 'agendada' ? 'bg-emerald-50 text-brand-green' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {c.estado === 'agendada' ? 'Agendada' : 'Cancelada'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={usuario.rol === 'administrador' ? 'Seguimiento de citas' : 'Mis citas asignadas'}
        subtitle="Consulta las citas programadas en tu sede."
      />

      {cargando ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((clave) => (
            <div key={clave} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <DataTable filaVacia="No hay citas programadas todavía." columns={columnas} rows={citas} />
      )}
    </div>
  );
}
