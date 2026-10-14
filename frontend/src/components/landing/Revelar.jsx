// components/landing/Revelar.jsx
// Scroll-reveal del landing con IntersectionObserver nativo (sin libreria
// nueva, ver el alcance del proyecto)
import { useEffect, useRef, useState } from 'react';

const OPCIONES_OBSERVADOR = { threshold: 0.15, rootMargin: '0px 0px -10% 0px' };

export function Revelar({ children, retraso = 0, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const elemento = ref.current;
    if (visible || !elemento) return undefined;
    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) {
        setVisible(true);
        observador.disconnect();
      }
    }, OPCIONES_OBSERVADOR);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${retraso}ms` : '0ms' }}
      className={`transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}
