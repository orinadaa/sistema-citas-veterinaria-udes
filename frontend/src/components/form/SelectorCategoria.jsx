// components/form/SelectorCategoria.jsx
// Categoria de un servicio como botones: una pildora por categoria con su
// punto de color, el mismo lenguaje de CategoryBadge que se ve en las tablas.
import { useRef } from 'react';
import { COLORES_CATEGORIA } from '../ui/CategoryBadge';
import { IconoCheck } from '../icons';

export function SelectorCategoria({ id, categorias, valor, onChange, etiqueta = 'Categoría', requerido = false }) {
  const grupo = useRef(null);

  // Flechas: pasan a la categoria anterior/siguiente (con vuelta), la
  // eligen y le dan el foco; Inicio/Fin van a los extremos.
  function alPulsarTecla(evento, indice) {
    const ultimo = categorias.length - 1;
    let destino = null;
    if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') destino = indice === ultimo ? 0 : indice + 1;
    else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') destino = indice === 0 ? ultimo : indice - 1;
    else if (evento.key === 'Home') destino = 0;
    else if (evento.key === 'End') destino = ultimo;
    if (destino === null) return;
    evento.preventDefault();
    onChange(categorias[destino].id);
    grupo.current?.querySelectorAll('[role="radio"]')[destino]?.focus();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-etiqueta`} className="text-sm font-medium text-slate-700">
        {etiqueta}
        {requerido && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </span>
      <div
        ref={grupo}
        id={id}
        role="radiogroup"
        aria-required={requerido}
        aria-labelledby={`${id}-etiqueta`}
        className="flex flex-wrap gap-2"
      >
        {categorias.map((categoria, indice) => {
          const elegida = categoria.id === valor;
          const tono = COLORES_CATEGORIA[categoria.color] ?? COLORES_CATEGORIA.blue;
          return (
            <button
              key={categoria.id}
              type="button"
              role="radio"
              aria-checked={elegida}
              // Un solo punto de Tab en el grupo: la elegida, o la primera
              // si aun no hay ninguna.
              tabIndex={elegida || (!valor && indice === 0) ? 0 : -1}
              onClick={() => onChange(categoria.id)}
              onKeyDown={(evento) => alPulsarTecla(evento, indice)}
              style={elegida ? { backgroundColor: tono.bg, color: tono.text, boxShadow: `inset 0 0 0 2px ${tono.text}` } : undefined}
              className={`inline-flex min-h-10 items-center gap-2 rounded-boton px-3.5 py-2 text-sm transition hover:[filter:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                elegida ? 'font-semibold' : 'bg-white font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:ring-slate-400'
              }`}
            >
              {/* El punto de color de la categoria va siempre; la elegida
                  suma el check al final. */}
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tono.dot }} />
              {categoria.nombre}
              {elegida && <IconoCheck className="h-3.5 w-3.5" peso="bold" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
