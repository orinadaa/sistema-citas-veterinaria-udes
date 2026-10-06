// components/landing/HalosAmbientales.jsx
// Halos de Sedes, Horarios y la banda de cierre, mismo lenguaje que
// FondoAmbientalHero/FondoAmbientalServicios. La base es el degradado
// continuo del landing (LandingPage.jsx); aca solo van los halos.
// La capa se extiende un 15% por encima y por debajo de la seccion para
// mezclarse con las vecinas, con mask-image en esos tramos (sin bordes
// rectos). Los halos van lejos de la esquina superior izquierda, donde
// esta el encabezado de cada seccion.
const color = (token, porcentaje) => `color-mix(in oklab, var(--color-${token}) ${porcentaje}%, transparent)`;

const VARIANTES = {
  sedes: [
    `radial-gradient(ellipse 40% 35% at 88% 35%, ${color('brand-blue-500', 70)} 0%, transparent 72%)`,
    `radial-gradient(ellipse 28% 30% at 0% 75%, ${color('brand-amber', 60)} 0%, ${color('brand-amber', 25)} 40%, transparent 72%)`,
    `radial-gradient(ellipse 45% 30% at 35% 100%, ${color('brand-blue-400', 50)} 0%, transparent 72%)`,
  ],
  horarios: [
    `radial-gradient(ellipse 40% 40% at 12% 80%, ${color('brand-blue-500', 65)} 0%, transparent 72%)`,
    `radial-gradient(ellipse 30% 35% at 100% 40%, ${color('brand-amber', 60)} 0%, ${color('brand-amber', 25)} 40%, transparent 72%)`,
    `radial-gradient(ellipse 35% 25% at 65% 100%, ${color('brand-amber-400', 40)} 0%, transparent 72%)`,
  ],
};

export function HalosAmbientales({ variante }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 -top-[15%] -bottom-[15%] -z-10 [mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]"
      aria-hidden="true"
      style={{ backgroundImage: VARIANTES[variante].join(', ') }}
    />
  );
}
