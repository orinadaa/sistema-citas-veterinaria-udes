// components/landing/FondoAmbientalHero.jsx
// Halos del Hero, mismo lenguaje que FondoAmbientalServicios. La base no
// va aca: Hero y Servicios comparten un solo degradado continuo
// (brand-blue-500 arriba -> brand-blue-800 al final de Servicios) en el
// contenedor que los envuelve (LandingPage.jsx). Estos halos se extienden
// por debajo del borde inferior del Hero (-bottom-[30%]) para mezclarse
// con los de Servicios sin dejar un corte.
//
// La composicion cambia entre movil y desktop porque el Hero cambia: en
// movil el texto va arriba y la ilustracion abajo; desde lg el texto va a
// la izquierda y la ilustracion a la derecha.
//   1. Halo brand-blue-400 detras de la ilustracion, con la misma deriva
//      lenta que el halo central de Servicios.
//   2. Profundidad brand-blue-800 detras del titulo, el parrafo y los
//      botones: el fondo arranca en el azul claro de marca y sin esta capa
//      el texto blanco no llegaria a contraste AA.
//   3. Ambar brand-amber detras de la base de la ilustracion y en la
//      esquina superior derecha (solo desde lg, lejos del texto).
//   4. Halo brand-blue-400 abajo a la derecha, cruzando hacia Servicios
//      (a la derecha para no aclarar el encabezado de Servicios, que va a
//      la izquierda).
//   + Onda organica difuminada (solo desde md).
const color = (token, porcentaje) => `color-mix(in oklab, var(--color-${token}) ${porcentaje}%, transparent)`;

const MOVIL = {
  ilustracion: `radial-gradient(ellipse 70% 30% at 50% 66%, ${color('brand-blue-400', 75)} 0%, ${color('brand-blue-400', 35)} 40%, transparent 72%)`,
  resto: [
    `radial-gradient(ellipse 110% 34% at 35% 26%, ${color('brand-blue-800', 85)} 0%, ${color('brand-blue-800', 55)} 50%, transparent 80%)`,
    `radial-gradient(ellipse 45% 18% at 100% 72%, ${color('brand-amber', 70)} 0%, transparent 72%)`,
  ].join(', '),
};

const DESKTOP = {
  ilustracion: `radial-gradient(ellipse 42% 48% at 74% 45%, ${color('brand-blue-400', 85)} 0%, ${color('brand-blue-400', 40)} 40%, transparent 72%)`,
  resto: [
    `radial-gradient(ellipse 50% 55% at 22% 50%, ${color('brand-blue-800', 85)} 0%, ${color('brand-blue-800', 50)} 45%, transparent 78%)`,
    `radial-gradient(ellipse 30% 32% at 86% 80%, ${color('brand-amber', 80)} 0%, ${color('brand-amber', 35)} 40%, transparent 72%)`,
    `radial-gradient(ellipse 26% 26% at 100% 8%, ${color('brand-amber-400', 55)} 0%, transparent 72%)`,
    `radial-gradient(ellipse 40% 30% at 100% 96%, ${color('brand-blue-400', 70)} 0%, transparent 72%)`,
  ].join(', '),
};

export function FondoAmbientalHero() {
  return (
    // mask-image: la capa se desvanece en su tramo final (la parte que se
    // extiende sobre Servicios); sin esto los halos que llegan al borde
    // inferior de la capa se cortaban en seco y se veia una franja.
    <div
      className="pointer-events-none absolute inset-x-0 top-0 -bottom-[30%] -z-10 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]"
      aria-hidden="true"
    >
      {/* Movil y tablet (texto arriba, ilustracion abajo). */}
      <div className="absolute inset-0 lg:hidden">
        <div className="absolute inset-0 animate-halo-deriva motion-reduce:animate-none" style={{ backgroundImage: MOVIL.ilustracion }} />
        <div className="absolute inset-0" style={{ backgroundImage: MOVIL.resto }} />
      </div>

      {/* Desktop (texto a la izquierda, ilustracion a la derecha). */}
      <div className="absolute inset-0 hidden lg:block">
        <div className="absolute inset-0 animate-halo-deriva motion-reduce:animate-none" style={{ backgroundImage: DESKTOP.ilustracion }} />
        <svg className="absolute inset-0 h-full w-full blur-2xl" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <path
            d="M-80 520 C 260 380, 600 640, 940 500 S 1360 300, 1560 420 L 1560 1000 L -80 1000 Z"
            style={{ fill: color('brand-blue-400', 22) }}
          />
        </svg>
        <div className="absolute inset-0" style={{ backgroundImage: DESKTOP.resto }} />
      </div>
    </div>
  );
}
