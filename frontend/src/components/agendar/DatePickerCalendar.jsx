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
// (fecha de nacimiento, reportes).
//
// En todos los calendarios del sistema (pedido de Oriana) el mes y el año
// del encabezado se pueden pulsar: el mes abre la grilla de los 12 meses
// y el año una lista de años para recorrer, ademas de las flechas de mes.
// No son <select>: se eligen dentro del mismo calendario, y lo que queda
// fuera de los limites sale deshabilitado.
import { useState } from 'react';
import { aFechaLocal, desdeFechaLocal, esMismoDia, sumarDias } from '../../utils/fecha';
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
    flecha: 'boton-texto text-slate-500 hover:text-brand-blue-700',
    encabezado: 'text-brand-navy hover:text-brand-blue-600 hover:underline',
    encabezadoActivo: 'text-brand-blue-600 underline',
    // Tonos -600/-700: slate-400 y brand-blue (500) no llegaban a AA.
    semana: 'text-slate-600',
    elegido: 'bg-brand-blue-700 font-semibold text-white shadow-sm ring-2 ring-brand-amber',
    deshabilitado: 'cursor-not-allowed text-slate-300',
    // Meses/años fuera de los limites: gris que si cumple contraste AA
    // (slate-600, 7.5:1 sobre blanco) y tachado para que no se confunda
    // con uno elegible.
    opcionDeshabilitada: 'cursor-not-allowed text-slate-600 line-through decoration-slate-400',
    hoy: 'font-semibold text-brand-blue-700 ring-1 ring-brand-blue/50 hover:bg-blue-50',
    normal: 'text-slate-800 hover:bg-blue-50 hover:text-brand-blue-700',
  },
  vidrio: {
    titulo: 'text-white',
    flecha: 'boton-texto text-blue-50 hover:text-white',
    encabezado: 'text-white hover:underline',
    encabezadoActivo: 'text-brand-amber underline',
    semana: 'text-blue-100',
    elegido: 'bg-white font-bold text-brand-blue-800 shadow-sm ring-2 ring-brand-amber',
    deshabilitado: 'cursor-not-allowed text-white/35',
    opcionDeshabilitada: 'cursor-not-allowed text-white/70 line-through decoration-white/50',
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
export function DatePickerCalendar({ valor, onChange, diasAbiertos, sobreVidrio = false, minimo, maximo }) {
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
  // Vista del cuerpo: los dias del mes, la
  // grilla de 12 meses o la lista de años. Se cambia pulsando el mes o el
  // año del encabezado; elegir uno vuelve a los dias.
  const [vista, setVista] = useState('dias');
  const mesFueraDeLimites = (anio, indice) =>
    (desde && new Date(anio, indice + 1, 0) < desde) || (hasta && new Date(anio, indice, 1) > hasta);
  // Al cambiar de año el mes puede quedar fuera de los limites (ej. tope
  // en octubre y estaba en diciembre): se lleva al mes valido mas cercano.
  function elegirAnio(anio) {
    let indice = mes.getMonth();
    if (desde && new Date(anio, indice + 1, 0) < desde) indice = desde.getMonth();
    if (hasta && new Date(anio, indice, 1) > hasta) indice = hasta.getMonth();
    setMes(new Date(anio, indice, 1));
    setVista('dias');
  }
  // Texto suelto, sin forma de boton (pedido de Oriana): el hover y el
  // estado abierto se marcan sobre el propio texto (color + subrayado).
  const claseEncabezado = (activa) =>
    `cursor-pointer rounded-sm font-heading text-base font-semibold underline-offset-4 transition-colors hover:[filter:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${activa ? t.encabezadoActivo : t.encabezado}`;
  const claseOpcion = (elegida, deshabilitada) =>
    `rounded-boton px-2 py-2.5 text-sm transition ${elegida ? t.elegido : deshabilitada ? t.opcionDeshabilitada : t.normal}`;

  return (
    <div>
      <div className="flex min-h-9 items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={`Mes: ${MESES[mes.getMonth()]}. Cambiar mes`}
            aria-expanded={vista === 'meses'}
            onClick={() => setVista(vista === 'meses' ? 'dias' : 'meses')}
            className={claseEncabezado(vista === 'meses')}
          >
            {MESES[mes.getMonth()]}
          </button>
          <button
            type="button"
            aria-label={`Año: ${mes.getFullYear()}. Cambiar año`}
            aria-expanded={vista === 'anios'}
            onClick={() => setVista(vista === 'anios' ? 'dias' : 'anios')}
            className={claseEncabezado(vista === 'anios')}
          >
            {mes.getFullYear()}
          </button>
        </div>
        {vista === 'dias' && (
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
        )}
      </div>

      {/* Cada vista ocupa solo lo que necesita (pedido de Oriana): la de
          meses queda mas baja que la de dias; la de años tiene un alto
          maximo y scroll propio. */}
      {vista === 'meses' && (
        <div role="group" aria-label="Elegir mes" className="mt-4 grid grid-cols-3 gap-2">
          {MESES.map((nombre, indice) => {
            const fuera = mesFueraDeLimites(mes.getFullYear(), indice);
            return (
              <button
                key={nombre}
                type="button"
                disabled={Boolean(fuera)}
                aria-pressed={indice === mes.getMonth()}
                onClick={() => {
                  setMes(new Date(mes.getFullYear(), indice, 1));
                  setVista('dias');
                }}
                className={claseOpcion(indice === mes.getMonth(), fuera)}
              >
                {nombre}
              </button>
            );
          })}
        </div>
      )}

      {vista === 'anios' && (
        // p-4 compensado con -m-4: la lista tiene scroll y recortaria lo que
        // sobresale de cada año (anillo y sombra del elegido, resplandor del
        // hover, que se extiende ~15px). Con 16px de aire por lado caben.
        <div role="group" aria-label="Elegir año" className="-m-4 mt-0 grid max-h-[18rem] grid-cols-4 content-start gap-2 overflow-y-auto p-4">
          {anios.map((anio) => (
            <button
              key={anio}
              type="button"
              aria-pressed={anio === mes.getFullYear()}
              // Al abrir, la lista arranca con el año actual a la vista
              // (se mueve solo el scroll de la lista, no el de la pagina).
              ref={
                anio === mes.getFullYear()
                  ? (boton) => {
                      if (boton) boton.parentElement.scrollTop = boton.offsetTop - boton.parentElement.offsetTop - boton.parentElement.clientHeight / 2 + boton.offsetHeight / 2;
                    }
                  : undefined
              }
              onClick={() => elegirAnio(anio)}
              className={claseOpcion(anio === mes.getFullYear(), false)}
            >
              {anio}
            </button>
          ))}
        </div>
      )}

      {vista === 'dias' && (
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
      )}
    </div>
  );
}
