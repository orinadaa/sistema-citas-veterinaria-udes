// components/ui/KPICard.jsx
// Tarjeta de indicador: icono en circulo de color, numero grande, etiqueta.
const COLORES = {
  blue: 'bg-blue-50 text-brand-blue',
  green: 'bg-emerald-50 text-brand-green',
  red: 'bg-red-50 text-brand-red',
  amber: 'bg-amber-50 text-brand-amber',
};

export function KPICard({ icon: Icono, color = 'blue', value, label }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${COLORES[color] ?? COLORES.blue}`}>
        {Icono && <Icono className="h-5 w-5" />}
      </div>
      <p className="mt-4 font-heading text-2xl font-bold text-brand-navy">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
    </div>
  );
}
