// components/agendar/TimeSlotPicker.jsx
// RF-07: horarios del dia elegido, en tabs Mañana / Tarde / Noche (solo
// los turnos que el horario de atencion de la sede cubre ese dia). La
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

// Dos tonos, como DatePickerCalendar: claro (panel del medico) y
// sobreVidrio (flujo del cliente en vetUI). En vidrio las horas libres son
// pildoras de cristal y la elegida es blanca con anillo ambar.
const TONOS = {
  claro: {
    aviso: 'bg-slate-50 text-slate-600 ring-slate-200',
    avisoIcono: 'text-slate-400',
    esqueleto: 'bg-slate-100',
    reintentar: 'text-brand-blue',
    pestanas: 'bg-slate-100',
    // Tonos -600/-700: slate-400/500 y brand-blue (500) no llegaban a AA.
    pestanaActiva: 'bg-white text-brand-blue-700 shadow-sm',
    pestana: 'text-slate-700 hover:text-slate-900',
    conteo: 'opacity-80',
    elegida: 'border-brand-blue-700 bg-brand-blue-700 text-white shadow-sm ring-2 ring-brand-amber',
    libre: 'border-slate-300 bg-white text-slate-800 hover:border-brand-blue hover:text-brand-blue-700',
    ocupada: 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through',
  },
  vidrio: {
    aviso: 'bg-brand-blue-800/40 text-blue-50 ring-white/30',
    avisoIcono: 'text-blue-100',
    esqueleto: 'bg-white/12',
    reintentar: 'text-white underline',
    pestanas: 'bg-brand-blue-800/40 ring-1 ring-white/20',
    pestanaActiva: 'bg-white text-brand-blue-800 shadow-sm',
    pestana: 'text-blue-50 hover:text-white',
    conteo: 'opacity-80',
    elegida: 'border-transparent bg-white font-bold text-brand-blue-800 shadow-sm ring-2 ring-brand-amber',
    libre: 'cristal hover-ilumina-claro border-transparent text-slate-900',
    ocupada: 'cursor-not-allowed border-white/15 bg-white/5 text-white/40 line-through',
  },
};

function Aviso({ children, t }) {
  return (
    <p className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ring-1 ${t.aviso}`}>
      <IconoAlerta className={`mt-0.5 h-4 w-4 shrink-0 ${t.avisoIcono}`} />
      {children}
    </p>
  );
}

// medicoId (opcional): disponibilidad de un solo medico (el medico que
// agenda desde su panel) en vez del agregado de la sede.
export function TimeSlotPicker({ sedeId, servicioId, fecha, valor, onChange, medicoId, sobreVidrio = false }) {
  const t = sobreVidrio ? TONOS.vidrio : TONOS.claro;
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

  if (!fecha) return <Aviso t={t}>Selecciona un día en el calendario para ver los horarios.</Aviso>;

  const cargando = resultado.clave !== clave;
  if (cargando) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className={`h-11 animate-pulse rounded-xl ${t.esqueleto}`} />
        ))}
      </div>
    );
  }

  if (resultado.error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Aviso t={t}>{resultado.error}</Aviso>
        <button
          type="button"
          onClick={() => {
            setResultado({ clave: null, datos: null, error: '' });
            setIntento((n) => n + 1);
          }}
          className={`text-sm font-semibold hover:underline ${t.reintentar}`}
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { franjas, medicosDisponiblesEnSede, medicosEnSede } = resultado.datos;
  if (franjas.length === 0) return <Aviso t={t}>La sede no atiende este día. Elige otra fecha.</Aviso>;
  // medicosEnSede: prestan el servicio en la sede algun dia; si hay pero
  // ninguno ese dia (horario propio del medico), se sugiere otra fecha.
  if ((medicosEnSede ?? medicosDisponiblesEnSede) === 0) {
    return <Aviso t={t}>Este servicio no se presta en la sede seleccionada. Elige otra sede.</Aviso>;
  }
  if (medicosDisponiblesEnSede === 0) {
    return <Aviso t={t}>Ningún médico atiende este servicio ese día. Prueba con otra fecha.</Aviso>;
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
      <div className={`flex rounded-boton p-1 ${t.pestanas}`} role="tablist">
        {/* Solo los turnos con franjas en el horario de la sede ese dia: si
            la sede no atiende de noche, no se muestra "Noche". */}
        {turnosConFranjas.map((turno) => {
          const cantidad = porTurno[turno.id].filter((f) => f.disponible).length;
          return (
            <button
              key={turno.id}
              type="button"
              role="tab"
              aria-selected={turnoActivo === turno.id}
              onClick={() => setTurnoElegido({ clave, turno: turno.id })}
              className={`flex-1 rounded-boton px-2 py-2 text-sm font-medium transition ${
                turnoActivo === turno.id ? t.pestanaActiva : t.pestana
              }`}
            >
              {turno.etiqueta}
              <span className={`ml-1 text-xs ${t.conteo}`}>({cantidad})</span>
            </button>
          );
        })}
      </div>

      {!hayDisponibles && <Aviso t={t}>No quedan horarios disponibles este día. Prueba con otra fecha.</Aviso>}

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
                elegida ? t.elegida : franja.disponible ? t.libre : t.ocupada
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
