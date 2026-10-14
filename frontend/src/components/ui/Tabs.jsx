// components/ui/Tabs.jsx
// items: [{ id, label, icon? }] -- icon opcional (componente de icons.jsx).
// sobreVidrio: las pestañas van directo sobre la hoja translucida del panel
// (texto blanco, activa con linea ambar).
export function Tabs({ items, activeItem, onChange, sobreVidrio = false }) {
  const activa = sobreVidrio ? 'border-brand-amber text-white' : 'border-brand-blue-700 text-brand-blue-700';
  const inactiva = sobreVidrio
    ? 'hover-texto-ilumina border-transparent text-white/80 hover:text-white'
    : 'border-transparent text-slate-700 hover:text-slate-900';
  return (
    <div role="tablist" className={`flex gap-1 border-b ${sobreVidrio ? 'border-white/25' : 'border-slate-900/15'}`}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={activeItem === item.id}
          onClick={() => onChange(item.id)}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeItem === item.id ? activa : inactiva
          }`}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          {item.label}
        </button>
      ))}
    </div>
  );
}
