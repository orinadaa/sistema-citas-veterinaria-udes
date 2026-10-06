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

export function LandingPage() {
  const { hash } = useLocation();

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
        {/* Hero + Servicios comparten un solo fondo: degradado continuo desde
            brand-blue-500 (el azul de la topbar, arriba) hasta brand-blue-800
            al final de Servicios. Ninguna de las dos secciones tiene fondo
            propio (solo halos), asi que no hay union visible entre ellas.
            -mt-24: el fondo sube por detras de la topbar (96px, transparente
            arriba; el Hero compensa con pt-24). overflow-hidden: los halos
            que se salen a los costados no generan scroll horizontal. */}
        <div className="relative isolate -mt-24 overflow-hidden bg-[linear-gradient(to_bottom,var(--color-brand-blue-500)_0%,var(--color-brand-blue-600)_38%,var(--color-brand-blue-700)_68%,var(--color-brand-blue-800)_100%)]">
          <Hero />
          <Servicios />
        </div>
        <Sedes />
        <Horarios />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
