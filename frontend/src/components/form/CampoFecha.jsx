// components/form/CampoFecha.jsx
// Campo de fecha estandar del sistema: reemplaza a <input type="date"> (el
// calendario del navegador) en todos los formularios.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DatePickerCalendar } from '../agendar/DatePickerCalendar';
import { desdeFechaLocal } from '../../utils/fecha';
import { IconoCalendario } from '../icons';

const SEPARACION_PX = 8;
const MARGEN_PANTALLA_PX = 12;

function formatear(valor) {
  return desdeFechaLocal(valor).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function CampoFecha({
  id,
  etiqueta,
  etiquetaAccesible,
  valor,
  onChange,
  minimo,
  maximo,
  requerido = false,
  placeholder = 'Selecciona una fecha',
  alinear = 'izquierda',
  claseEtiqueta = 'text-sm font-medium text-slate-700',
  className = '',
}) {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef(null);
  const desplegable = useRef(null);

  // Ubica el desplegable junto al campo en cada frame mientras esta
  // abierto (el campo puede moverse: scroll de la pagina o del panel).
  useLayoutEffect(() => {
    if (!abierto) return undefined;
    let cuadro = null;
    const ubicar = () => {
      const campo = boton.current?.getBoundingClientRect();
      const caja = desplegable.current;
      if (campo && caja) {
        const ancho = caja.offsetWidth;
        const alto = caja.offsetHeight;
        const cabeAbajo = campo.bottom + SEPARACION_PX + alto <= window.innerHeight - MARGEN_PANTALLA_PX;
        const cabeArriba = campo.top - SEPARACION_PX - alto >= MARGEN_PANTALLA_PX;
        const arriba = !cabeAbajo && cabeArriba;
        const izquierda = alinear === 'derecha' ? campo.right - ancho : campo.left;
        caja.style.top = `${arriba ? campo.top - SEPARACION_PX - alto : campo.bottom + SEPARACION_PX}px`;
        caja.style.left = `${Math.max(MARGEN_PANTALLA_PX, Math.min(izquierda, window.innerWidth - ancho - MARGEN_PANTALLA_PX))}px`;
        caja.style.visibility = 'visible';
      }
      cuadro = requestAnimationFrame(ubicar);
    };
    ubicar();
    return () => cancelAnimationFrame(cuadro);
  }, [abierto, alinear]);

  // Abierto: se cierra con un clic afuera o con Escape. Escape se atiende
  // en fase de captura y no se propaga, para que no cierre tambien el
  // panel lateral que contiene el campo.
  useEffect(() => {
    if (!abierto) return undefined;
    function alHacerClic(evento) {
      if (boton.current?.contains(evento.target) || desplegable.current?.contains(evento.target)) return;
      setAbierto(false);
    }
    function alPresionarTecla(evento) {
      if (evento.key !== 'Escape') return;
      evento.stopPropagation();
      setAbierto(false);
    }
    document.addEventListener('mousedown', alHacerClic);
    document.addEventListener('keydown', alPresionarTecla, true);
    return () => {
      document.removeEventListener('mousedown', alHacerClic);
      document.removeEventListener('keydown', alPresionarTecla, true);
    };
  }, [abierto]);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {etiqueta && (
        <label htmlFor={id} className={claseEtiqueta}>
          {etiqueta}
          {requerido && (
            <span className="ml-0.5 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <button
        ref={boton}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={etiqueta ? undefined : `${etiquetaAccesible || 'Fecha'}: ${valor ? formatear(valor) : placeholder}`}
        onClick={() => setAbierto((v) => !v)}
        data-abierto={abierto || undefined}
        className="campo flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm"
      >
        <span className={`truncate ${valor ? 'text-slate-900' : 'text-slate-500'}`}>{valor ? formatear(valor) : placeholder}</span>
        <IconoCalendario className="h-4 w-4 shrink-0 text-brand-blue" />
      </button>

      {abierto &&
        createPortal(
        <div
          ref={desplegable}
          role="dialog"
          aria-label={`Elegir ${(etiqueta || etiquetaAccesible || 'fecha').toLowerCase()}`}
          // z-[70]: encima de los paneles laterales (z-50) y del editor de
          // foto (z-60). Invisible hasta que el efecto de arriba lo ubica.
          style={{ visibility: 'hidden' }}
          className="fixed z-[70] w-[21rem] max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200"
        >
          <DatePickerCalendar
            valor={valor}
            minimo={minimo}
            maximo={maximo}
            onChange={(fecha) => {
              onChange(fecha);
              setAbierto(false);
            }}
          />
          {!requerido && valor && (
            <div className="mt-3 border-t border-slate-200 pt-3 text-right">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setAbierto(false);
                }}
                className="text-xs font-semibold text-brand-blue-700 hover:underline"
              >
                Borrar fecha
              </button>
            </div>
          )}
        </div>,
          document.body
        )}
    </div>
  );
}
