// components/citas/MiniCalendario.jsx
// Mini calendario mensual navegable (columna lateral del calendario de
// citas): permite saltar a cualquier dia, que a su vez mueve la semana
// visible del grid principal.
import { useEffect, useState } from 'react';
import { esMismoDia, formatearMesAnio, sumarDias } from '../../utils/fecha';
import { IconoFlechaDerecha } from '../icons';

const LETRAS_DIA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function inicioDeMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

function generarCeldas(mesMostrado) {
  const primerDiaMes = inicioDeMes(mesMostrado);
  const offsetLunes = primerDiaMes.getDay() === 0 ? 6 : primerDiaMes.getDay() - 1;
  const inicioGrid = sumarDias(primerDiaMes, -offsetLunes);
  return Array.from({ length: 42 }, (_, indice) => sumarDias(inicioGrid, indice));
}

// clase: el contenedor. Por defecto la tarjeta blanca del panel; la vista del
// medico (vetUI) pasa un vidrio blanco.
export function MiniCalendario({ diaSeleccionado, onSeleccionarDia, clase = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200' }) {
  const [mesMostrado, setMesMostrado] = useState(() => inicioDeMes(diaSeleccionado));

  useEffect(() => {
    setMesMostrado((actual) =>
      actual.getMonth() === diaSeleccionado.getMonth() && actual.getFullYear() === diaSeleccionado.getFullYear()
        ? actual
        : inicioDeMes(diaSeleccionado)
    );
  }, [diaSeleccionado]);

  const celdas = generarCeldas(mesMostrado);
  const hoy = new Date();

  return (
    <div className={clase}>
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold text-brand-navy">{formatearMesAnio(mesMostrado)}</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMesMostrado((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            aria-label="Mes anterior"
            className="boton-texto rounded-boton p-1.5 text-slate-600 transition hover:text-slate-900"
          >
            <IconoFlechaDerecha className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => setMesMostrado((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            aria-label="Mes siguiente"
            className="boton-texto rounded-boton p-1.5 text-slate-600 transition hover:text-slate-900"
          >
            <IconoFlechaDerecha className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-xs">
        {LETRAS_DIA.map((letra, indice) => (
          <span key={indice} className="text-slate-400">
            {letra}
          </span>
        ))}
        {celdas.map((celda) => {
          const esDelMes = celda.getMonth() === mesMostrado.getMonth();
          const esHoy = esMismoDia(celda, hoy);
          const esSeleccionado = esMismoDia(celda, diaSeleccionado);
          return (
            <button
              key={celda.toISOString()}
              type="button"
              onClick={() => onSeleccionarDia(celda)}
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-boton transition ${
                esSeleccionado
                  ? 'bg-brand-blue-600 text-white'
                  : esHoy
                    ? 'font-semibold text-brand-blue-600'
                    : esDelMes
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-slate-50'
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
