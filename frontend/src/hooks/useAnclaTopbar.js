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
// listas). Las teclas de scroll (flechas, Av/Re Pag, espacio) hacen el
// mismo salto, salvo cuando el foco esta en un campo o control que las
// usa. El landing resuelve el teclado con scroll-snap de CSS, pero aca no
// sirve: obligaria a engancharse siempre a una de las dos posiciones, y
// del ancla hacia abajo el scroll tiene que ser libre.
// Si se llega a la zona intermedia por otro medio (barra de scroll), al
// terminar el scroll se completa el salto en el sentido en que se venia.
import { useEffect } from 'react';

// Scroll con el que la topbar termina de formarse (DISTANCIA_FLOW_PX en
// Navbar.jsx): el ancla nunca queda mas arriba que esto.
const SCROLL_PILDORA_FORMADA = 260;
const SILENCIO_FIN_GESTO_MS = 200;
const TIEMPO_MAXIMO_MOVIMIENTO_MS = 1200;
const DELTA_MINIMO = 4;
const TOLERANCIA_PX = 2;
// Teclas que mueven la pagina: sentido y si avanzan una pantalla entera.
const TECLAS_DE_SCROLL = {
  ArrowDown: { baja: true },
  ArrowUp: { baja: false },
  PageDown: { baja: true, pagina: true },
  PageUp: { baja: false, pagina: true },
  ' ': { baja: true, pagina: true },
  'Shift+ ': { baja: false, pagina: true },
};

// true si el elemento esta dentro de algo con scroll vertical propio.
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
    // Sentido del ultimo movimiento, para completar el salto si el scroll
    // termina en la zona intermedia (barra de scroll).
    let yAnterior = window.scrollY;
    let veniaBajando = true;

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

    // Destino del salto segun la posicion y el sentido, o null si ahi el
    // scroll es libre. paso = cuanto se moveria la pagina sin intervenir.
    function destinoDelSalto(ancla, baja, paso) {
      const y = window.scrollY;
      if (baja && y < ancla - TOLERANCIA_PX) return ancla;
      if (!baja && y > 0 && y <= ancla + TOLERANCIA_PX) return 0;
      // Subiendo desde mas abajo: se frena en el ancla en vez de pasarse
      // a la zona intermedia; el siguiente gesto ya lleva arriba.
      if (!baja && y > ancla + TOLERANCIA_PX && y - paso < ancla) return ancla;
      return null;
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

      const destino = destinoDelSalto(ancla, evento.deltaY > 0, Math.abs(evento.deltaY));
      if (destino === null) return;
      evento.preventDefault();
      ultimoEvento = Date.now();
      irA(destino);
    }

    function alPulsarTecla(evento) {
      if (!escritorio.matches || evento.defaultPrevented || evento.ctrlKey || evento.altKey || evento.metaKey) return;
      const tecla = TECLAS_DE_SCROLL[evento.key === ' ' && evento.shiftKey ? 'Shift+ ' : evento.key];
      if (!tecla) return;
      // Campos, selects, dialogos, botones (espacio) y cualquier cosa con
      // scroll propio usan estas teclas para lo suyo.
      const foco = evento.target instanceof Element ? evento.target : null;
      if (foco?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      if (evento.key === ' ' && foco?.closest('button, a, [role="tab"]')) return;
      if (tieneScrollPropio(foco)) return;
      const ancla = posicionAncla();
      if (ancla === null) return;

      if (bloqueado) {
        evento.preventDefault();
        return;
      }

      const paso = tecla.pagina ? window.innerHeight * 0.9 : 40;
      const destino = destinoDelSalto(ancla, tecla.baja, paso);
      if (destino === null) return;
      evento.preventDefault();
      irA(destino);
    }

    function alHacerScroll() {
      const y = window.scrollY;
      if (y !== yAnterior) veniaBajando = y > yAnterior;
      yAnterior = y;
    }

    function alTerminarScroll() {
      enMovimiento = false;
      if (bloqueado || !escritorio.matches) return;
      const ancla = posicionAncla();
      if (ancla === null) return;
      const y = window.scrollY;
      if (y > TOLERANCIA_PX && y < ancla - TOLERANCIA_PX) irA(veniaBajando ? ancla : 0);
    }

    window.addEventListener('wheel', alGirarRueda, { passive: false });
    window.addEventListener('keydown', alPulsarTecla);
    window.addEventListener('scroll', alHacerScroll, { passive: true });
    window.addEventListener('scrollend', alTerminarScroll);
    return () => {
      window.removeEventListener('wheel', alGirarRueda);
      window.removeEventListener('keydown', alPulsarTecla);
      window.removeEventListener('scroll', alHacerScroll);
      window.removeEventListener('scrollend', alTerminarScroll);
      clearTimeout(temporizador);
    };
  }, []);
}
