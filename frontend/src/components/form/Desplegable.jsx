// components/form/Desplegable.jsx
// Lista desplegable de vetUI: reemplaza al <select> del navegador en todo el
// sistema.
import { Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconoCheck, IconoChevronAbajo } from '../icons';

const ALTO_MAXIMO_LISTA_PX = 288;
const SEPARACION_PX = 6;

// <option> (sueltos, en arreglos o dentro de fragmentos) -> [{ valor, etiqueta, deshabilitada }]
function leerOpciones(hijos) {
  const opciones = [];
  Children.forEach(hijos, (hijo) => {
    if (!isValidElement(hijo)) return;
    if (hijo.type === 'option') {
      const texto = Children.toArray(hijo.props.children).join('');
      opciones.push({
        valor: String(hijo.props.value ?? texto),
        etiqueta: texto,
        deshabilitada: Boolean(hijo.props.disabled),
      });
    } else if (hijo.props?.children) {
      opciones.push(...leerOpciones(hijo.props.children));
    }
  });
  return opciones;
}

export function Desplegable({
  id,
  value,
  onChange,
  children,
  disabled = false,
  required = false,
  className = '',
  'aria-label': ariaLabel,
  ...resto
}) {
  const idPropio = useId();
  const idCampo = id ?? idPropio;
  const idLista = `${idCampo}-lista`;
  const opciones = leerOpciones(children);
  const valor = String(value ?? '');
  const indiceElegida = opciones.findIndex((opcion) => opcion.valor === valor);
  const elegida = opciones[indiceElegida];

  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  const [caja, setCaja] = useState(null);
  const campo = useRef(null);
  const lista = useRef(null);
  const tecleo = useRef({ texto: '', reloj: null });

  function abrir() {
    if (disabled || opciones.length === 0) return;
    setActiva(indiceElegida >= 0 ? indiceElegida : opciones.findIndex((o) => !o.deshabilitada));
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
    setCaja(null);
  }

  function elegir(indice) {
    const opcion = opciones[indice];
    if (!opcion || opcion.deshabilitada) return;
    cerrar();
    if (opcion.valor !== valor) onChange?.({ target: { value: opcion.valor, id: idCampo } });
  }

  // Siguiente opcion habilitada desde `desde`, en el sentido de `paso`.
  function mover(desde, paso) {
    let indice = desde;
    for (let n = 0; n < opciones.length; n++) {
      indice = Math.min(opciones.length - 1, Math.max(0, indice + paso));
      if (!opciones[indice].deshabilitada) return indice;
      if (indice === 0 || indice === opciones.length - 1) break;
    }
    return desde;
  }

  function alPulsarTecla(evento) {
    const { key } = evento;
    if (!abierto) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        evento.preventDefault();
        abrir();
      }
      return;
    }
    if (key === 'Escape') {
      // Solo cierra la lista: no debe cerrar tambien el panel que la contiene.
      evento.preventDefault();
      evento.stopPropagation();
      cerrar();
    } else if (key === 'ArrowDown') {
      evento.preventDefault();
      setActiva((actual) => mover(actual, 1));
    } else if (key === 'ArrowUp') {
      evento.preventDefault();
      setActiva((actual) => mover(actual, -1));
    } else if (key === 'Home') {
      evento.preventDefault();
      setActiva(mover(-1, 1));
    } else if (key === 'End') {
      evento.preventDefault();
      setActiva(mover(opciones.length, -1));
    } else if (key === 'Enter' || key === ' ') {
      evento.preventDefault();
      elegir(activa);
    } else if (key === 'Tab') {
      elegir(activa);
    } else if (key.length === 1) {
      // Escribir letras: salta a la primera opcion que empieza asi.
      clearTimeout(tecleo.current.reloj);
      tecleo.current.texto += key.toLowerCase();
      tecleo.current.reloj = setTimeout(() => {
        tecleo.current.texto = '';
      }, 600);
      const encontrada = opciones.findIndex(
        (opcion) => !opcion.deshabilitada && opcion.etiqueta.toLowerCase().startsWith(tecleo.current.texto)
      );
      if (encontrada >= 0) setActiva(encontrada);
    }
  }

  // Posicion de la lista: pegada al campo; hacia arriba si abajo no cabe.
  useLayoutEffect(() => {
    if (!abierto) return undefined;
    function ubicar() {
      const r = campo.current.getBoundingClientRect();
      const abajo = window.innerHeight - r.bottom - SEPARACION_PX - 8;
      const arriba = r.top - SEPARACION_PX - 8;
      const haciaArriba = abajo < 160 && arriba > abajo;
      setCaja({
        left: r.left,
        // Al menos tan ancha como el campo; si una opcion es mas larga, la
        // lista crece para mostrarla entera (sin salirse de la pantalla).
        minWidth: r.width,
        maxWidth: Math.max(r.width, window.innerWidth - r.left - 12),
        maxHeight: Math.min(ALTO_MAXIMO_LISTA_PX, Math.max(120, haciaArriba ? arriba : abajo)),
        ...(haciaArriba ? { bottom: window.innerHeight - r.top + SEPARACION_PX } : { top: r.bottom + SEPARACION_PX }),
      });
    }
    ubicar();
    // Si la pagina o el panel se desplazan, la lista dejaria de estar bajo
    // su campo: se cierra (igual que un <select>).
    function alDesplazar(evento) {
      if (lista.current?.contains(evento.target)) return;
      cerrar();
    }
    function alPresionarFuera(evento) {
      if (campo.current?.contains(evento.target) || lista.current?.contains(evento.target)) return;
      cerrar();
    }
    window.addEventListener('resize', cerrar);
    document.addEventListener('scroll', alDesplazar, true);
    document.addEventListener('pointerdown', alPresionarFuera, true);
    return () => {
      window.removeEventListener('resize', cerrar);
      document.removeEventListener('scroll', alDesplazar, true);
      document.removeEventListener('pointerdown', alPresionarFuera, true);
    };
  }, [abierto]);

  // La opcion activa siempre a la vista dentro de la lista.
  useEffect(() => {
    if (!abierto || !caja) return;
    lista.current?.querySelector('[data-activa="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [abierto, caja, activa]);

  useEffect(() => () => clearTimeout(tecleo.current.reloj), []);

  // La opcion de valor vacio ("Selecciona...", "Todas las sedes") se lee
  // como texto de ayuda mientras no se elija otra.
  const esMarcador = !elegida || elegida.valor === '';

  return (
    <>
      <button
        {...resto}
        ref={campo}
        id={idCampo}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-activedescendant={abierto && activa >= 0 ? `${idLista}-${activa}` : undefined}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        disabled={disabled}
        data-abierto={abierto || undefined}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={alPulsarTecla}
        // min-w: el ancho no baila al cambiar de opcion (un <select> se
        // ajusta solo a la opcion mas larga; un boton, a la elegida).
        className={`campo flex min-w-40 items-center justify-between gap-2 text-left ${className}`}
      >
        <span className={`min-w-0 flex-1 truncate ${esMarcador ? 'text-slate-500' : ''}`}>
          {elegida?.etiqueta ?? ' '}
        </span>
        <IconoChevronAbajo
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 motion-reduce:transition-none ${
            abierto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {abierto &&
        caja &&
        createPortal(
          <ul
            ref={lista}
            id={idLista}
            role="listbox"
            aria-label={ariaLabel}
            tabIndex={-1}
            style={caja}
            className="desplegable-lista fixed z-[70] w-max overflow-y-auto"
          >
            {opciones.map((opcion, indice) => {
              const esElegida = indice === indiceElegida;
              return (
                <li
                  key={`${opcion.valor}-${indice}`}
                  id={`${idLista}-${indice}`}
                  role="option"
                  aria-selected={esElegida}
                  aria-disabled={opcion.deshabilitada || undefined}
                  data-activa={indice === activa}
                  // mousedown no debe quitarle el foco al campo.
                  onMouseDown={(evento) => evento.preventDefault()}
                  onMouseEnter={() => !opcion.deshabilitada && setActiva(indice)}
                  onClick={() => elegir(indice)}
                  className="desplegable-opcion"
                >
                  <span className="min-w-0 flex-1 truncate">{opcion.etiqueta}</span>
                  {esElegida && <IconoCheck className="h-4 w-4 shrink-0" peso="bold" />}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </>
  );
}
