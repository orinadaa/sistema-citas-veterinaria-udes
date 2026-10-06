// components/landing/TarjetaSlide.jsx
// Tarjeta de las secciones-slide del landing (Servicios, Sedes, Horarios)
// desde lg: fondo brand-blue-800 translucido con blur del fondo ambiental.
// Deja ver el fondo arriba y a los costados, pero por abajo llega hasta el
// borde de la seccion (sin margen ni esquinas inferiores redondeadas): da
// la impresion de una hoja que continua hacia la seccion siguiente, como
// cartas que se deslizan una sobre otra. Por eso tampoco lleva borde ni
// sombra abajo (solo arriba y a los costados).
// Sube deslizandose al entrar y se desvanece al salir (slide-card,
// index.css). Debajo de lg es un contenedor sin estilo.
//
// La seccion que la usa debe ser lg:flex lg:flex-col sin padding inferior
// desde lg: la tarjeta crece (flex-1) hasta el final de la seccion y
// centra su contenido verticalmente.
export function TarjetaSlide({ children }) {
  return (
    <div className="slide-card lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:rounded-t-[2rem] lg:border-x lg:border-t lg:border-white/10 lg:bg-brand-blue-800/50 lg:px-10 lg:py-10 lg:shadow-[0_-24px_60px_-30px_rgb(0_0_0/0.55)] lg:backdrop-blur-xl">
      {children}
    </div>
  );
}
