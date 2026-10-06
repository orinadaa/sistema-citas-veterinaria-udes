// components/agendar/DatePickerCalendar.jsx
// Calendario de mes para elegir el dia de la cita: dias pasados y dias
// en que la sede no atiende (sin fila en horario_atencion) quedan
// deshabilitados; hoy se marca sutilmente; el dia elegido en azul
// solido. Trabaja con fechas "YYYY-MM-DD" en hora local, el mismo
// formato que espera GET /api/citas/disponibilidad.
import { useState } from 'react';
import { aFechaLocal, desdeFechaLocal, esMismoDia, formatearMesAnio, sumarDias } from '../../utils/fecha';
import { IconoFlechaDerecha } from '../icons';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function inicioDeMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

// 6 semanas completas empezando en lunes (mismo criterio que MiniCalendario).
function generarCeldas(mes) {
  const primerDia = inicioDeMes(mes);
  const offsetLunes = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;
  const inicio = sumarDias(primerDia, -offsetLunes);
  return Array.from({ length: 42 }, (_, i) => sumarDias(inicio, i));
}

// diasAbiertos: Set de dia_semana (0=domingo..6=sabado) con horario, o
// null mientras carga (en ese caso no se deshabilita por dia de semana).
export function DatePickerCalendar({ valor, onChange, diasAbiertos }) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const seleccionada = valor ? desdeFechaLocal(valor) : null;
  const [mes, setMes] = useState(() => inicioDeMes(seleccionada || hoy));

  const esMesActual = mes.getFullYear() === hoy.getFullYear() && mes.getMonth() === hoy.getMonth();
  const celdas = generarCeldas(mes);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-heading text-base font-semibold text-brand-navy">{formatearMesAnio(mes)}</p>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Mes anterior"
            disabled={esMesActual}
            onClick={() => setMes((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="rounded-boton p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <IconoFlechaDerecha className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => setMes((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className="rounded-boton p-1.5 text-slate-500 transition hover:bg-slate-100"
          >
            <IconoFlechaDerecha className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {DIAS_SEMANA.map((dia) => (
          <span key={dia} className="pb-1 text-xs font-medium text-slate-400">
            {dia}
          </span>
        ))}
        {celdas.map((celda) => {
          const delMes = celda.getMonth() === mes.getMonth();
          const pasado = celda < hoy;
          const cerrado = diasAbiertos ? !diasAbiertos.has(celda.getDay()) : false;
          const deshabilitado = !delMes || pasado || cerrado;
          const esHoy = esMismoDia(celda, hoy);
          const esElegido = seleccionada && esMismoDia(celda, seleccionada);

          if (!delMes) return <span key={celda.toISOString()} aria-hidden="true" />;

          return (
            <button
              key={celda.toISOString()}
              type="button"
              disabled={deshabilitado}
              onClick={() => onChange(aFechaLocal(celda))}
              aria-pressed={Boolean(esElegido)}
              title={cerrado && !pasado ? 'La sede no atiende este día' : undefined}
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-boton text-sm transition ${
                esElegido
                  ? 'bg-brand-blue font-semibold text-white shadow-sm'
                  : deshabilitado
                    ? 'cursor-not-allowed text-slate-300'
                    : esHoy
                      ? 'font-semibold text-brand-blue ring-1 ring-brand-blue/40 hover:bg-blue-50'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-brand-blue'
              }`}
            >
              {celda.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
