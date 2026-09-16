// components/citas/SelectorFranjas.jsx
// RF-07: consultar disponibilidad de horarios por sede antes de agendar.
import { useEffect, useState } from 'react';
import { obtenerDisponibilidad } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearHora, hoyComoFechaLocal } from '../../utils/fecha';
import { IconoAlerta } from '../icons';

const ESTADOS = { INACTIVO: 'inactivo', CARGANDO: 'cargando', LISTO: 'listo', ERROR: 'error' };

export function SelectorFranjas({ sedeId, servicioId, medicoId, valorSeleccionado, onSeleccionar }) {
  const { token } = useAuth();
  const [fecha, setFecha] = useState(hoyComoFechaLocal());
  const [franjas, setFranjas] = useState([]);
  const [medicosEnSede, setMedicosEnSede] = useState(null);
  const [estado, setEstado] = useState(ESTADOS.INACTIVO);

  useEffect(() => {
    if (!sedeId || !servicioId || !fecha) return;

    setEstado(ESTADOS.CARGANDO);
    obtenerDisponibilidad({ sedeId, servicioId, fecha, medicoId, token })
      .then((datos) => {
        setFranjas(datos.franjas);
        setMedicosEnSede(datos.medicosDisponiblesEnSede);
        setEstado(ESTADOS.LISTO);
      })
      .catch(() => setEstado(ESTADOS.ERROR));
  }, [sedeId, servicioId, medicoId, fecha, token]);

  if (!sedeId || !servicioId) {
    return <p className="text-sm text-slate-500">Selecciona primero la sede y el servicio.</p>;
  }

  return (
    <div>
      <label htmlFor="fecha-cita" className="text-sm font-medium text-slate-700">
        Fecha
      </label>
      <input
        id="fecha-cita"
        type="date"
        min={hoyComoFechaLocal()}
        value={fecha}
        onChange={(evento) => {
          setFecha(evento.target.value);
          onSeleccionar(null);
        }}
        className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 sm:w-56"
      />

      <div className="mt-4">
        {estado === ESTADOS.CARGANDO && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, indice) => (
              <div key={indice} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        )}

        {estado === ESTADOS.ERROR && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
            <IconoAlerta className="h-4 w-4 shrink-0" />
            No pudimos cargar la disponibilidad. Intenta de nuevo.
          </div>
        )}

        {estado === ESTADOS.LISTO && medicosEnSede === 0 && (
          <p className="text-sm text-slate-500">
            No hay médicos que presten este servicio en esta sede por ahora.
          </p>
        )}

        {estado === ESTADOS.LISTO && medicosEnSede > 0 && franjas.length === 0 && (
          <p className="text-sm text-slate-500">La clínica no atiende ese día. Elige otra fecha.</p>
        )}

        {estado === ESTADOS.LISTO && medicosEnSede > 0 && franjas.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {franjas.map((franja) => {
              const seleccionada = franja.horaInicio === valorSeleccionado;
              return (
                <button
                  key={franja.horaInicio}
                  type="button"
                  disabled={!franja.disponible}
                  onClick={() => onSeleccionar(franja.horaInicio)}
                  className={`rounded-lg px-2 py-2 text-sm font-medium transition ${
                    seleccionada
                      ? 'bg-blue-600 text-white'
                      : franja.disponible
                        ? 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                        : 'cursor-not-allowed bg-slate-100 text-slate-500 line-through'
                  }`}
                >
                  {formatearHora(franja.horaInicio)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
