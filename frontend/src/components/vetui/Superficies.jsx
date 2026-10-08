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
// Superficie: contenedor sobre el fondo (secciones, resúmenes).
//   tono="vidrio" (por defecto) vidrio claro, texto blanco (landing).
//   tono="blanco"  vidrio blanco, texto oscuro (pantallas de la app: corta
//                  el azul del fondo). Lo de adentro se adapta solo.
//
// Tarjeta: objeto o contenido. Regla de material (como el landing):
//   material="vidrio"   tarjetas que van directo sobre el fondo (indicadores,
//                       citas, mascotas): el mismo vidrio de las tarjetas de
//                       seccion del landing, texto blanco, radio 28px.
//   material="blanco"   igual pero en vidrio blanco (texto oscuro): las
//                       tarjetas de Mis citas / Mis mascotas.
//   material="cristal"  (por defecto) tarjetas DENTRO de una superficie de
//                       vidrio (opciones de agendar, sedes): texto oscuro,
//                       como las tarjetas de sedes/horarios del landing. `tono` celeste/crema, `seleccionada` (anillo ámbar +
// check) e `interactiva` (hover que ilumina) para opciones elegibles;
// `destacada` (anillo ámbar sin check) para resaltar sin indicar elección.
import { IconoCheck } from '../icons';

const color = (token, porcentaje) => `color-mix(in oklab, var(--color-${token}) ${porcentaje}%, transparent)`;

const HALOS = [
  `radial-gradient(ellipse 45% 40% at 85% 12%, ${color('brand-blue-400', 45)} 0%, transparent 70%)`,
  `radial-gradient(ellipse 40% 45% at 8% 55%, ${color('brand-blue-500', 55)} 0%, transparent 72%)`,
  `radial-gradient(ellipse 30% 30% at 0% 85%, ${color('brand-amber', 45)} 0%, transparent 72%)`,
  `radial-gradient(ellipse 34% 30% at 100% 95%, ${color('brand-amber', 55)} 0%, ${color('brand-amber', 20)} 45%, transparent 72%)`,
  `radial-gradient(ellipse 30% 25% at 70% 60%, ${color('brand-blue-600', 50)} 0%, transparent 72%)`,
].join(', ');

// Fondo del panel administrativo y del medico (pedido de Oriana): el azul
// del Hero del landing (brand-blue-500 -> brand-blue-800) con mas toques
// ambar y manchas de azul oscuro. Ahi nada va directo sobre el fondo: todo
// vive en piezas de vidrio, que son las que garantizan el contraste.
const HALOS_PANEL = [
  `radial-gradient(ellipse 46% 42% at 94% 6%, ${color('brand-amber', 92)} 0%, ${color('brand-amber', 45)} 45%, transparent 76%)`,
  `radial-gradient(ellipse 46% 44% at 36% 100%, ${color('brand-amber', 95)} 0%, ${color('brand-amber', 48)} 45%, transparent 76%)`,
  `radial-gradient(ellipse 36% 34% at 84% 100%, ${color('brand-amber', 80)} 0%, ${color('brand-amber', 30)} 50%, transparent 76%)`,
  `radial-gradient(ellipse 30% 30% at 34% 0%, ${color('brand-amber', 65)} 0%, transparent 74%)`,
  `radial-gradient(ellipse 28% 30% at 52% 46%, ${color('brand-amber-400', 55)} 0%, transparent 72%)`,
  `radial-gradient(ellipse 22% 26% at 100% 58%, ${color('brand-amber', 70)} 0%, transparent 74%)`,
  `radial-gradient(ellipse 42% 40% at 6% 18%, ${color('brand-blue-800', 85)} 0%, transparent 72%)`,
  `radial-gradient(ellipse 40% 42% at 92% 70%, ${color('brand-navy', 85)} 0%, transparent 72%)`,
  `radial-gradient(ellipse 34% 32% at 70% 22%, ${color('brand-blue-400', 50)} 0%, transparent 72%)`,
].join(', ');

const DEGRADADO = 'bg-[linear-gradient(to_bottom,var(--color-brand-blue-600)_0,var(--color-brand-blue-700)_16rem,var(--color-brand-blue-800)_32rem)]';
const DEGRADADO_PANEL = 'bg-gradient-to-b from-brand-blue-500 to-brand-blue-800';

// variante="panel": el fondo del panel administrativo / medico.
export function FondoVetui({ children, className = '', variante = 'app' }) {
  const esPanel = variante === 'panel';
  return (
    // isolate: los halos (-z-10) quedan detrás del contenido pero dentro
    // de la página. overflow-clip (no hidden): recorta sin crear un
    // contenedor de scroll, así la topbar sticky sigue funcionando.
    <div
      className={`relative isolate min-h-screen overflow-clip ${esPanel ? DEGRADADO_PANEL : DEGRADADO} ${className}`}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -inset-[10%] animate-halo-deriva motion-reduce:animate-none"
          style={{ backgroundImage: esPanel ? HALOS_PANEL : HALOS }}
        />
      </div>
      {children}
    </div>
  );
}

export function Superficie({ as: Componente = 'section', tono = 'vidrio', className = '', children, ...resto }) {
  return (
    <Componente className={`${tono === 'blanco' ? 'vidrio-blanco' : 'vidrio'} rounded-superficie p-5 sm:p-6 ${className}`} {...resto}>
      {children}
    </Componente>
  );
}

const TONOS = { blanco: '', celeste: 'cristal-celeste', crema: 'cristal-crema' };

function clasesMaterial({ material, tono, seleccionada, destacada }) {
  if (material === 'blanco') {
    return `vidrio-blanco rounded-superficie ${seleccionada || destacada ? 'vidrio-blanco-destacado' : ''}`;
  }
  if (material === 'vidrio') {
    return `vidrio rounded-superficie ${seleccionada || destacada ? 'vidrio-destacado' : ''}`;
  }
  return `cristal rounded-tarjeta ${TONOS[tono] ?? ''} ${
    seleccionada ? 'cristal-seleccionado' : destacada ? 'cristal-destacado' : ''
  }`;
}

export function Tarjeta({
  as: Componente = 'div',
  material = 'cristal',
  tono = 'blanco',
  seleccionada = false,
  destacada = false,
  interactiva = false,
  className = '',
  children,
  ...resto
}) {
  return (
    <Componente
      className={`relative ${clasesMaterial({ material, tono, seleccionada, destacada })} ${
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
