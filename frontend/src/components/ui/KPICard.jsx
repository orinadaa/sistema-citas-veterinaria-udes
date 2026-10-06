// components/ui/KPICard.jsx
// Tarjeta de indicador: icono en circulo de color, numero grande, etiqueta.
// `detalle` (opcional) agrega una segunda linea chica bajo el valor (ej.
// la hora de la proxima cita, debajo de su fecha). `onClick` (opcional)
// agrega un boton circular de flecha para navegar al detalle -- ninguno
// de los dos cambia el comportamiento de los paneles que no los pasan.
import { IconoFlechaDerecha } from '../icons';

const COLORES = {
  blue: 'bg-blue-50 text-brand-blue',
  green: 'bg-emerald-50 text-brand-green',
  red: 'bg-red-50 text-brand-red',
  amber: 'bg-amber-50 text-brand-amber',
  pink: 'bg-[#FDE6F0] text-[#C23E80]',
  purple: 'bg-violet-50 text-violet-600',
};

export function KPICard({ icon: Icono, color = 'blue', value, detalle, label, onClick }) {
  return (
    <div className="relative rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${COLORES[color] ?? COLORES.blue}`}>
        {Icono && <Icono className="h-5 w-5" />}
      </div>
      <p className="mt-4 font-heading text-2xl font-bold text-brand-navy">{value}</p>
      {detalle && <p className="text-xs text-slate-400">{detalle}</p>}
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>

      {onClick && (
        <button
          type="button"
          onClick={onClick}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-boton bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <IconoFlechaDerecha className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
