// hooks/usePaginadoPorRueda.js
// Landing paginado: cada gesto de rueda del mouse (o del trackpad) lleva a la
// seccion siguiente o anterior, como slides.
import { useEffect } from 'react';

const SILENCIO_FIN_GESTO_MS = 200;
const TIEMPO_MAXIMO_MOVIMIENTO_MS = 1200;
const DELTA_MINIMO = 4;

export function usePaginadoPorRueda() {
  useEffect(() => {
    const escritorio = window.matchMedia('(min-width: 64rem)');
    const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let bloqueado = false;
    let enMovimiento = false;
    let ultimoEvento = 0;
    let inicioMovimiento = 0;
    let temporizador = null;

    // Posicion de cada slide, limitada al scroll maximo (la ultima puede
    // empezar mas abajo de lo que la pagina permite bajar).
    function posiciones() {
      const maximo = document.documentElement.scrollHeight - window.innerHeight;
      return [...document.querySelectorAll('[data-slide]')].map((s) =>
        Math.min(Math.round(s.getBoundingClientRect().top + window.scrollY), maximo)
      );
    }

    // Se desbloquea cuando la pagina dejo de moverse Y el gesto termino
    // (sin eventos de rueda durante SILENCIO_FIN_GESTO_MS).
    function intentarDesbloquear() {
      const quieto = Date.now() - inicioMovimiento > TIEMPO_MAXIMO_MOVIMIENTO_MS || !enMovimiento;
      if (quieto && Date.now() - ultimoEvento > SILENCIO_FIN_GESTO_MS) {
        bloqueado = false;
        temporizador = null;
      } else {
        temporizador = setTimeout(intentarDesbloquear, 60);
      }
    }

    const alTerminarScroll = () => {
      enMovimiento = false;
    };

    function alGirarRueda(evento) {
      if (!escritorio.matches || evento.ctrlKey || Math.abs(evento.deltaY) < DELTA_MINIMO) return;
      evento.preventDefault();
      ultimoEvento = Date.now();
      if (bloqueado) return;

      const lista = posiciones();
      if (lista.length === 0) return;
      // Slide actual = la posicion mas cercana al scroll de ahora.
      let actual = 0;
      lista.forEach((pos, i) => {
        if (Math.abs(pos - window.scrollY) < Math.abs(lista[actual] - window.scrollY)) actual = i;
      });
      const destino = Math.min(Math.max(actual + Math.sign(evento.deltaY), 0), lista.length - 1);
      if (lista[destino] === Math.round(window.scrollY)) return;

      bloqueado = true;
      enMovimiento = true;
      inicioMovimiento = Date.now();
      window.scrollTo({ top: lista[destino], behavior: sinAnimacion.matches ? 'auto' : 'smooth' });
      clearTimeout(temporizador);
      temporizador = setTimeout(intentarDesbloquear, 60);
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
