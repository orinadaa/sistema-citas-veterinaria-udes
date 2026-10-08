// pages/LandingPage.jsx
// RF-03: pagina publica, accesible sin autenticacion.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/landing/Hero';
import { Servicios } from '../components/landing/Servicios';
import { Sedes } from '../components/landing/Sedes';
import { Horarios } from '../components/landing/Horarios';
import { CtaBanner } from '../components/landing/CtaBanner';
import { HuellasFondo } from '../components/landing/HuellasFondo';
import { usePaginadoPorRueda } from '../hooks/usePaginadoPorRueda';

export function LandingPage() {
  const { hash } = useLocation();

  // Paginado por secciones solo mientras el landing esta montado (las
  // reglas viven en index.css, bajo html.snap-landing).
  useEffect(() => {
    document.documentElement.classList.add('snap-landing');
    return () => document.documentElement.classList.remove('snap-landing');
  }, []);
  usePaginadoPorRueda();

  // Los links de Servicios/Sedes/Horarios del navbar navegan a "/#id"
  // desde cualquier pagina (Navbar.jsx) -- al llegar aqui (recien
  // montado, o ya en el landing y solo cambia el hash), hace falta
  // el scroll manual: un cambio de hash via React Router no dispara
  // el auto-scroll nativo del navegador como si fuera una carga normal.
  useEffect(() => {
    if (!hash) return;
    const elemento = document.querySelector(hash);
    elemento?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* Hero, Servicios, Sedes, Horarios y la banda de cierre comparten un
            solo fondo (el footer no). Degradado continuo que arranca en
            brand-blue-500 (el azul de la topbar) y oscurece rapido: el azul
            claro queda solo en la parte alta del Hero y brand-blue-800 llega
            al terminar el Hero (20%), asi Servicios ya arranca oscuro. Ninguna seccion tiene fondo propio
            (solo halos), asi que no hay uniones visibles entre ellas.
            -mt-24: el fondo sube por detras de la topbar (96px, transparente
            arriba; el Hero compensa con pt-24). overflow-clip (no hidden):
            recorta los halos que se salen a los costados sin crear un
            contenedor de scroll; con overflow-hidden las secciones quedaban
            enganchadas a este div en vez de a la pagina y el scroll snap del
            landing paginado (index.css) no funcionaba. */}
        <div className="relative isolate -mt-24 overflow-clip bg-[linear-gradient(to_bottom,var(--color-brand-blue-500)_0%,var(--color-brand-blue-600)_7%,var(--color-brand-blue-700)_13%,var(--color-brand-blue-800)_20%,var(--color-brand-blue-800)_100%)]">
          <HuellasFondo />
          <Hero />
          <Servicios />
          <Sedes />
          <Horarios />
          <CtaBanner />
        </div>
      </main>
      <Footer />
    </div>
  );
}
