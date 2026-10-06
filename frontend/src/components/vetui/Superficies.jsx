// components/vetui/Superficies.jsx
// Las tres capas de material de vetUI como componentes.
//
// FondoVetui: fondo de página. Degradado de marca (brand-blue-600 arriba,
// azul profundo desde ~32rem; arranca un tono más hondo que el Hero del
// landing porque las pantallas de la app tienen texto chico arriba y sobre
// brand-blue-500 no llega a AA) y halos de luz fijos (no se
// desplazan con el scroll), que son lo que el vidrio deja ver difuminado.
// Envuelve la página completa, incluida la topbar (transparente arriba).
//
// Superficie: vidrio. Contenedor sobre el fondo (secciones, resúmenes).
// Texto blanco; adentro van tarjetas de cristal y controles.
//
// Tarjeta: cristal. Contenido u objeto (mascota, cita, sede, horario).
// Texto oscuro. `tono` celeste/crema, `seleccionada` (anillo ámbar +
// check) e `interactiva` (hover que ilumina) para opciones elegibles.
import { IconoCheck } from '../icons';

const color = (token, porcentaje) => `color-mix(in oklab, var(--color-${token}) ${porcentaje}%, transparent)`;

const HALOS = [
  `radial-gradient(ellipse 45% 40% at 85% 12%, ${color('brand-blue-400', 45)} 0%, transparent 70%)`,
  `radial-gradient(ellipse 40% 45% at 8% 55%, ${color('brand-blue-500', 55)} 0%, transparent 72%)`,
  `radial-gradient(ellipse 30% 30% at 0% 85%, ${color('brand-amber', 45)} 0%, transparent 72%)`,
  `radial-gradient(ellipse 34% 30% at 100% 95%, ${color('brand-amber', 55)} 0%, ${color('brand-amber', 20)} 45%, transparent 72%)`,
  `radial-gradient(ellipse 30% 25% at 70% 60%, ${color('brand-blue-600', 50)} 0%, transparent 72%)`,
].join(', ');

export function FondoVetui({ children, className = '' }) {
  return (
    // isolate: los halos (-z-10) quedan detrás del contenido pero dentro
    // de la página. overflow-clip (no hidden): recorta sin crear un
    // contenedor de scroll, así la topbar sticky sigue funcionando.
    <div
      className={`relative isolate min-h-screen overflow-clip bg-[linear-gradient(to_bottom,var(--color-brand-blue-600)_0,var(--color-brand-blue-700)_16rem,var(--color-brand-blue-800)_32rem)] ${className}`}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -inset-[10%] animate-halo-deriva motion-reduce:animate-none"
          style={{ backgroundImage: HALOS }}
        />
      </div>
      {children}
    </div>
  );
}

export function Superficie({ as: Componente = 'section', className = '', children, ...resto }) {
  return (
    <Componente className={`vidrio rounded-superficie p-5 sm:p-6 ${className}`} {...resto}>
      {children}
    </Componente>
  );
}

const TONOS = { blanco: '', celeste: 'cristal-celeste', crema: 'cristal-crema' };

export function Tarjeta({
  as: Componente = 'div',
  tono = 'blanco',
  seleccionada = false,
  interactiva = false,
  className = '',
  children,
  ...resto
}) {
  return (
    <Componente
      className={`cristal relative rounded-tarjeta ${TONOS[tono] ?? ''} ${seleccionada ? 'cristal-seleccionado' : ''} ${
        interactiva ? 'hover-ilumina-claro cursor-pointer text-left outline-none focus-visible:ring-4 focus-visible:ring-white/60' : ''
      } ${className}`}
      {...resto}
    >
      {seleccionada && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-amber text-slate-900">
          <IconoCheck className="h-3.5 w-3.5" />
        </span>
      )}
      {children}
    </Componente>
  );
}
