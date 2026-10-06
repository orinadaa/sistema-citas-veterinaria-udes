// components/landing/FondoAmbientalServicios.jsx
// Fondo de la seccion "Servicios veterinarios": iluminacion ambiental en
// capas sobre el degradado base continuo Hero + Servicios (LandingPage.jsx,
// termina en brand-blue-800 al final de esta seccion), solo con los
// tokens de marca. Va detras de todo (absolute, aria-hidden, sin
// interaccion) y no toca el slider, que mantiene su propio overlay.
//
// Capas, de atras hacia adelante:
//   1. Base: el degradado continuo del contenedor (no va aca).
//   2. Halo central brand-blue-500 a pleno, el mas luminoso; deriva muy
//      lento (32s ida y vuelta) y se detiene con prefers-reduced-motion.
//   + Formas organicas: dos ondas grandes difuminadas (solo desde md).
//   3. Halos azules secundarios: inferior izquierdo brand-blue-400 y
//      lateral derecho brand-blue-600.
//   4. Halos ambar en brand-amber (el color del boton "Agendar cita"):
//      abajo a la derecha (el mas fuerte), lateral izquierdo a media
//      altura, abajo al centro y lateral derecho (este solo desde md). Lejos del encabezado,
//      que queda arriba a la izquierda.
//   (La profundidad detras del encabezado va pegada al encabezado, en
//   Servicios.jsx, para que lo siga en cualquier ancho.)
// El contenedor se extiende hacia arriba (-top-[20%]) para que estos halos
// se mezclen con los del Hero sin un corte en el borde entre secciones.
// Todos los halos se mezclan con color-mix(in oklab) y llegan a
// transparente en el 70-75% de su radio: no se ven bordes duros.
const color = (token, porcentaje) => `color-mix(in oklab, var(--color-${token}) ${porcentaje}%, transparent)`;

const HALO_CENTRAL = `radial-gradient(ellipse 65% 55% at 50% 50%, ${color('brand-blue-500', 100)} 0%, ${color('brand-blue-500', 60)} 40%, transparent 75%)`;

const HALOS_AZULES = [
  `radial-gradient(ellipse 55% 50% at 4% 100%, ${color('brand-blue-400', 80)} 0%, transparent 72%)`,
  `radial-gradient(ellipse 40% 55% at 100% 55%, ${color('brand-blue-600', 85)} 0%, transparent 72%)`,
].join(', ');

// brand-amber (#F7A71C) es el mismo color del boton "Agendar cita".
const HALOS_AMBAR = [
  `radial-gradient(ellipse 45% 42% at 100% 100%, ${color('brand-amber', 95)} 0%, ${color('brand-amber', 45)} 40%, transparent 72%)`,
  `radial-gradient(ellipse 30% 40% at 0% 62%, ${color('brand-amber', 85)} 0%, ${color('brand-amber', 35)} 40%, transparent 72%)`,
  `radial-gradient(ellipse 38% 26% at 50% 106%, ${color('brand-amber', 80)} 0%, transparent 72%)`,
].join(', ');

// Lateral derecho a media altura: solo desde md. En movil queda junto al
// final de las lineas del subtitulo y lo agrisa.
const AMBAR_LATERAL_DERECHO = `radial-gradient(ellipse 22% 30% at 100% 42%, ${color('brand-amber-400', 55)} 0%, transparent 72%)`;


export function FondoAmbientalServicios() {
  return (
    // mask-image: la capa aparece de a poco en su tramo superior (la parte
    // que se extiende sobre el Hero), sin un borde recto visible.
    <div
      className="pointer-events-none absolute inset-x-0 -top-[20%] bottom-0 -z-10 [mask-image:linear-gradient(to_bottom,transparent_0%,black_22%)]"
      aria-hidden="true"
    >
      {/* 2. Halo central (mas grande que la seccion para que la deriva no
          deje ver sus bordes). */}
      <div
        className="absolute -inset-[10%] animate-halo-deriva motion-reduce:animate-none"
        style={{ backgroundImage: HALO_CENTRAL }}
      />

      {/* Formas organicas: ondas grandes y difuminadas. */}
      <svg
        className="absolute inset-0 hidden h-full w-full blur-2xl md:block"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <path
          d="M-80 620 C 240 470, 520 760, 860 600 S 1380 380, 1560 520 L 1560 1000 L -80 1000 Z"
          style={{ fill: color('brand-blue-400', 30) }}
        />
        <path
          d="M-80 180 C 300 60, 560 320, 900 220 S 1320 40, 1560 140 L 1560 -100 L -80 -100 Z"
          style={{ fill: color('brand-blue-500', 22) }}
        />
      </svg>

      {/* 3. Azules secundarios. */}
      <div className="absolute inset-0" style={{ backgroundImage: HALOS_AZULES }} />

      {/* 4. Ambar. */}
      <div className="absolute inset-0" style={{ backgroundImage: HALOS_AMBAR }} />
      <div className="absolute inset-0 hidden md:block" style={{ backgroundImage: AMBAR_LATERAL_DERECHO }} />

    </div>
  );
}
