// components/layout/Navbar.jsx
// Topbar azul institucional (brand.blue): logo blanco, texto blanco y
// el boton "Agendar cita" en ambar (brand.amber, texto slate-900 --
// mismo color de texto que el boton equivalente del Hero). En la
// landing (unica pagina con Hero), brand.blue tambien es el primer
// stop del degradado del Hero (from-brand-blue-500), asi que el
// navbar solido se continua sin costura visible hacia el degradado de
// abajo.
//
// "Flow bar" (solo en la landing): al hacer scroll, la barra se separa
// de los bordes y queda como una pildora flotante en azul profundo
// translucido con blur. El cambio es progresivo: `progreso` va de 0 a 1
// en los primeros DISTANCIA_FLOW_PX de scroll y se aplica directo al
// estilo del elemento (via ref, dentro de requestAnimationFrame) para no
// re-renderizar React en cada evento de scroll. El <header> conserva
// siempre su alto de 80px y la pildora es absoluta dentro de el: el
// contenido de la pagina nunca se desplaza al cambiar de estado.
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoCorto from '../../assets/logocorto.png';
import { useAuth, CLAVE_ALMACENAMIENTO } from '../../context/AuthContext';
import { rutaAgendarCita, rutaPanelPorRol } from '../../utils/rutas';
import { IconoCalendario, IconoCampana, IconoChevronAbajo } from '../icons';

const DISTANCIA_FLOW_PX = 160;
const AZUL_MARCA = [66, 128, 247]; // brand-blue (#4280F7), igual al Hero
const AZUL_PROFUNDO = [6, 51, 138]; // brand-blue-800 (#06338A)
const OPACIDAD_FLOTANTE = 0.75;

function interpolar(desde, hasta, t) {
  return desde + (hasta - desde) * t;
}

// Aplica el estado intermedio de la pildora para un progreso 0..1.
function aplicarFlow(elemento, t) {
  const [r, g, b] = AZUL_MARCA.map((c, i) => Math.round(interpolar(c, AZUL_PROFUNDO[i], t)));
  const alfa = interpolar(1, OPACIDAD_FLOTANTE, t);
  const estilo = elemento.style;
  estilo.top = `${t * 10}px`;
  estilo.bottom = `${t * 10}px`;
  // Margen lateral: al menos 12px y, en pantallas anchas, el necesario
  // para que la pildora no supere ~76rem (alineada con el contenido).
  estilo.left = `calc(${t} * max(12px, (100% - 76rem) / 2))`;
  estilo.right = estilo.left;
  estilo.borderRadius = `${t * 16}px`;
  estilo.backgroundColor = `rgb(${r} ${g} ${b} / ${alfa})`;
  estilo.backdropFilter = `blur(${t * 20}px)`;
  estilo.webkitBackdropFilter = estilo.backdropFilter;
  estilo.boxShadow = `0 10px 30px -10px rgb(6 51 138 / ${t * 0.45})`;
}

export function Navbar() {
  const { estaAutenticado, usuario } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const enLanding = ubicacion.pathname === '/';
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esCliente = usuario?.rol === 'cliente';
  const barraRef = useRef(null);

  useEffect(() => {
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
    <header className="sticky top-0 z-40 h-20">
      <div ref={barraRef} className="absolute inset-0 bg-brand-blue">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoCorto} alt="Clínica Veterinaria UDES" className="h-12 w-auto object-contain" />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-white/90 md:flex">
            {/* Link (no <a>) para que funcionen desde cualquier pagina, no
                solo desde el landing: si el usuario esta en /panel, primero
                navega a "/" y LandingPage.jsx hace scroll al hash una vez
                montada (ver su useEffect sobre location.hash). */}
            <Link to="/#servicios" className="transition hover:text-white">Servicios</Link>
            <Link to="/#sedes" className="transition hover:text-white">Sedes</Link>
            <Link to="/#horarios" className="transition hover:text-white">Horarios</Link>
          </nav>

          <div className="flex items-center gap-3">
            {estaAutenticado ? (
              <div className="hidden items-center gap-2 sm:flex">
                <button type="button" className="relative rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white">
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
              <div className="hidden items-center gap-1 sm:flex">
                <Link
                  to="/iniciar-sesion"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registrarse"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Registrarse
                </Link>
              </div>
            )}
            <button
              type="button"
              onClick={irAAgendar}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-amber px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:brightness-95 active:scale-[0.98]"
            >
              <IconoCalendario className="h-4 w-4" />
              Agendar cita
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
