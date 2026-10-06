// components/layout/Navbar.jsx
// Topbar azul institucional (brand.blue): logo blanco, texto blanco y
// el boton "Agendar cita" en ambar (brand.amber, texto slate-900 --
// mismo color de texto que el boton equivalente del Hero). En la
// landing (unica pagina con Hero), brand.blue tambien es el primer
// stop del degradado del Hero (from-brand-blue-500), asi que el
// navbar solido se continua sin costura visible hacia el degradado de
// abajo.
//
// Topbar tipo pildora (solo en la landing), con 2 estados:
// - Estado 1 (scroll = 0): fondo transparente, sin borde, sin sombra y
//   sin blur. El Hero pasa por detras (-mt-24), asi que lo que se ve es
//   su propio degradado continuo: no hay un bloque "topbar" que delimitar.
//   Solo el contenido (enlaces, logo grande, botones) flota encima.
// - Estado 2: se despega 12px del borde, se angosta (maximo ~60rem,
//   centrado) y baja a 64px de alto, con las 4 esquinas en 32px (mitad
//   del alto = pildora real, mismo principio que rounded-boton), azul
//   profundo translucido con blur y sombra.
// El paso entre ambos es progresivo: `t` va de 0 a 1 en los primeros
// DISTANCIA_FLOW_PX de scroll y se aplica directo al estilo (via ref,
// dentro de requestAnimationFrame) sin re-renderizar React. El <header>
// mide siempre 96px (el Hero se mete por debajo con -mt-24) y es
// pointer-events-none: solo la pildora recibe clicks, asi el espacio
// transparente alrededor no bloquea el contenido que pasa por detras.
//
// Layout en 3 columnas (grid 1fr | auto | 1fr): enlaces de seccion a la
// izquierda, logo al centro y acciones a la derecha. Al ser las dos
// columnas laterales 1fr, el logo queda centrado respecto al ancho total
// de la barra aunque ambos grupos midan distinto. En la landing el logo
// arranca grande (logoblanco.png, el que antes estaba en el Hero) y con
// el scroll se cruza con el logo corto: ambos leen la variable CSS
// --flow (0..1) que escribe aplicarFlow, asi que no hay un segundo
// listener de scroll.
import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoCorto from '../../assets/logocorto.png';
import logoGrande from '../../assets/logoblanco.png';
import { useAuth, CLAVE_ALMACENAMIENTO } from '../../context/AuthContext';
import { rutaAgendarCita, rutaPanelPorRol } from '../../utils/rutas';
import { IconoCalendario, IconoCampana, IconoChevronAbajo } from '../icons';

const DISTANCIA_FLOW_PX = 160;
const ALTO_HEADER = 96;
const SEPARACION_SUPERIOR = 12;
const ALTO_PILDORA = 64;
// Mismo azul que el estado 2 con alfa 0: al interpolar, el color no pasa
// por tonos intermedios raros, solo va ganando opacidad.
const FONDO_ESTADO_1 = [6, 51, 138, 0]; // transparente: se ve el degradado del Hero
const FONDO_ESTADO_2 = [6, 51, 138, 0.75]; // brand-blue-800 (#06338A) al 75%

function interpolar(desde, hasta, t) {
  return desde + (hasta - desde) * t;
}

// Aplica el estado intermedio de la pildora para un progreso 0..1.
function aplicarFlow(elemento, t) {
  const [r, g, b, alfa] = FONDO_ESTADO_1.map((c, i) => interpolar(c, FONDO_ESTADO_2[i], t));
  const radio = t * (ALTO_PILDORA / 2);
  const estilo = elemento.style;
  estilo.setProperty('--flow', String(t));
  estilo.top = `${t * SEPARACION_SUPERIOR}px`;
  estilo.bottom = `${t * (ALTO_HEADER - SEPARACION_SUPERIOR - ALTO_PILDORA)}px`;
  // Margen lateral: al menos 16px y, en pantallas anchas, el necesario
  // para que la pildora no supere ~60rem de ancho.
  estilo.left = `calc(${t} * max(16px, (100% - 60rem) / 2))`;
  estilo.right = estilo.left;
  estilo.borderRadius = `${radio}px`;
  estilo.backgroundColor = `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${alfa.toFixed(3)})`;
  estilo.backdropFilter = `blur(${t * 20}px)`;
  estilo.webkitBackdropFilter = estilo.backdropFilter;
  estilo.boxShadow = `0 12px 32px -12px rgb(6 51 138 / ${(t * 0.5).toFixed(3)}), inset 0 0 0 1px rgb(255 255 255 / ${(t * 0.12).toFixed(3)})`;
}

export function Navbar() {
  const { estaAutenticado, usuario } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const enLanding = ubicacion.pathname === '/';
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esCliente = usuario?.rol === 'cliente';
  const barraRef = useRef(null);

  // useLayoutEffect: el estado 1 se aplica antes del primer pintado (sin
  // un frame del navbar viejo).
  useLayoutEffect(() => {
    const barra = barraRef.current;
    if (!enLanding || !barra) return undefined;
    let pendiente = null;
    const actualizar = () => {
      pendiente = null;
      aplicarFlow(barra, Math.min(window.scrollY / DISTANCIA_FLOW_PX, 1));
    };
    const alHacerScroll = () => {
      if (pendiente === null) pendiente = requestAnimationFrame(actualizar);
    };
    actualizar();
    window.addEventListener('scroll', alHacerScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', alHacerScroll);
      if (pendiente !== null) cancelAnimationFrame(pendiente);
      barra.removeAttribute('style');
    };
  }, [enLanding]);

  const iniciales = usuario?.nombreCompleto
    ?.split(' ')
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase();

  function irAAgendar() {
    navegar(rutaAgendarCita(estaAutenticado));
  }

  function salir() {
    // No se llama cerrarSesion() (dispara un re-render vía React state):
    // en /panel (protegido por ProtectedRoute) eso mostraba un flash de
    // /iniciar-sesion antes de que la recarga completa tuviera efecto.
    // Se limpia localStorage directamente y se recarga -- la pagina
    // nueva arranca ya sin sesion, sin pasar por ningun render intermedio.
    localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    window.location.href = '/';
  }

  return (
    <header className={enLanding ? 'pointer-events-none sticky top-0 z-40 h-24' : 'sticky top-0 z-40 h-20'}>
      <div ref={barraRef} className={`absolute inset-0 ${enLanding ? 'pointer-events-auto' : 'bg-brand-blue'}`}>
        <div className="mx-auto grid h-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6">
          {/* La columna izquierda siempre existe (aunque el nav se oculte en
              movil) para que el grid no corra el logo hacia la izquierda. */}
          <div className="justify-self-start">
            <nav className="hidden items-center gap-8 text-sm font-medium text-white/90 md:flex">
              {/* Link (no <a>) para que funcionen desde cualquier pagina, no
                  solo desde el landing: si el usuario esta en /panel, primero
                  navega a "/" y LandingPage.jsx hace scroll al hash una vez
                  montada (ver su useEffect sobre location.hash). */}
              <Link to="/#servicios" className="transition hover:text-white">Servicios</Link>
              <Link to="/#sedes" className="transition hover:text-white">Sedes</Link>
              <Link to="/#horarios" className="transition hover:text-white">Horarios</Link>
            </nav>
          </div>

          {/* Caja de tamano fijo (40px de alto, el del logo corto) con ambos
              logos absolutos y centrados: el logo grande se sale de la caja
              hacia arriba y abajo por igual, pero no agranda la fila. Si
              ocupara sus 72px en el flujo, la fila quedaria mas alta que la
              pildora (64px) y todo el contenido se veria corrido hacia abajo. */}
          <Link
            to="/"
            aria-label="Clínica Veterinaria UDES, ir al inicio"
            className={`relative flex items-center justify-center ${enLanding ? 'h-10 w-[108px]' : ''}`}
          >
            {enLanding ? (
              <>
                {/* Grande -> corto: el grande se apaga entre t=0 y t~0.7 y el
                    corto se enciende entre t~0.3 y t=1. Se solapan en el
                    tramo medio para que nunca quede la barra sin logo (en
                    t=0.5 ambos estan al 30%). Ambos centrados en el mismo
                    punto; solo cambia cual se ve y su escala. */}
                <img
                  src={logoGrande}
                  alt=""
                  className="absolute left-1/2 top-1/2 h-[72px] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                  style={{
                    opacity: 'calc(1 - var(--flow, 0) * 1.4)',
                    scale: 'calc(1 - var(--flow, 0) * 0.25)',
                  }}
                />
                <img
                  src={logoCorto}
                  alt=""
                  className="absolute left-1/2 top-1/2 h-10 w-auto -translate-x-1/2 -translate-y-1/2 object-contain"
                  style={{ opacity: 'calc(var(--flow, 0) * 1.4 - 0.4)' }}
                />
              </>
            ) : (
              <img src={logoCorto} alt="" className="h-12 w-auto object-contain" />
            )}
          </Link>

          <div className="flex items-center gap-3 justify-self-end">
            {estaAutenticado ? (
              <div className="hidden items-center gap-2 sm:flex">
                <button type="button" className="relative hidden rounded-boton p-2 lg:inline-flex text-white/80 transition hover:bg-white/10 hover:text-white">
                  <IconoCampana className="h-5 w-5" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuAbierto((v) => !v)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/10"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                      {iniciales || '·'}
                    </span>
                    <span className="text-left text-sm font-medium text-white">
                      {/* "Hola, " solo en el landing -- en /panel el Hero ya
                          saluda por su nombre, seria redundante repetirlo aqui. */}
                      {enLanding ? `Hola, ${usuario?.nombreCompleto?.split(' ')[0]}` : usuario?.nombreCompleto?.split(' ')[0]}
                    </span>
                    <IconoChevronAbajo className="h-4 w-4 text-white/70" />
                  </button>

                  {menuAbierto && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white py-1.5 shadow-lg ring-1 ring-slate-200">
                      {/* Atajos para volver al panel propio despues de
                          navegar a una seccion del landing (Servicios/Sedes/
                          Horarios) sin perder la sesion. */}
                      {esCliente ? (
                        <>
                          <Link
                            to="/panel?tab=citas"
                            onClick={() => setMenuAbierto(false)}
                            className="block px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50"
                          >
                            Mis citas
                          </Link>
                          <Link
                            to="/panel?tab=mascotas"
                            onClick={() => setMenuAbierto(false)}
                            className="block px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50"
                          >
                            Mis mascotas
                          </Link>
                        </>
                      ) : (
                        <Link
                          to={rutaPanelPorRol(usuario?.rol)}
                          onClick={() => setMenuAbierto(false)}
                          className="block px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50"
                        >
                          Ir al panel
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={salir}
                        className="w-full border-t border-slate-100 px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden items-center gap-1 md:flex">
                <Link
                  to="/iniciar-sesion"
                  className="rounded-boton px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registrarse"
                  className="hidden rounded-boton px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 lg:inline-block"
                >
                  Registrarse
                </Link>
              </div>
            )}
            <button
              type="button"
              onClick={irAAgendar}
              aria-label="Agendar cita"
              className="inline-flex items-center gap-2 rounded-boton bg-brand-amber px-3 py-2 sm:px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:brightness-95 active:scale-[0.98]"
            >
              <IconoCalendario className="h-4 w-4" />
              <span className="hidden sm:inline">Agendar cita</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
