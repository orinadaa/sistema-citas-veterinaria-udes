// components/landing/TarjetaSlide.jsx
// Tarjeta de las secciones-slide del landing (Servicios, Sedes, Horarios)
// desde lg: el mismo vidrio claro que el boton "Conoce nuestros servicios"
// y que la pildora de la topbar en el landing (blanco al 12%, reflejo
// arriba, borde de luz al 35%, brillo de 1px, blur 12px + saturate 150%;
// ver boton-glass-claro en index.css), para que topbar, tarjetas y boton
// se lean como la misma familia de elementos flotantes de vidrio. Ademas
// oscurece un poco lo de atras (brightness 75%): el fondo de Servicios es
// muy luminoso y con el vidrio claro el titulo blanco no llegaba a AA.
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
    <div className="slide-card lg:flex lg:flex-1 lg:flex-col lg:rounded-t-[2rem] lg:border-x lg:border-t lg:border-white/35 lg:bg-white/12 lg:bg-[linear-gradient(to_bottom,rgb(255_255_255/0.18),transparent_30%)] lg:px-10 lg:py-10 lg:shadow-[0_-24px_60px_-30px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.45)] lg:backdrop-blur-[12px] lg:backdrop-saturate-150 lg:backdrop-brightness-[.75]">
      {children}
    </div>
  );
}
