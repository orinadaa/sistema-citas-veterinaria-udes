// components/ui/Tabs.jsx
// items: [{ id, label, icon? }] -- icon opcional (componente de icons.jsx).
export function Tabs({ items, activeItem, onChange }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-slate-200">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={activeItem === item.id}
          onClick={() => onChange(item.id)}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeItem === item.id
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          {item.label}
        </button>
      ))}
    </div>
  );
}
