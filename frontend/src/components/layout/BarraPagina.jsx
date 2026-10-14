// components/layout/BarraPagina.jsx
// Barra de desplazamiento de la PAGINA, flotante: una pildora ambar con
// brillo, como los botones "Agendar cita", que flota sobre el contenido sin
// canal ni franja de fondo.
import { useEffect, useRef } from 'react';

const MARGEN_PX = 6;
const LARGO_MINIMO_PX = 48;
// Tiempo quieta en un tope antes de desvanecerse.
const ESPERA_REPOSO_MS = 700;
// Margen para considerar que se llego a un tope (con zoom del navegador o
// escala de pantalla el scroll queda en decimales).
const TOLERANCIA_TOPE_PX = 2;

export function BarraPagina() {
  const barra = useRef(null);

  useEffect(() => {
    const elemento = barra.current;
    const raiz = document.documentElement;
    const conMouse = window.matchMedia('(hover: hover) and (pointer: fine)');
    let cuadro = 0;
    let arrastre = null;
    let reposo = null;
    // Al cargar ya esta en el tope de arriba: arranca apagada, sin parpadeo.
    let primerDibujo = true;

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

      const enTope = window.scrollY <= TOLERANCIA_TOPE_PX || window.scrollY >= maximo - TOLERANCIA_TOPE_PX;
      clearTimeout(reposo);
      if (!enTope) {
        delete elemento.dataset.reposo;
      } else if (primerDibujo) {
        elemento.dataset.reposo = '';
      } else if (!('reposo' in elemento.dataset)) {
        reposo = setTimeout(() => {
          elemento.dataset.reposo = '';
        }, ESPERA_REPOSO_MS);
      }
      primerDibujo = false;
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

    // Barras de adentro: visibles solo mientras su contenedor no esta en un
    // tope. El evento scroll no burbujea, por eso se escucha en captura.
    const apagados = new WeakMap();
    function alDesplazarAdentro(evento) {
      const contenedor = evento.target;
      if (!(contenedor instanceof Element) || contenedor === raiz || contenedor === document.body) return;
      const maximoY = contenedor.scrollHeight - contenedor.clientHeight;
      const maximoX = contenedor.scrollWidth - contenedor.clientWidth;
      const topeY =
        maximoY <= TOLERANCIA_TOPE_PX ||
        contenedor.scrollTop <= TOLERANCIA_TOPE_PX ||
        contenedor.scrollTop >= maximoY - TOLERANCIA_TOPE_PX;
      const topeX =
        maximoX <= TOLERANCIA_TOPE_PX ||
        Math.abs(contenedor.scrollLeft) <= TOLERANCIA_TOPE_PX ||
        Math.abs(contenedor.scrollLeft) >= maximoX - TOLERANCIA_TOPE_PX;
      clearTimeout(apagados.get(contenedor));
      if (topeY && topeX) {
        apagados.set(
          contenedor,
          setTimeout(() => contenedor.removeAttribute('data-barra-activa'), ESPERA_REPOSO_MS)
        );
      } else {
        contenedor.setAttribute('data-barra-activa', '');
      }
    }
    document.addEventListener('scroll', alDesplazarAdentro, { capture: true, passive: true });

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
      clearTimeout(reposo);
      observador.disconnect();
      window.removeEventListener('scroll', pedirDibujo);
      document.removeEventListener('scroll', alDesplazarAdentro, { capture: true });
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
