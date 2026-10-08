// components/form/SelectorEncuadre.jsx
// Encuadre de una foto que el sitio va a recortar (galeria del inicio,
// foto de un servicio): la foto completa con un punto que marca lo que
// debe quedar siempre a la vista, y debajo una vista previa del recorte.
// El punto se mueve con un clic sobre la foto o con los dos deslizadores
// (para teclado). Entrega porcentajes 0-100 por onCambiar({ focoX, focoY }),
// que el sitio aplica como object-position.
//
// proporcionVista: proporcion del marco donde se mostrara (clase de
// Tailwind), para que la vista previa recorte igual que el sitio.
// mostrarVista={false}: sin la vista previa (EncuadreModal la dibuja
// aparte, mas grande).
export function SelectorEncuadre({
  src,
  focoX,
  focoY,
  onCambiar,
  proporcionVista = 'aspect-[4/3]',
  textoVista = 'Así se recorta en el inicio',
  mostrarVista = true,
}) {
  function alHacerClic(evento) {
    const caja = evento.currentTarget.getBoundingClientRect();
    onCambiar({
      focoX: Math.round(Math.min(100, Math.max(0, ((evento.clientX - caja.left) / caja.width) * 100))),
      focoY: Math.round(Math.min(100, Math.max(0, ((evento.clientY - caja.top) / caja.height) * 100))),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium text-slate-700">Encuadre</p>
        <p className="text-xs text-slate-500">
          Haz clic en la parte de la foto que debe verse siempre (por ejemplo, las caras).
        </p>
      </div>
      {/* El clic es un atajo de mouse; los deslizadores de abajo hacen lo mismo con teclado. */}
      <div onClick={alHacerClic} className="relative cursor-crosshair overflow-hidden rounded-xl bg-slate-100">
        <img src={src} alt="" draggable={false} className="block h-auto w-full select-none" />
        <span
          aria-hidden="true"
          style={{ left: `${focoX}%`, top: `${focoY}%` }}
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-amber shadow-[0_0_0_1px_rgb(15_23_42/0.5)]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Horizontal
          <input
            type="range"
            min="0"
            max="100"
            value={focoX}
            onChange={(e) => onCambiar({ focoX: Number(e.target.value), focoY })}
            className="accent-brand-blue"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Vertical
          <input
            type="range"
            min="0"
            max="100"
            value={focoY}
            onChange={(e) => onCambiar({ focoX, focoY: Number(e.target.value) })}
            className="accent-brand-blue"
          />
        </label>
      </div>
      {mostrarVista && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-600">{textoVista}</p>
          <img
            src={src}
            alt=""
            style={{ objectPosition: `${focoX}% ${focoY}%` }}
            className={`${proporcionVista} w-40 rounded-xl object-cover`}
          />
        </div>
      )}
    </div>
  );
}
