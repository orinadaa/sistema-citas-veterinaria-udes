// components/landing/FondoAmbientalServicios.jsx
// Fondo de la seccion "Servicios veterinarios": iluminacion ambiental en
// capas sobre brand-blue-800 (la base la pone la <section>), solo con los
// tokens de marca. Va detras de todo (absolute, aria-hidden, sin
// interaccion) y no toca el slider, que mantiene su propio overlay.
//
// Capas, de atras hacia adelante:
//   1. Base brand-blue-800 (en la <section>).
//   2. Halo central brand-blue-500 a pleno, el mas luminoso; deriva muy
//      lento (32s ida y vuelta) y se detiene con prefers-reduced-motion.
//   + Formas organicas: dos ondas grandes difuminadas (solo desde md).
//   3. Halos azules secundarios: inferior izquierdo brand-blue-400 y
//      lateral derecho brand-blue-600.
//   4. Halos ambar: abajo a la derecha (el mas fuerte), lateral izquierdo
//      a media altura y uno chico abajo al centro. Lejos del encabezado,
//      que queda arriba a la izquierda.
//   5. Union con el Hero: brand-blue-800 opaco en el borde superior que se
//      desvanece hacia abajo. El Hero termina exactamente en ese color,
//      asi que no se ve linea entre las dos secciones; ademas oscurece
//      detras del titulo y el subtitulo, reforzando su contraste.
// Todos los halos se mezclan con color-mix(in oklab) y llegan a
// transparente en el 70-75% de su radio: no se ven bordes duros.
const color = (token, porcentaje) => `color-mix(in oklab, var(--color-${token}) ${porcentaje}%, transparent)`;

const HALO_CENTRAL = `radial-gradient(ellipse 65% 55% at 50% 50%, ${color('brand-blue-500', 100)} 0%, ${color('brand-blue-500', 60)} 40%, transparent 75%)`;

const HALOS_AZULES = [
  `radial-gradient(ellipse 55% 50% at 4% 100%, ${color('brand-blue-400', 80)} 0%, transparent 72%)`,
  `radial-gradient(ellipse 40% 55% at 100% 55%, ${color('brand-blue-600', 85)} 0%, transparent 72%)`,
].join(', ');

const HALOS_AMBAR = [
  `radial-gradient(ellipse 34% 32% at 98% 96%, ${color('brand-amber-400', 60)} 0%, transparent 72%)`,
  `radial-gradient(ellipse 22% 30% at 0% 60%, ${color('brand-amber-500', 45)} 0%, transparent 72%)`,
  `radial-gradient(ellipse 25% 18% at 50% 104%, ${color('brand-amber-400', 40)} 0%, transparent 72%)`,
].join(', ');

const UNION_CON_HERO = `linear-gradient(to bottom, var(--color-brand-blue-800) 0%, ${color('brand-blue-800', 85)} 8%, transparent 30%)`;

export function FondoAmbientalServicios() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
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

      {/* 5. Union con el Hero (va encima de todo lo anterior). */}
      <div className="absolute inset-0" style={{ backgroundImage: UNION_CON_HERO }} />
    </div>
  );
}
