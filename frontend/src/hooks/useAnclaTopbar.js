// hooks/useAnclaTopbar.js
// Scroll en dos posiciones para el arranque de una pagina con <Navbar/>
// (ej. /agendar), como el paginado del landing pero con una sola parada:
// - arriba de todo (scroll 0): topbar transparente y stepper superior;
// - el "ancla": la pildora de la topbar ya formada y el contenido marcado
//   con data-ancla-topbar justo debajo de ella (respeta su scroll-margin-top,
//   asi la pildora no tapa las tarjetas).
// Entre las dos no se puede quedar: un gesto de rueda hacia abajo desde
// arriba lleva directo al ancla, y uno hacia arriba desde el ancla vuelve
// arriba. Asi nunca se ve la transicion de la topbar a medio camino. Del
// ancla hacia abajo el scroll es el normal del navegador.
//
// Solo desde lg (computadoras con mouse); Ctrl + rueda (zoom) no se toca,
// ni la rueda sobre un elemento con scroll propio (paneles laterales,
// listas). Si se llega a la zona intermedia por otro medio (teclado,
// barra de scroll), al terminar el scroll se acomoda en la posicion mas
// cercana.
import { useEffect } from 'react';

// Scroll con el que la topbar termina de formarse (DISTANCIA_FLOW_PX en
// Navbar.jsx): el ancla nunca queda mas arriba que esto.
const SCROLL_PILDORA_FORMADA = 260;
const SILENCIO_FIN_GESTO_MS = 200;
const TIEMPO_MAXIMO_MOVIMIENTO_MS = 1200;
const DELTA_MINIMO = 4;
const TOLERANCIA_PX = 2;

// true si la rueda cae sobre algo que tiene su propio scroll vertical.
function tieneScrollPropio(elemento) {
  for (let e = elemento; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
    const overflow = getComputedStyle(e).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && e.scrollHeight > e.clientHeight) return true;
  }
  return false;
}

export function useAnclaTopbar() {
  useEffect(() => {
    const escritorio = window.matchMedia('(min-width: 64rem)');
    const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let bloqueado = false;
    let enMovimiento = false;
    let ultimoEvento = 0;
    let inicioMovimiento = 0;
    let temporizador = null;

    // Posicion del ancla, o null si la pagina no la tiene o es tan corta
    // que no se puede bajar hasta formar la pildora.
    function posicionAncla() {
      const elemento = document.querySelector('[data-ancla-topbar]');
      if (!elemento) return null;
      const maximo = document.documentElement.scrollHeight - window.innerHeight;
      if (maximo < SCROLL_PILDORA_FORMADA) return null;
      const margen = parseFloat(getComputedStyle(elemento).scrollMarginTop) || 0;
      const natural = Math.round(elemento.getBoundingClientRect().top + window.scrollY - margen);
      return Math.min(Math.max(natural, SCROLL_PILDORA_FORMADA), maximo);
    }

    // Se desbloquea cuando la pagina dejo de moverse Y el gesto termino
    // (la inercia del trackpad sigue mandando eventos ~1s).
    function intentarDesbloquear() {
      const quieto = Date.now() - inicioMovimiento > TIEMPO_MAXIMO_MOVIMIENTO_MS || !enMovimiento;
      if (quieto && Date.now() - ultimoEvento > SILENCIO_FIN_GESTO_MS) {
        bloqueado = false;
        temporizador = null;
      } else {
        temporizador = setTimeout(intentarDesbloquear, 60);
      }
    }

    function irA(destino) {
      bloqueado = true;
      enMovimiento = true;
      inicioMovimiento = Date.now();
      window.scrollTo({ top: destino, behavior: sinAnimacion.matches ? 'auto' : 'smooth' });
      clearTimeout(temporizador);
      temporizador = setTimeout(intentarDesbloquear, 60);
    }

    function alGirarRueda(evento) {
      if (!escritorio.matches || evento.ctrlKey || Math.abs(evento.deltaY) < DELTA_MINIMO) return;
      if (tieneScrollPropio(evento.target)) return;
      const ancla = posicionAncla();
      if (ancla === null) return;

      if (bloqueado) {
        // Mientras dura el salto (y la inercia del gesto) no se mueve nada.
        evento.preventDefault();
        ultimoEvento = Date.now();
        return;
      }

      const y = window.scrollY;
      const baja = evento.deltaY > 0;
      let destino = null;
      if (baja && y < ancla - TOLERANCIA_PX) destino = ancla;
      else if (!baja && y > 0 && y <= ancla + TOLERANCIA_PX) destino = 0;
      // Subiendo desde mas abajo: se frena en el ancla en vez de pasarse
      // a la zona intermedia; el siguiente gesto ya lleva arriba.
      else if (!baja && y > ancla + TOLERANCIA_PX && y + evento.deltaY < ancla) destino = ancla;
      if (destino === null) return;

      evento.preventDefault();
      ultimoEvento = Date.now();
      irA(destino);
    }

    function alTerminarScroll() {
      enMovimiento = false;
      if (bloqueado || !escritorio.matches) return;
      const ancla = posicionAncla();
      if (ancla === null) return;
      const y = window.scrollY;
      if (y > TOLERANCIA_PX && y < ancla - TOLERANCIA_PX) irA(y < ancla / 2 ? 0 : ancla);
    }

    window.addEventListener('wheel', alGirarRueda, { passive: false });
    window.addEventListener('scrollend', alTerminarScroll);
    return () => {
      window.removeEventListener('wheel', alGirarRueda);
      window.removeEventListener('scrollend', alTerminarScroll);
      clearTimeout(temporizador);
    };
  }, []);
}
