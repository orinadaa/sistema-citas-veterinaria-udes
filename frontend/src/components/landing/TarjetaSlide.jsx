// components/landing/TarjetaSlide.jsx
// Tarjeta de las secciones-slide del landing (Servicios, Sedes, Horarios)
// desde lg: mismo material que la pildora de la topbar (brand-blue-800 al
// 75%, blur de 20px, borde blanco al 12%; ver aplicarFlow en Navbar.jsx),
// para que topbar y tarjetas se lean como la misma familia de elementos
// flotantes.
// Deja ver el fondo arriba y a los costados, pero por abajo llega hasta el
// borde de la seccion (sin margen ni esquinas inferiores redondeadas): da
// la impresion de una hoja que continua hacia la seccion siguiente, como
// cartas que se deslizan una sobre otra. Por eso tampoco lleva borde ni
// sombra abajo (solo arriba y a los costados).
// Sube deslizandose al entrar y se desvanece al salir (slide-card,
// index.css). Debajo de lg es un contenedor sin estilo.
//
// La seccion que la usa debe ser lg:flex lg:flex-col sin padding inferior
// desde lg: la tarjeta crece (flex-1) hasta el final de la seccion. El
// contenido arranca siempre a la misma distancia del borde superior (no
// se centra): asi el espacio entre el borde y el titulo es igual en todas
// las secciones, aunque tengan distinta cantidad de contenido.
export function TarjetaSlide({ children }) {
  return (
    <div className="slide-card lg:flex lg:flex-1 lg:flex-col lg:rounded-t-[2rem] lg:border-x lg:border-t lg:border-white/12 lg:bg-brand-blue-800/75 lg:px-10 lg:py-10 lg:shadow-[0_-24px_60px_-30px_rgb(0_0_0/0.55)] lg:backdrop-blur-[20px]">
      {children}
    </div>
  );
}
