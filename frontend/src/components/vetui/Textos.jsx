// components/vetui/Textos.jsx
// Encabezados de vetUI (escala tipográfica, Poppins):
//   EncabezadoPagina  antetítulo + h1 + descripción, sobre el fondo.
//                     `acciones` a la derecha, `imagen` decorativa.
//   TituloSeccion     h2 de una Superficie (vidrio), con número de paso
//                     opcional.
// Sobre fondo oscuro el texto es blanco (títulos) y blue-50/blue-100
// (cuerpo): ambos en AA sobre vidrio y fondo.
export function EncabezadoPagina({ antetitulo, titulo, descripcion, acciones, imagen, className = '' }) {
  return (
    // lg:min-h-[17.25rem] (276px): con los 96px de la topbar, el contenido
    // que sigue empieza al menos a 372px. Es lo que necesita el scroll en dos
    // posiciones (useAnclaTopbar): la pildora termina de formarse a los 260px
    // de scroll, y a esa altura el contenido tiene que quedar debajo de ella
    // (112px), no detras.
    <header className={`mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:min-h-[17.25rem] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center ${className}`}>
      <div>
        {antetitulo && <p className="text-xs font-semibold uppercase tracking-wider text-blue-50">{antetitulo}</p>}
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">{titulo}</h1>
        {/* Blanco (no blue-50): arriba de la pagina hay halos claros y en movil
            blue-50 quedaba en 4.4:1. */}
        {descripcion && <p className="mt-2 max-w-xl text-white">{descripcion}</p>}
        {acciones && <div className="mt-5 flex flex-wrap gap-3">{acciones}</div>}
      </div>
      {imagen}
    </header>
  );
}

export function TituloSeccion({ numero, titulo, descripcion, accion, id }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {numero !== undefined && (
          <span className="vt-numero flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-blue-800">
            {numero}
          </span>
        )}
        <div>
          <h2 id={id} className="vt-titulo text-lg font-bold text-white sm:text-xl">
            {titulo}
          </h2>
          {descripcion && <p className="vt-subtitulo text-sm text-blue-100">{descripcion}</p>}
        </div>
      </div>
      {accion}
    </div>
  );
}
