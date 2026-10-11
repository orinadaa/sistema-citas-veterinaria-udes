// components/form/SelectorSexo.jsx
// Segmented control Hembra / Macho (reemplaza al <select> de sexo). Lo
// usan los formularios de mascota del admin (Detalle del paciente) y del
// cliente (FormularioMascotaPanel).
// Valores: 'hembra' | 'macho' | '' (sin elegir). Si no es requerido, un
// clic sobre la opcion elegida la desmarca (equivale al "Selecciona" del
// <select> que reemplaza).
import { IconoHembra, IconoMacho } from '../icons';

const OPCIONES = [
  { valor: 'hembra', etiqueta: 'Hembra', Icono: IconoHembra, activa: 'bg-pink-50 text-pink-700 ring-pink-300', icono: 'text-pink-500' },
  { valor: 'macho', etiqueta: 'Macho', Icono: IconoMacho, activa: 'bg-blue-50 text-brand-blue ring-brand-blue-400', icono: 'text-brand-blue' },
];

export function SelectorSexo({ id, valor, onChange, requerido = false, etiqueta = 'Sexo' }) {
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
      <div role="radiogroup" aria-labelledby={`${id}-etiqueta`} className="grid grid-cols-2 gap-2">
        {OPCIONES.map((opcion) => {
          const elegida = valor === opcion.valor;
          return (
            <button
              key={opcion.valor}
              type="button"
              role="radio"
              aria-checked={elegida}
              onClick={() => onChange(elegida && !requerido ? '' : opcion.valor)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-boton px-3 py-2 text-sm font-medium ring-1 transition ${
                elegida ? `${opcion.activa} ring-2` : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
              }`}
            >
              <opcion.Icono className={`h-4 w-4 ${opcion.icono}`} peso="bold" />
              {opcion.etiqueta}
            </button>
          );
        })}
      </div>
    </div>
  );
}
