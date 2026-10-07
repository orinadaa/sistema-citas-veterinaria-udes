// components/layout/Navbar.jsx
// Topbar publica (landing, /agendar y /panel del cliente): texto blanco
// y el boton "Agendar cita" en ambar (brand.amber, texto slate-900).
// Cada pagina que la usa empieza con un banner en degradado azul que
// pasa por detras de ella (-mt-24 pt-24): el Hero en la landing y el
// banner de encabezado en /agendar y /panel.
//
// Topbar tipo pildora, con 2 estados:
// - Estado 1 (scroll = 0): fondo transparente, sin borde, sin sombra y
//   sin blur. El banner pasa por detras (-mt-24), asi que lo que se ve es
//   su propio degradado continuo: no hay un bloque "topbar" que delimitar.
//   Solo el contenido (enlaces, logo grande, botones) flota encima.
// - Estado 2: se despega 12px del borde, se angosta (maximo ~68rem,
//   centrado) y baja a 64px de alto, azul profundo translucido con blur
//   y sombra. Radio fijo de 32px en todo el recorrido (= mitad del alto
//   final, asi que al llegar es una capsula exacta).
// El paso entre ambos es progresivo: `t` va de 0 a 1 en los primeros
// DISTANCIA_FLOW_PX de scroll y se aplica directo al estilo (via ref,
// dentro de requestAnimationFrame) sin re-renderizar React. El <header>
// mide siempre 96px (el banner se mete por debajo con -mt-24) y es
// pointer-events-none: solo la pildora recibe clicks, asi el espacio
// transparente alrededor no bloquea el contenido que pasa por detras.
//
// Layout en 3 columnas (grid 1fr | auto | 1fr): enlaces de seccion a la
// izquierda, logo al centro y acciones a la derecha. Al ser las dos
// columnas laterales 1fr, el logo queda centrado respecto al ancho total
// de la barra aunque ambos grupos midan distinto. El logo arranca
// grande (logoblanco.png, el que antes estaba en el Hero) y con
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
import { IconoCalendario, IconoCampana, IconoChevronAbajo, IconoSalir } from '../icons';

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
// Material de la pildora (estado 2). El borde y el brillo superior son gris
// claro (slate-300/200) tenue, no blanco, para que se disimulen. Arriba (estado 1) siempre es
// transparente: el color de partida es el mismo del final con alfa 0, asi
// al interpolar solo gana opacidad, sin tonos intermedios raros.
// - claro (landing): el mismo vidrio claro del boton "Conoce nuestros
//   servicios" (utilidad boton-glass-claro en index.css): blanco al 12%
//   con reflejo arriba, borde de luz y sombra. En el landing la pildora
//   siempre queda sobre el fondo azul.
// - azul (/agendar y /panel): brand-blue-800 al 50% con el backdrop
//   oscurecido. Ahi la pildora pasa sobre contenido blanco al bajar y el
//   vidrio claro dejaria el texto blanco ilegible (blanco sobre blanco).
const MATERIALES = {
  claro: {
    fondo: [255, 255, 255, 0.12],
    // brightness 78%: en el landing hay zonas de fondo muy luminosas (halo
    // central de Servicios) donde el blanco al 12% dejaba el texto blanco
    // por debajo de AA; se ve igual de claro pero sobre un fondo mas hondo.
    backdrop: (t) => `blur(${t * 12}px) saturate(${100 + t * 50}%) brightness(${100 - t * 22}%)`,
    reflejo: (t) => `linear-gradient(to bottom, rgb(255 255 255 / ${(t * 0.18).toFixed(3)}), rgb(255 255 255 / 0) 60%)`,
    sombra: (t) =>
      `0 10px 26px -10px rgb(0 0 0 / ${(t * 0.35).toFixed(3)}), inset 0 0 0 1px rgb(203 213 225 / ${(t * 0.25).toFixed(3)}), inset 0 1px 0 rgb(226 232 240 / ${(t * 0.3).toFixed(3)})`,
  },
  azul: {
    fondo: [6, 51, 138, 0.5],
    backdrop: (t) => `blur(${t * 24}px) saturate(${100 + t * 50}%) brightness(${100 - t * 35}%)`,
    reflejo: () => 'none',
    sombra: (t) =>
      `0 12px 32px -12px rgb(6 51 138 / ${(t * 0.5).toFixed(3)}), inset 0 0 0 1px rgb(203 213 225 / ${(t * 0.2).toFixed(3)}), inset 0 1px 0 rgb(226 232 240 / ${(t * 0.25).toFixed(3)})`,
  },
};

function interpolar(desde, hasta, t) {
  return desde + (hasta - desde) * t;
}

// Aplica el estado intermedio de la pildora para un progreso 0..1.
function aplicarFlow(elemento, t, material) {
  const [r, g, b] = material.fondo;
  const alfa = interpolar(0, material.fondo[3], t);
  const estilo = elemento.style;
  estilo.setProperty('--flow', String(t));
  // El mismo progreso se publica en <html> para que otros elementos de la
  // pagina se animen sincronizados con la topbar sin un segundo listener
  // de scroll (ej. el stepper de /agendar). data-topbar-decima (0..10) es
  // el progreso en decimas: permite, solo con CSS, sacar de la interaccion
  // y del arbol de accesibilidad lo que esta en opacidad 0 en cada tramo.
  const raiz = document.documentElement;
  raiz.style.setProperty('--flow', String(t));
  raiz.dataset.topbarDecima = String(Math.floor(t * 10));
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
  estilo.backgroundImage = material.reflejo(t);
  estilo.backdropFilter = material.backdrop(t);
  estilo.webkitBackdropFilter = estilo.backdropFilter;
  // Sombra exterior + borde de luz + brillo de 1px arriba (vidrio).
  estilo.boxShadow = material.sombra(t);
}

export function Navbar() {
  const { estaAutenticado, usuario } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const enLanding = ubicacion.pathname === '/';
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esCliente = usuario?.rol === 'cliente';
  const barraRef = useRef(null);
  const headerRef = useRef(null);
  const perfilRef = useRef(null);
  const menuRef = useRef(null);
  const nombrePerfilRef = useRef(null);
  const filaRef = useRef(null);
  const navRef = useRef(null);
  const grupoDerechoRef = useRef(null);
  const logoRef = useRef(null);

  // Equilibrio del logo grande (estado transparente, arriba de todo): el
  // logo esta en el centro exacto de la barra, pero como los enlaces de la
  // izquierda van agrupados en el medio de su mitad y el grupo derecho
  // llega hasta el logo, queda mas aire a su izquierda que a su derecha y
  // se percibe corrido. Se mide ese desbalance y el logo grande se corre a
  // la izquierda la mitad de la diferencia (--equilibrio), para quedar a
  // la misma distancia de "Horarios" que del grupo derecho. El corrimiento
  // se deshace con el viaje del isotipo (ver el <Link> del logo): con la
  // pildora formada el logo corto vuelve al centro exacto.
  useLayoutEffect(() => {
    const fila = filaRef.current;
    const logo = logoRef.current;
    if (!fila || !logo) return undefined;
    const medir = () => {
      // El <nav> ocupa toda su columna; lo que cuenta es su ultimo enlace.
      const nav = navRef.current?.lastElementChild?.getBoundingClientRect();
      const derecha = [...(grupoDerechoRef.current?.children ?? [])].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
      let equilibrio = 0;
      if (nav && nav.width > 0 && derecha.length > 0) {
        // El logo ocupa la columna central de la grilla: su caja (sin el
        // corrimiento) esta centrada en la fila.
        const caja = fila.getBoundingClientRect();
        const centro = caja.left + caja.width / 2;
        const mitadLogo = logo.offsetWidth / 2;
        const aireIzquierda = centro - mitadLogo - nav.right;
        const aireDerecha = Math.min(...derecha.map((r) => r.left)) - (centro + mitadLogo);
        equilibrio = Math.max(0, (aireIzquierda - aireDerecha) / 2);
      }
      logo.style.setProperty('--equilibrio', `${equilibrio.toFixed(1)}px`);
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(fila);
    if (navRef.current) observador.observe(navRef.current);
    if (grupoDerechoRef.current) observador.observe(grupoDerechoRef.current);
    return () => observador.disconnect();
  }, [estaAutenticado, enLanding]);

  // Menu del perfil: mismo material que la pildora. Vive fuera de ella,
  // como hermano dentro del <header>: si estuviera dentro, su
  // backdrop-filter quedaria anidado en el de la pildora y el navegador
  // solo difuminaria lo que hay dentro de ella, no la pagina.
  // Mientras esta abierto se reubica en cada frame:
  // - mismo ancho que el boton del perfil y alineado con el;
  // - con la pildora formada (flow >= 0.5) "nace" de ella: pegado a su
  //   borde inferior, sin esquinas ni borde arriba (se funde con la
  //   pildora) y redondeado solo abajo. Arriba de todo del landing la
  //   pildora todavia es transparente, asi que flota debajo del boton con
  //   todas las esquinas redondeadas;
  // - --sangria alinea el texto de las opciones con "Hola, usuario".
  useLayoutEffect(() => {
    if (!menuAbierto) return undefined;
    let cuadro = null;
    const borde = enLanding ? 'rgb(203 213 225 / 0.25)' : 'rgb(203 213 225 / 0.2)';
    const sombra = enLanding ? '0 10px 26px -10px rgb(0 0 0 / 0.35)' : '0 12px 32px -12px rgb(6 51 138 / 0.5)';
    const material = enLanding ? MATERIALES.claro : MATERIALES.azul;
    const ubicar = () => {
      const header = headerRef.current;
      const boton = perfilRef.current;
      const nombre = nombrePerfilRef.current;
      const barra = barraRef.current;
      const menu = menuRef.current;
      if (header && boton && menu && barra) {
        const h = header.getBoundingClientRect();
        const b = boton.getBoundingClientRect();
        const unido = parseFloat(barra.style.getPropertyValue('--flow') || '0') >= 0.5;
        menu.style.left = `${b.left - h.left}px`;
        menu.style.width = `${b.width}px`;
        menu.style.top = unido ? `${barra.getBoundingClientRect().bottom - h.top}px` : `${b.bottom - h.top + 8}px`;
        menu.style.borderRadius = unido ? '0 0 1rem 1rem' : '1rem';
        // Unido a la pildora: exactamente su material ya formado (mismo
        // color, misma transparencia y mismo backdrop, tomados de
        // MATERIALES), sin el reflejo superior: el de la pildora ya se
        // apago al llegar a su borde inferior, asi la union no se nota.
        // Flotando (arriba de todo, sin pildora) valen las clases del menu.
        const [rojo, verde, azul, alfa] = material.fondo;
        menu.style.backgroundColor = unido ? `rgb(${rojo} ${verde} ${azul} / ${alfa})` : '';
        menu.style.backgroundImage = unido ? 'none' : '';
        menu.style.backdropFilter = unido ? material.backdrop(1) : '';
        menu.style.webkitBackdropFilter = menu.style.backdropFilter;
        // Unido: borde solo a los costados y abajo (arriba continua la pildora).
        menu.style.boxShadow = unido
          ? `${sombra}, inset 1px 0 0 ${borde}, inset -1px 0 0 ${borde}, inset 0 -1px 0 ${borde}`
          : `${sombra}, inset 0 0 0 1px ${borde}, inset 0 1px 0 rgb(226 232 240 / 0.3)`;
        if (nombre) menu.style.setProperty('--sangria', `${nombre.getBoundingClientRect().left - b.left}px`);
      }
      cuadro = requestAnimationFrame(ubicar);
    };
    ubicar();
    return () => cancelAnimationFrame(cuadro);
  }, [menuAbierto, enLanding]);

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
    if (!barra) return undefined;
    const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const progresoDelScroll = () => Math.min(window.scrollY / DISTANCIA_FLOW_PX, 1);
    let objetivo = progresoDelScroll();
    let actual = objetivo;
    let cuadro = null;
    let instanteAnterior = null;

    const material = enLanding ? MATERIALES.claro : MATERIALES.azul;
    const pintar = () => aplicarFlow(barra, suavizarCurva(actual), material);
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
      document.documentElement.style.removeProperty('--flow');
      delete document.documentElement.dataset.topbarDecima;
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
    <header ref={headerRef} className="pointer-events-none sticky top-0 z-40 h-24">
      <div ref={barraRef} className="pointer-events-auto absolute inset-0">
        <div ref={filaRef} className="mx-auto grid h-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 whitespace-nowrap md:w-fit md:gap-x-10 lg:gap-x-12">
          {/* La columna izquierda siempre existe (aunque el nav se oculte en
              movil) para que el grid no corra el logo hacia la izquierda.
              Desde md la fila mide lo que su contenido (w-fit) y va centrada:
              las dos columnas 1fr quedan del ancho del grupo mas largo (el
              derecho), asi el logo queda al centro y el conjunto simetrico.
              Los enlaces de la izquierda van agrupados (gap fijo), juntos
              entre si y centrados dentro de su columna (pedido de Oriana;
              antes se repartian en todo el ancho con justify-between). */}
          <div className="justify-self-start md:justify-self-stretch">
            <nav ref={navRef} className="hidden items-center justify-center gap-8 text-base font-medium text-white/90 md:flex">
              {/* Link (no <a>) para que funcionen desde cualquier pagina, no
                  solo desde el landing: si el usuario esta en /panel, primero
                  navega a "/" y LandingPage.jsx hace scroll al hash una vez
                  montada (ver su useEffect sobre location.hash). */}
              <Link to="/#servicios" className="hover-texto-ilumina transition hover:text-white">Servicios</Link>
              <Link to="/#sedes" className="hover-texto-ilumina transition hover:text-white">Sedes</Link>
              <Link to="/#horarios" className="hover-texto-ilumina transition hover:text-white">Horarios</Link>
            </nav>
          </div>

          {/* Caja de tamano fijo (40px de alto, el del logo corto) con ambos
              logos absolutos y centrados: el logo grande se sale de la caja
              hacia arriba y abajo por igual, pero no agranda la fila. Si
              ocupara sus 72px en el flujo, la fila quedaria mas alta que la
              pildora (64px) y todo el contenido se veria corrido hacia abajo. */}
          <Link
            ref={logoRef}
            to="/"
            aria-label="Clínica Veterinaria UDES, ir al inicio"
            // El Link solo cambia la ruta: si ya se esta en el landing (o se
            // viene de otra pagina con scroll) la vista no subiria sola. Se
            // lleva arriba aca: suave dentro del landing, directo desde otra.
            onClick={() => {
              const suave = ubicacion.pathname === '/' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              window.scrollTo({ top: 0, behavior: suave ? 'smooth' : 'auto' });
            }}
            className="relative flex h-10 w-[126px] items-center justify-center"
            // --viaje (0..1): avance del isotipo hacia el centro, compartido
            // por el logo grande y el isotipo blanco para que se muevan juntos.
            // --equilibrio: corrimiento a la izquierda del logo grande (efecto de
            // arriba); se deshace con el viaje, asi el logo corto llega al centro.
            style={{
              '--viaje': 'clamp(0, (var(--flow, 0) - 0.1) / 0.6, 1)',
              transform: 'translateX(calc(var(--equilibrio, 0px) * (var(--viaje) - 1)))',
            }}
          >
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
          </Link>

          {/* En tablet (md) el grupo mas largo es el izquierdo: este se reparte
              igual (stretch + justify-between) para conservar la simetria. */}
          <div ref={grupoDerechoRef} className="flex items-center gap-2 justify-self-end md:justify-between md:justify-self-stretch">
            {estaAutenticado ? (
              <div className="hidden items-center gap-2 sm:flex">
                <button type="button" className="relative hidden rounded-boton p-2 xl:inline-flex text-white/80 transition hover:bg-white/10 hover:text-white">
                  <IconoCampana className="h-5 w-5" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    ref={perfilRef}
                    onClick={() => setMenuAbierto((v) => !v)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/10"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                      {iniciales || '·'}
                    </span>
                    <span ref={nombrePerfilRef} className="text-left text-base font-medium text-white">
                      {/* "Hola, " solo en el landing -- en /panel el Hero ya
                          saluda por su nombre, seria redundante repetirlo aqui. */}
                      {enLanding ? `Hola, ${usuario?.nombreCompleto?.split(' ')[0]}` : usuario?.nombreCompleto?.split(' ')[0]}
                    </span>
                    <IconoChevronAbajo className="h-4 w-4 text-white/70" />
                  </button>

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
              className="boton-glass-ambar inline-flex items-center gap-2 rounded-boton px-3 py-2 sm:px-4 text-base font-semibold text-slate-900 transition active:scale-[0.98]"
            >
              <IconoCalendario className="h-4 w-4" />
              {/* Texto desde lg: en tablet (md) el grupo derecho con el texto
                  no cabe en su columna y descentraria el logo. */}
              <span className="hidden lg:inline">Agendar cita</span>
            </button>
          </div>
        </div>
      </div>

      {menuAbierto && (
        <div
          ref={menuRef}
          // Material: cuando esta unido a la pildora, el efecto de arriba le
          // pone exactamente el de la pildora (MATERIALES). Estas clases son
          // el material del menu flotando (arriba de todo, sin pildora): en
          // el landing oscurece mas lo de atras (58%), porque ahi se abre
          // sobre la parte mas clara del Hero y las fotos de la galeria, y
          // con el 78% de la pildora el texto blanco quedaba en 3.5:1.
          // Ancho, posicion, esquinas y bordes los fija el efecto de arriba
          // (segun si la pildora esta formada). min-w-max + nowrap: si el
          // boton es mas angosto que las opciones (en /agendar y /panel dice
          // solo el nombre), el menu se estira hacia la derecha en vez de
          // partir "Mis mascotas" en dos lineas.
          className={`pointer-events-auto absolute min-w-max overflow-hidden whitespace-nowrap py-1.5 ${
            enLanding
              ? 'bg-white/12 bg-[linear-gradient(to_bottom,rgb(255_255_255/0.18),rgb(255_255_255/0)_60%)] backdrop-blur-[12px] backdrop-saturate-150 backdrop-brightness-[.58]'
              : 'bg-brand-blue-800/50 backdrop-blur-[24px] backdrop-saturate-150 backdrop-brightness-[.65]'
          }`}
        >
          {/* Atajos para volver al panel propio despues de
              navegar a una seccion del landing (Servicios/Sedes/
              Horarios) sin perder la sesion. */}
          {esCliente ? (
            <>
              <Link
                to="/panel?tab=citas"
                onClick={() => setMenuAbierto(false)}
                className="block py-2 pl-[var(--sangria,1rem)] pr-4 text-left text-sm text-white/90 transition hover:bg-white/10 hover:text-white hover-texto-ilumina"
              >
                Mis citas
              </Link>
              <Link
                to="/panel?tab=mascotas"
                onClick={() => setMenuAbierto(false)}
                className="block py-2 pl-[var(--sangria,1rem)] pr-4 text-left text-sm text-white/90 transition hover:bg-white/10 hover:text-white hover-texto-ilumina"
              >
                Mis mascotas
              </Link>
            </>
          ) : (
            <Link
              to={rutaPanelPorRol(usuario?.rol)}
              onClick={() => setMenuAbierto(false)}
              className="block py-2 pl-[var(--sangria,1rem)] pr-4 text-left text-sm text-white/90 transition hover:bg-white/10 hover:text-white hover-texto-ilumina"
            >
              Ir al panel
            </Link>
          )}
          <button
            type="button"
            onClick={salir}
            // Icono de salida en rojo + fondo rojizo en hover: es la unica
            // accion del menu que saca de la cuenta. El texto queda blanco:
            // ningun rojo llega a contraste AA sobre el vidrio azul (el rojo
            // claro daba 2.3-3.0:1); el icono acompana al texto, es acento.
            // El texto se alinea con el de las otras opciones; el icono va a
            // su izquierda, debajo del avatar.
            className="relative block w-full border-t border-white/10 py-2 pl-[var(--sangria,1rem)] pr-4 text-left text-sm font-medium text-white transition hover:bg-red-500/25 hover-texto-ilumina"
          >
            <IconoSalir className="absolute left-[calc(var(--sangria,2.5rem)-1.5rem)] top-1/2 h-4 w-4 -translate-y-1/2 text-red-300" />
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}
