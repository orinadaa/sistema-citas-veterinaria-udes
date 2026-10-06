// components/agendar/TimeSlotPicker.jsx
// RF-07: horarios del dia elegido, en tabs Mañana / Tarde / Noche. La
// disponibilidad la calcula el backend (GET /api/citas/disponibilidad):
// franjas del horario de atencion de la sede, menos las ya ocupadas por
// todos los medicos que prestan el servicio en esa sede, menos las que
// ya pasaron. Aqui solo se pinta lo que responde -- nunca se deshabilita
// un horario "a mano" en el frontend.
import { useEffect, useState } from 'react';
import { obtenerDisponibilidad } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearHora } from '../../utils/fecha';
import { IconoAlerta } from '../icons';

const TURNOS = [
  { id: 'manana', etiqueta: 'Mañana', desde: 0, hasta: 12 },
  { id: 'tarde', etiqueta: 'Tarde', desde: 12, hasta: 18 },
  { id: 'noche', etiqueta: 'Noche', desde: 18, hasta: 24 },
];

function turnoDeFranja(iso) {
  const hora = new Date(iso).getHours();
  return TURNOS.find((t) => hora >= t.desde && hora < t.hasta).id;
}

function Aviso({ children }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
      <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      {children}
    </p>
  );
}

// medicoId (opcional): disponibilidad de un solo medico (el medico que
// agenda desde su panel) en vez del agregado de la sede.
export function TimeSlotPicker({ sedeId, servicioId, fecha, valor, onChange, medicoId }) {
  const { token } = useAuth();
  const clave = sedeId && servicioId && fecha ? `${sedeId}|${servicioId}|${fecha}|${medicoId || ''}` : null;

  // El resultado guarda la clave con la que se pidio: si no coincide con
  // la actual, esta cargando (evita setState sincronico en el efecto y
  // descarta respuestas viejas que lleguen tarde).
  const [resultado, setResultado] = useState({ clave: null, datos: null, error: '' });
  const [turnoElegido, setTurnoElegido] = useState({ clave: null, turno: null });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!clave) return undefined;
    let vigente = true;
    obtenerDisponibilidad({ sedeId, servicioId, fecha, medicoId, token })
      .then((datos) => vigente && setResultado({ clave, datos, error: '' }))
      .catch((err) => vigente && setResultado({ clave, datos: null, error: err.message || 'No se pudo consultar la disponibilidad.' }));
    return () => {
      vigente = false;
    };
  }, [clave, sedeId, servicioId, fecha, medicoId, token, intento]);

  if (!fecha) return <Aviso>Selecciona un día en el calendario para ver los horarios.</Aviso>;

  const cargando = resultado.clave !== clave;
  if (cargando) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (resultado.error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Aviso>{resultado.error}</Aviso>
        <button
          type="button"
          onClick={() => {
            setResultado({ clave: null, datos: null, error: '' });
            setIntento((n) => n + 1);
          }}
          className="text-sm font-semibold text-brand-blue hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { franjas, medicosDisponiblesEnSede, medicosEnSede } = resultado.datos;
  if (franjas.length === 0) return <Aviso>La sede no atiende este día. Elige otra fecha.</Aviso>;
  // medicosEnSede: prestan el servicio en la sede algun dia; si hay pero
  // ninguno ese dia (horario propio del medico), se sugiere otra fecha.
  if ((medicosEnSede ?? medicosDisponiblesEnSede) === 0) {
    return <Aviso>Este servicio no se presta en la sede seleccionada. Elige otra sede.</Aviso>;
  }
  if (medicosDisponiblesEnSede === 0) {
    return <Aviso>Ningún médico atiende este servicio ese día. Prueba con otra fecha.</Aviso>;
  }

  const porTurno = Object.fromEntries(TURNOS.map((t) => [t.id, franjas.filter((f) => turnoDeFranja(f.horaInicio) === t.id)]));
  const turnosConFranjas = TURNOS.filter((t) => porTurno[t.id].length > 0);
  const hayDisponibles = franjas.some((f) => f.disponible);

  // Turno activo: el que eligio el cliente para esta consulta; si no, el
  // de la hora ya seleccionada; si no, el primero con algo disponible.
  const turnoActivo =
    (turnoElegido.clave === clave && turnoElegido.turno) ||
    (valor && franjas.some((f) => f.horaInicio === valor) && turnoDeFranja(valor)) ||
    (turnosConFranjas.find((t) => porTurno[t.id].some((f) => f.disponible)) || turnosConFranjas[0]).id;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-xl bg-slate-100 p-1" role="tablist">
        {TURNOS.map((turno) => {
          const cantidad = porTurno[turno.id].filter((f) => f.disponible).length;
          const vacio = porTurno[turno.id].length === 0;
          return (
            <button
              key={turno.id}
              type="button"
              role="tab"
              aria-selected={turnoActivo === turno.id}
              disabled={vacio}
              onClick={() => setTurnoElegido({ clave, turno: turno.id })}
              className={`flex-1 rounded-boton px-2 py-2 text-sm font-medium transition ${
                turnoActivo === turno.id
                  ? 'bg-white text-brand-blue shadow-sm'
                  : vacio
                    ? 'cursor-not-allowed text-slate-300'
                    : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {turno.etiqueta}
              {!vacio && <span className="ml-1 text-xs text-slate-400">({cantidad})</span>}
            </button>
          );
        })}
      </div>

      {!hayDisponibles && <Aviso>No quedan horarios disponibles este día. Prueba con otra fecha.</Aviso>}

      <div className="grid grid-cols-3 gap-2">
        {porTurno[turnoActivo].map((franja) => {
          const elegida = franja.horaInicio === valor;
          return (
            <button
              key={franja.horaInicio}
              type="button"
              disabled={!franja.disponible}
              onClick={() => onChange(franja.horaInicio)}
              aria-pressed={elegida}
              title={franja.disponible ? undefined : 'No disponible'}
              className={`rounded-boton border px-2 py-2.5 text-sm font-medium transition ${
                elegida
                  ? 'border-brand-blue bg-brand-blue text-white shadow-sm'
                  : franja.disponible
                    ? 'border-slate-200 bg-white text-slate-700 hover:border-brand-blue hover:text-brand-blue'
                    : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through'
              }`}
            >
              {formatearHora(franja.horaInicio)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
