// components/ui/Tabs.jsx
export function Tabs({ items, activeItem, onChange }) {
  return (
    <div className="flex gap-1 border-b border-slate-200">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeItem === item.id
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
