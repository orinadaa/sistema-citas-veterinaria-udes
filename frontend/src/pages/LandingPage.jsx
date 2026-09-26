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
        <Hero />
        <Servicios />
        <Sedes />
        <Horarios />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
