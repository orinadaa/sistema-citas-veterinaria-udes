// components/admin/PanelMedicos.jsx
// RF-10/RF-11: que servicio presta cada medico de la sede.
import { useEffect, useState } from 'react';
import { obtenerMedicosAdmin, obtenerServiciosAdmin, actualizarServiciosDeMedico } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function PanelMedicos() {
  const { token } = useAuth();
  const [medicos, setMedicos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState(null);

  function cargar() {
    setCargando(true);
    Promise.all([obtenerMedicosAdmin(token), obtenerServiciosAdmin(token)]).then(([medicosDatos, serviciosDatos]) => {
      setMedicos(medicosDatos.medicos);
      setServicios(serviciosDatos.servicios.filter((s) => s.activo));
      setCargando(false);
    });
  }

  useEffect(cargar, [token]);

  async function alternarServicio(medico, servicioId) {
    const tieneServicio = medico.servicios.some((s) => s.id === servicioId);
    const nuevosIds = tieneServicio
      ? medico.servicios.filter((s) => s.id !== servicioId).map((s) => s.id)
      : [...medico.servicios.map((s) => s.id), servicioId];

    setGuardandoId(medico.id);
    try {
      await actualizarServiciosDeMedico(medico.id, nuevosIds, token);
      cargar();
    } finally {
      setGuardandoId(null);
    }
  }

  if (cargando) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1].map((clave) => (
          <div key={clave} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (medicos.length === 0) {
    return <p className="text-sm text-slate-500">No hay veterinarios registrados en tu sede todavía.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {medicos.map((medico) => (
        <div key={medico.id} className="rounded-xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">{medico.nombre_completo}</p>
          <p className="text-sm text-slate-500">{medico.correo}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {servicios.map((servicio) => {
              const activo = medico.servicios.some((s) => s.id === servicio.id);
              return (
                <button
                  key={servicio.id}
                  type="button"
                  disabled={guardandoId === medico.id}
                  onClick={() => alternarServicio(medico, servicio.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                    activo
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {servicio.nombre}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
