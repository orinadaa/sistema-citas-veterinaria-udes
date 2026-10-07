// components/agendar/DatePickerCalendar.jsx
// Calendario de mes, el unico del sistema para elegir una fecha: se usa
// tal cual para la cita (agendar, reprogramar) y dentro de CampoFecha
// para cualquier otro campo de fecha. Por defecto los dias pasados y los
// dias en que la sede no atiende (sin fila en horario_atencion) quedan
// deshabilitados; hoy se marca sutilmente; el dia elegido en azul
// solido. Trabaja con fechas "YYYY-MM-DD" en hora local, el mismo
// formato que espera GET /api/citas/disponibilidad.
//
// minimo / maximo ("YYYY-MM-DD"): limites elegibles. minimo sin pasar =
// hoy (no se agenda en el pasado); minimo={null} = sin limite inferior
// (fecha de nacimiento, reportes). selectorRapido: mes y año como listas
// en el encabezado, para fechas lejanas (nacimiento).
import { useState } from 'react';
import { aFechaLocal, desdeFechaLocal, esMismoDia, formatearMesAnio, sumarDias } from '../../utils/fecha';
import { IconoFlechaDerecha } from '../icons';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
// Años que ofrece el selector rapido cuando no hay limite de ese lado.
const ANIOS_ATRAS = 30;
const ANIOS_ADELANTE = 5;

// Dos tonos: claro (por defecto; panel del medico, fondo blanco) y
// sobreVidrio (flujo del cliente, dentro de una Superficie de vetUI:
// texto blanco, dia elegido en blanco con anillo ambar).
const TONOS = {
  claro: {
    titulo: 'text-brand-navy',
    flecha: 'text-slate-500 hover:bg-slate-100',
    lista: 'border-slate-300 bg-white text-brand-navy',
    // Tonos -600/-700: slate-400 y brand-blue (500) no llegaban a AA.
    semana: 'text-slate-600',
    elegido: 'bg-brand-blue-700 font-semibold text-white shadow-sm ring-2 ring-brand-amber',
    deshabilitado: 'cursor-not-allowed text-slate-300',
    hoy: 'font-semibold text-brand-blue-700 ring-1 ring-brand-blue/50 hover:bg-blue-50',
    normal: 'text-slate-800 hover:bg-blue-50 hover:text-brand-blue-700',
  },
  vidrio: {
    titulo: 'text-white',
    flecha: 'text-blue-50 hover:bg-white/10',
    lista: 'border-white/30 bg-brand-blue-800 text-white',
    semana: 'text-blue-100',
    elegido: 'bg-white font-bold text-brand-blue-800 shadow-sm ring-2 ring-brand-amber',
    deshabilitado: 'cursor-not-allowed text-white/35',
    hoy: 'font-semibold text-white ring-1 ring-white/60 hover:bg-white/15',
    normal: 'text-white hover:bg-white/15',
  },
};

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
export function DatePickerCalendar({ valor, onChange, diasAbiertos, sobreVidrio = false, minimo, maximo, selectorRapido = false }) {
  const t = sobreVidrio ? TONOS.vidrio : TONOS.claro;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const seleccionada = valor ? desdeFechaLocal(valor) : null;
  const desde = minimo === undefined ? hoy : minimo ? desdeFechaLocal(minimo) : null;
  const hasta = maximo ? desdeFechaLocal(maximo) : null;
  // Abre en el mes del valor; si no hay, en hoy llevado dentro de los limites.
  const [mes, setMes] = useState(() => {
    if (seleccionada) return inicioDeMes(seleccionada);
    if (hasta && hoy > hasta) return inicioDeMes(hasta);
    if (desde && hoy < desde) return inicioDeMes(desde);
    return inicioDeMes(hoy);
  });

  const enPrimerMes = Boolean(desde) && mes <= inicioDeMes(desde);
  const enUltimoMes = Boolean(hasta) && mes >= inicioDeMes(hasta);
  const celdas = generarCeldas(mes);

  const anioInicial = desde ? desde.getFullYear() : hoy.getFullYear() - ANIOS_ATRAS;
  const anioFinal = hasta ? hasta.getFullYear() : hoy.getFullYear() + ANIOS_ADELANTE;
  const anios = [];
  for (let anio = Math.min(anioInicial, mes.getFullYear()); anio <= Math.max(anioFinal, mes.getFullYear()); anio++) anios.push(anio);
  const claseLista = `rounded-lg border px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/30 ${t.lista}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        {selectorRapido ? (
          <div className="flex gap-1.5">
            <select
              aria-label="Mes"
              value={mes.getMonth()}
              onChange={(e) => setMes(new Date(mes.getFullYear(), Number(e.target.value), 1))}
              className={claseLista}
            >
              {MESES.map((nombre, indice) => (
                <option key={nombre} value={indice}>
                  {nombre}
                </option>
              ))}
            </select>
            <select
              aria-label="Año"
              value={mes.getFullYear()}
              onChange={(e) => setMes(new Date(Number(e.target.value), mes.getMonth(), 1))}
              className={claseLista}
            >
              {anios.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className={`font-heading text-base font-semibold ${t.titulo}`}>{formatearMesAnio(mes)}</p>
        )}
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Mes anterior"
            disabled={enPrimerMes}
            onClick={() => setMes((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className={`rounded-boton p-1.5 transition disabled:cursor-not-allowed disabled:opacity-30 ${t.flecha}`}
          >
            <IconoFlechaDerecha className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            aria-label="Mes siguiente"
            disabled={enUltimoMes}
            onClick={() => setMes((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className={`rounded-boton p-1.5 transition disabled:cursor-not-allowed disabled:opacity-30 ${t.flecha}`}
          >
            <IconoFlechaDerecha className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {DIAS_SEMANA.map((dia) => (
          <span key={dia} className={`pb-1 text-xs font-medium ${t.semana}`}>
            {dia}
          </span>
        ))}
        {celdas.map((celda) => {
          const delMes = celda.getMonth() === mes.getMonth();
          const fueraDeLimites = (desde && celda < desde) || (hasta && celda > hasta);
          const cerrado = diasAbiertos ? !diasAbiertos.has(celda.getDay()) : false;
          const deshabilitado = !delMes || fueraDeLimites || cerrado;
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
              title={cerrado && !fueraDeLimites ? 'La sede no atiende este día' : undefined}
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-boton text-sm transition ${
                esElegido ? t.elegido : deshabilitado ? t.deshabilitado : esHoy ? t.hoy : t.normal
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
