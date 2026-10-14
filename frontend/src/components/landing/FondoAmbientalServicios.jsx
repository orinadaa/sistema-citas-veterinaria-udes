// components/landing/FondoAmbientalServicios.jsx
// Fondo de la seccion "Servicios veterinarios": iluminacion ambiental en capas
// sobre el degradado base continuo Hero + Servicios.
const color = (token, porcentaje) => `color-mix(in oklab, var(--color-${token}) ${porcentaje}%, transparent)`;

const HALO_CENTRAL = `radial-gradient(ellipse 65% 55% at 50% 50%, ${color('brand-blue-500', 45)} 0%, ${color('brand-blue-500', 20)} 40%, transparent 75%)`;

const HALOS_AZULES = [
  `radial-gradient(ellipse 55% 50% at 4% 100%, ${color('brand-blue-400', 55)} 0%, transparent 72%)`,
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
    // La capa se extiende sobre el Hero (-top-[20%]) y sobre Sedes
    // (-bottom-[15%]); mask-image la hace aparecer y desaparecer de a poco
    // en esos tramos, sin bordes rectos visibles en las uniones.
    <div
      className="pointer-events-none absolute inset-x-0 -top-[20%] -bottom-[15%] -z-10 [mask-image:linear-gradient(to_bottom,transparent_0%,black_20%,black_82%,transparent_100%)]"
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
