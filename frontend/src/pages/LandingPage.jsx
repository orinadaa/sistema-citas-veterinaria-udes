// pages/LandingPage.jsx
// RF-03: pagina publica, accesible sin autenticacion.
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/landing/Hero';
import { Servicios } from '../components/landing/Servicios';
import { Sedes } from '../components/landing/Sedes';
import { CtaBanner } from '../components/landing/CtaBanner';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Servicios />
        <Sedes />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
