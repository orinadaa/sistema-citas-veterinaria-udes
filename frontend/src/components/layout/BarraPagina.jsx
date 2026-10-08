// components/layout/BarraPagina.jsx
// Barra de desplazamiento de la PAGINA, flotante (pedido de Oriana): una
// pildora ambar con brillo, como los botones "Agendar cita", que flota
// sobre el contenido sin canal ni franja de fondo.
//
// Por que es un componente y no solo CSS: la barra nativa de la pagina
// siempre reserva una franja con fondo propio (no puede ser transparente
// sobre el contenido). Entonces se oculta la nativa (clase barra-flotante
// en <html>, ver vetui.css) y se dibuja esta encima, atada al scroll real:
// rueda, teclado, trackpad y los saltos del sistema (landing paginado,
// useAnclaTopbar) siguen siendo el scroll nativo; esto solo lo muestra y
// permite arrastrarlo.
//
// - Solo con mouse (hover + puntero fino). En pantallas tactiles se deja la
//   barra del sistema, que ya es flotante.
// - Se oculta sola si la pagina no tiene scroll (ej. panel administrativo,
//   que se desplaza por dentro: ahi aplica la barra CSS de vetui.css).
// - aria-hidden: es un adorno del scroll; el teclado mueve la pagina igual.
// - z-45: sobre la topbar (z-40), debajo de paneles y dialogos (z-50).
import { useEffect, useRef } from 'react';

const MARGEN_PX = 6;
const LARGO_MINIMO_PX = 48;

export function BarraPagina() {
  const barra = useRef(null);

  useEffect(() => {
    const elemento = barra.current;
    const raiz = document.documentElement;
    const conMouse = window.matchMedia('(hover: hover) and (pointer: fine)');
    let cuadro = 0;
    let arrastre = null;

    // Largo y posicion de la pildora segun el scroll real de la pagina.
    function dibujar() {
      cuadro = 0;
      const alto = window.innerHeight;
      const total = raiz.scrollHeight;
      const maximo = total - alto;
      if (!conMouse.matches || maximo <= 1) {
        elemento.hidden = true;
        return;
      }
      const pista = alto - MARGEN_PX * 2;
      const largo = Math.max(LARGO_MINIMO_PX, Math.round((pista * alto) / total));
      const avance = Math.min(1, Math.max(0, window.scrollY / maximo));
      elemento.hidden = false;
      elemento.style.height = `${largo}px`;
      elemento.style.transform = `translateY(${MARGEN_PX + (pista - largo) * avance}px)`;
    }

    function pedirDibujo() {
      if (!cuadro) cuadro = requestAnimationFrame(dibujar);
    }

    function alCambiarPuntero() {
      raiz.classList.toggle('barra-flotante', conMouse.matches);
      pedirDibujo();
    }

    function alPresionar(evento) {
      if (evento.button !== 0) return;
      evento.preventDefault();
      elemento.setPointerCapture(evento.pointerId);
      arrastre = { y: evento.clientY, scroll: window.scrollY };
      elemento.dataset.arrastrando = '';
    }

    function alMover(evento) {
      if (!arrastre) return;
      const alto = window.innerHeight;
      const recorrido = alto - MARGEN_PX * 2 - elemento.offsetHeight;
      if (recorrido <= 0) return;
      const porPixel = (raiz.scrollHeight - alto) / recorrido;
      window.scrollTo({ top: arrastre.scroll + (evento.clientY - arrastre.y) * porPixel, behavior: 'instant' });
    }

    function alSoltar() {
      arrastre = null;
      delete elemento.dataset.arrastrando;
    }

    alCambiarPuntero();
    // El alto del contenido cambia al navegar o al cargar datos.
    const observador = new ResizeObserver(pedirDibujo);
    observador.observe(document.body);
    window.addEventListener('scroll', pedirDibujo, { passive: true });
    window.addEventListener('resize', pedirDibujo);
    conMouse.addEventListener('change', alCambiarPuntero);
    elemento.addEventListener('pointerdown', alPresionar);
    elemento.addEventListener('pointermove', alMover);
    elemento.addEventListener('pointerup', alSoltar);
    elemento.addEventListener('pointercancel', alSoltar);

    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      window.removeEventListener('scroll', pedirDibujo);
      window.removeEventListener('resize', pedirDibujo);
      conMouse.removeEventListener('change', alCambiarPuntero);
      elemento.removeEventListener('pointerdown', alPresionar);
      elemento.removeEventListener('pointermove', alMover);
      elemento.removeEventListener('pointerup', alSoltar);
      elemento.removeEventListener('pointercancel', alSoltar);
      raiz.classList.remove('barra-flotante');
    };
  }, []);

  return <div ref={barra} hidden aria-hidden="true" className="barra-pagina" />;
}
