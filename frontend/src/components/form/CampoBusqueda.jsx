// components/form/CampoBusqueda.jsx
// Buscador de vetUI: reemplaza al <input type="search"> suelto. Es un
// `campo` mas, con la lupa a la izquierda (se reconoce como buscador sin
// leer el texto de ayuda) y, cuando hay algo escrito, una X propia para
// borrar (la X que agrega el navegador se oculta en vetui.css).
//
// Se usa igual que el input que reemplaza: value, onChange (evento con
// target.value) y placeholder. `className` va al contenedor (ej. flex-1).
import { IconoBuscar, IconoX } from '../icons';

export function CampoBusqueda({ value, onChange, placeholder = 'Buscar...', className = '', 'aria-label': ariaLabel, ...resto }) {
  return (
    <div className={`relative ${className}`}>
      <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        {...resto}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        // El texto de ayuda nombra el campo si no viene una etiqueta.
        aria-label={ariaLabel ?? placeholder.replace(/\.+$/, '')}
        className="campo w-full py-2 pl-9 pr-9 text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange?.({ target: { value: '' } })}
          aria-label="Borrar la búsqueda"
          className="boton-texto absolute right-1.5 top-1/2 -translate-y-1/2 rounded-boton p-1.5 text-slate-500 hover:text-slate-700"
        >
          <IconoX className="h-3.5 w-3.5" peso="bold" />
        </button>
      )}
    </div>
  );
}
