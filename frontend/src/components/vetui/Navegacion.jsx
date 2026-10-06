// components/vetui/Navegacion.jsx
// Controles de navegación entre vistas, sobre fondo oscuro:
//   Pestanas  control segmentado de vidrio (vistas hermanas: Mis citas /
//             Mis mascotas). La activa es una píldora blanca.
//   Chips     filtros con conteo (Todas, Próximas...). Activo blanco,
//             inactivos vidrio claro.
// items: [{ id, etiqueta, icono?, conteo? }]
export function Pestanas({ items, activo, onCambiar, etiqueta = 'Secciones' }) {
  return (
    <div role="tablist" aria-label={etiqueta} className="vidrio inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-boton p-1">
      {items.map((item) => {
        const seleccionada = activo === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={seleccionada}
            onClick={() => onCambiar(item.id)}
            className={`inline-flex items-center gap-2 rounded-boton px-4 py-2 text-sm font-semibold transition ${
              seleccionada ? 'bg-white text-brand-blue-800 shadow-sm' : 'text-blue-50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.icono && <item.icono className="h-4 w-4" />}
            {item.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

export function Chips({ items, activo, onCambiar }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const seleccionado = activo === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={seleccionado}
            onClick={() => onCambiar(item.id)}
            className={`rounded-boton px-4 py-1.5 text-sm font-semibold transition ${
              seleccionado ? 'bg-white text-brand-blue-800 shadow-sm' : 'boton-glass-claro text-white'
            }`}
          >
            {item.etiqueta}
            {item.conteo !== undefined && ` (${item.conteo})`}
          </button>
        );
      })}
    </div>
  );
}
