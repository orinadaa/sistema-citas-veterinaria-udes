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
// - Estado 2: se despega 12px del borde, se angosta (maximo ~68rem,
//   centrado) y baja a 64px de alto, azul profundo translucido con blur
//   y sombra. Radio fijo de 32px en todo el recorrido (= mitad del alto
//   final, asi que al llegar es una capsula exacta).
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
import logoCortoBlanco from '../../assets/logocortoblanco.png';
import { useAuth, CLAVE_ALMACENAMIENTO } from '../../context/AuthContext';
import { rutaAgendarCita, rutaPanelPorRol } from '../../utils/rutas';
import { IconoCalendario, IconoCampana, IconoChevronAbajo } from '../icons';

// 260px de scroll para toda la transicion: con 160px una sola vuelta de
// la rueda del mouse (~100px) se comia mas de media transicion de golpe.
const DISTANCIA_FLOW_PX = 260;
// Constante de tiempo del suavizado: la barra persigue al scroll y en
// ~110ms recorre ~63% de lo que le falta, en vez de saltar al valor nuevo.
const SUAVIZADO_MS = 110;

// Curva ease-in-out (smoothstep): la transicion arranca y termina suave
// en vez de avanzar a velocidad constante.
function suavizarCurva(v) {
  return v * v * (3 - 2 * v);
}
const ALTO_HEADER = 96;
const SEPARACION_SUPERIOR = 12;
const ALTO_PILDORA = 64;
const RADIO_PILDORA = 32;
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
  const estilo = elemento.style;
  estilo.setProperty('--flow', String(t));
  estilo.top = `${t * SEPARACION_SUPERIOR}px`;
  estilo.bottom = `${t * (ALTO_HEADER - SEPARACION_SUPERIOR - ALTO_PILDORA)}px`;
  // Margen lateral: al menos 16px y, en pantallas anchas, el necesario
  // para que la pildora no supere ~68rem de ancho (lo minimo para que
  // ambos grupos + logo quepan con el texto en 16px sin descentrar el logo).
  estilo.left = `calc(${t} * max(16px, (100% - 68rem) / 2))`;
  estilo.right = estilo.left;
  // Radio fijo de 32px en todo el recorrido (decision de Oriana): no
  // cambia con el scroll. Al llegar a 64px de alto coincide con la mitad
  // del alto, asi que el estado final es una capsula exacta; durante la
  // transicion (barra mas alta) los extremos se ven un poco menos
  // redondos que un semicirculo.
  estilo.borderRadius = `${RADIO_PILDORA}px`;
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
  //
  // `objetivo` es el progreso que corresponde al scroll actual y `actual`
  // el que se esta mostrando: en cada frame `actual` se acerca a
  // `objetivo` (suavizado exponencial por tiempo, independiente de los
  // fps), asi los saltos de la rueda del mouse se ven como un movimiento
  // continuo. Con prefers-reduced-motion se aplica directo, sin suavizar.
  useLayoutEffect(() => {
    const barra = barraRef.current;
    if (!enLanding || !barra) return undefined;
    const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const progresoDelScroll = () => Math.min(window.scrollY / DISTANCIA_FLOW_PX, 1);
    let objetivo = progresoDelScroll();
    let actual = objetivo;
    let cuadro = null;
    let instanteAnterior = null;

    const pintar = () => aplicarFlow(barra, suavizarCurva(actual));
    const avanzar = (instante) => {
      const dt = instanteAnterior === null ? 16 : instante - instanteAnterior;
      instanteAnterior = instante;
      actual += (objetivo - actual) * (1 - Math.exp(-dt / SUAVIZADO_MS));
      if (Math.abs(objetivo - actual) < 0.001) actual = objetivo;
      pintar();
      if (actual === objetivo) {
        cuadro = null;
        instanteAnterior = null;
      } else {
        cuadro = requestAnimationFrame(avanzar);
      }
    };
    const alHacerScroll = () => {
      objetivo = progresoDelScroll();
      if (sinAnimacion) {
        actual = objetivo;
        pintar();
      } else if (cuadro === null) {
        cuadro = requestAnimationFrame(avanzar);
      }
    };

    pintar();
    window.addEventListener('scroll', alHacerScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', alHacerScroll);
      if (cuadro !== null) cancelAnimationFrame(cuadro);
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
        <div className="mx-auto grid h-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 whitespace-nowrap md:gap-x-10 lg:gap-x-12">
          {/* La columna izquierda siempre existe (aunque el nav se oculte en
              movil) para que el grid no corra el logo hacia la izquierda.
              Desde md los dos grupos se pegan al logo (justify-self hacia el
              centro) y los extremos de la barra quedan vacios a proposito:
              el contenido se lee agrupado alrededor del logo. */}
          <div className="justify-self-start md:justify-self-end">
            <nav className="hidden items-center gap-8 text-base font-medium text-white/90 md:flex">
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
            className={`relative flex items-center justify-center ${enLanding ? 'h-10 w-[126px]' : ''}`}
            // --viaje (0..1): avance del isotipo hacia el centro, compartido
            // por el logo grande y el isotipo blanco para que se muevan juntos.
            style={enLanding ? { '--viaje': 'clamp(0, (var(--flow, 0) - 0.1) / 0.6, 1)' } : undefined}
          >
            {enLanding ? (
              <>
                {/* Transicion en 3 pasos, todo derivado de --flow (0..1):
                    1. flow 0.1 -> 0.35: aparece el isotipo blanco
                       (logocortoblanco) encima del isotipo del logo grande
                       (72px de alto, 26px a la izquierda, 2px abajo: donde
                       calza la luna) y entre 0.1 y 0.7 viaja al centro
                       mientras baja a 40px.
                    2. El logo grande baja gradual de 100% a 25% mientras el
                       blanco viaja (0 -> 0.7): sigue perceptible hasta que el
                       blanco llega al centro. Ahi se apaga de 25% a 0%
                       (0.7 -> 0.78).
                    3. flow 0.75 -> 1: con el blanco ya centrado, encima
                       aparece el logo corto a color; como esta alineado al
                       pixel con el blanco, la luna se pinta de ambar. */}
                <img
                  src={logoGrande}
                  alt=""
                  className="absolute left-1/2 top-1/2 h-[84px] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                  style={{
                    // Se achica y se corre junto con el isotipo blanco: escala
                    // 1 -> 0.556 (72px -> 40px, mismo factor que el blanco) y
                    // como su luna esta 26px a la izquierda del centro, se
                    // desplaza 14.4px a la derecha (= 26 * (1 - 0.556)) para
                    // que la luna siga debajo del isotipo blanco todo el viaje.
                    transform:
                      'translate(calc(14.44px * var(--viaje)), calc(-1.11px * var(--viaje))) scale(calc(1 - 0.444 * var(--viaje)))',
                    // min() de dos rectas: 1 -> 0.25 entre 0 y 0.7, y
                    // 0.25 -> 0 entre 0.7 y 0.78 (se cruzan en 0.7).
                    opacity:
                      'clamp(0, min(1 - var(--flow, 0) * 0.75 / 0.7, (0.78 - var(--flow, 0)) / 0.08 * 0.25), 1)',
                  }}
                />
                <div
                  className="absolute left-1/2 top-1/2 h-10 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    transform:
                      'translate(calc(-26px * (1 - var(--viaje))), calc(2px * (1 - var(--viaje)))) scale(calc(1.8 - 0.8 * var(--viaje)))',
                  }}
                >
                  <img
                    src={logoCortoBlanco}
                    alt=""
                    className="h-10 w-auto max-w-none object-contain"
                    style={{ opacity: 'clamp(0, (var(--flow, 0) - 0.1) / 0.25, 1)' }}
                  />
                  <img
                    src={logoCorto}
                    alt=""
                    className="absolute inset-0 h-10 w-auto max-w-none object-contain"
                    style={{ opacity: 'clamp(0, (var(--flow, 0) - 0.75) / 0.25, 1)' }}
                  />
                </div>
              </>
            ) : (
              <img src={logoCorto} alt="" className="h-12 w-auto object-contain" />
            )}
          </Link>

          <div className="flex items-center gap-2 justify-self-end md:justify-self-start">
            {estaAutenticado ? (
              <div className="hidden items-center gap-2 sm:flex">
                <button type="button" className="relative hidden rounded-boton p-2 xl:inline-flex text-white/80 transition hover:bg-white/10 hover:text-white">
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
                    <span className="text-left text-base font-medium text-white">
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
                  className="rounded-boton px-3 py-2 text-base font-medium text-white transition hover:bg-white/10"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registrarse"
                  className="hidden rounded-boton px-3 py-2 text-base font-medium text-white transition hover:bg-white/10 xl:inline-block"
                >
                  Registrarse
                </Link>
              </div>
            )}
            <button
              type="button"
              onClick={irAAgendar}
              aria-label="Agendar cita"
              className="inline-flex items-center gap-2 rounded-boton bg-brand-amber px-3 py-2 sm:px-4 text-base font-semibold text-slate-900 shadow-sm transition hover:brightness-95 active:scale-[0.98]"
            >
              <IconoCalendario className="h-4 w-4" />
              {/* Texto desde lg: en tablet (md) el grupo derecho con el texto
                  no cabe en su columna y descentraria el logo. */}
              <span className="hidden lg:inline">Agendar cita</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
