// components/landing/FondoAmbientalServicios.jsx
// Fondo de la seccion "Servicios veterinarios": iluminacion ambiental en
// capas sobre brand-blue-800 (la base la pone la <section>), solo con los
// tokens de marca. Va detras de todo (absolute, aria-hidden, sin
// interaccion) y no toca el slider, que mantiene su propio overlay.
//
// Capas, de atras hacia adelante:
//   1. Base brand-blue-800 (en la <section>).
//   2. Halo central brand-blue-500, el mas luminoso; deriva muy lento
//      (32s ida y vuelta) y se detiene con prefers-reduced-motion.
//   3. Halo inferior izquierdo brand-blue-600, mas sutil.
//   4. Halo superior derecho brand-blue-400, casi imperceptible.
//   5. Profundidad: oscurece arriba a la izquierda, detras del titulo y
//      el subtitulo, para reforzar su contraste.
//   6. Acento ambar puntual abajo a la derecha, opacidad muy baja (solo
//      desde md: en movil no aporta y quedaria junto al texto).
//   + Formas organicas: dos ondas grandes muy difuminadas (solo desde md).
// Todos los halos se mezclan con color-mix(in oklab) y llegan a
// transparente en el 70-75% de su radio: no se ven bordes ni "manchas".
const color = (token, porcentaje) => `color-mix(in oklab, var(--color-${token}) ${porcentaje}%, transparent)`;

const HALO_CENTRAL = `radial-gradient(ellipse 55% 45% at 50% 42%, ${color('brand-blue-500', 50)} 0%, ${color('brand-blue-500', 18)} 40%, transparent 72%)`;

const HALOS_SECUNDARIOS = [
  // 5. Profundidad detras del encabezado (arriba).
  `radial-gradient(ellipse 50% 32% at 15% 6%, ${color('brand-blue-800', 85)} 0%, transparent 75%)`,
  `linear-gradient(to bottom, ${color('brand-blue-800', 55)} 0%, transparent 30%)`,
  // 3. Inferior izquierdo.
  `radial-gradient(ellipse 50% 45% at 6% 100%, ${color('brand-blue-600', 40)} 0%, transparent 70%)`,
  // 4. Superior derecho, casi imperceptible.
  `radial-gradient(ellipse 40% 35% at 100% 0%, ${color('brand-blue-400', 16)} 0%, transparent 70%)`,
].join(', ');

const ACENTO_AMBAR = `radial-gradient(ellipse 22% 20% at 97% 94%, ${color('brand-amber-400', 14)} 0%, transparent 70%)`;

export function FondoAmbientalServicios() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* 2. Halo central (mas grande que la seccion para que la deriva no
          deje ver sus bordes). */}
      <div
        className="absolute -inset-[10%] animate-halo-deriva motion-reduce:animate-none"
        style={{ backgroundImage: HALO_CENTRAL }}
      />

      {/* Formas organicas: ondas grandes y muy difuminadas. */}
      <svg
        className="absolute inset-0 hidden h-full w-full opacity-60 blur-2xl md:block"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <path
          d="M-80 620 C 240 470, 520 760, 860 600 S 1380 380, 1560 520 L 1560 1000 L -80 1000 Z"
          style={{ fill: color('brand-blue-400', 9) }}
        />
        <path
          d="M-80 180 C 300 60, 560 320, 900 220 S 1320 40, 1560 140 L 1560 -100 L -80 -100 Z"
          style={{ fill: color('brand-blue-500', 7) }}
        />
      </svg>

      {/* 3, 4 y 5. */}
      <div className="absolute inset-0" style={{ backgroundImage: HALOS_SECUNDARIOS }} />

      {/* 6. Acento ambar. */}
      <div className="absolute inset-0 hidden md:block" style={{ backgroundImage: ACENTO_AMBAR }} />
    </div>
  );
}
