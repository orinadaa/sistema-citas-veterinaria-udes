// components/citas/SelectorMedico.jsx
// El cliente elige el profesional entre los medicos de esa sede que
// prestan el servicio elegido y estan libres en la franja seleccionada.
import { useEffect, useState } from 'react';
import { obtenerMedicosDisponibles } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { IconoAlerta } from '../icons';

const ESTADOS = { CARGANDO: 'cargando', LISTO: 'listo', ERROR: 'error' };

export function SelectorMedico({ sedeId, servicioId, fechaHora, valorSeleccionado, onSeleccionar }) {
  const { token } = useAuth();
  const [medicos, setMedicos] = useState([]);
  const [estado, setEstado] = useState(ESTADOS.CARGANDO);

  useEffect(() => {
    if (!sedeId || !servicioId || !fechaHora) return;

    setEstado(ESTADOS.CARGANDO);
    obtenerMedicosDisponibles({ sedeId, servicioId, fechaHora, token })
      .then((datos) => {
        setMedicos(datos.medicos);
        setEstado(ESTADOS.LISTO);
      })
      .catch(() => setEstado(ESTADOS.ERROR));
  }, [sedeId, servicioId, fechaHora, token]);

  if (!fechaHora) return null;

  return (
    <div>
      <p className="text-sm font-medium text-slate-700">Profesional</p>

      {estado === ESTADOS.CARGANDO && (
        <div className="mt-2 flex flex-col gap-2">
          {[0, 1].map((clave) => (
            <div key={clave} className="h-11 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      )}

      {estado === ESTADOS.ERROR && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
          <IconoAlerta className="h-4 w-4 shrink-0" />
          No pudimos cargar los médicos disponibles.
        </div>
      )}

      {estado === ESTADOS.LISTO && medicos.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">
          Ningún médico quedó libre en esa franja. Elige otra hora.
        </p>
      )}

      {estado === ESTADOS.LISTO && medicos.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {medicos.map((medico) => {
            const seleccionado = medico.id === valorSeleccionado;
            return (
              <button
                key={medico.id}
                type="button"
                onClick={() => onSeleccionar(medico.id)}
                className={`rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition ${
                  seleccionado
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-700 hover:border-blue-300'
                }`}
              >
                {medico.nombreCompleto}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
