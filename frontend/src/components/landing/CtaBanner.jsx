// components/landing/CtaBanner.jsx
// Banda de cierre: azul de marca solido (brand.blue) con formas ambar en las
// esquinas y un patron sutil de huellas de fondo. Las formas y las
// huellas se generan con CSS/el icono de pata ya existente (sin
// inventar un asset de imagen nuevo para algo puramente decorativo).
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccentBar } from '../AccentBar';
import { IconoPata, IconoFlechaDerecha } from '../icons';
import { rutaAgendarCita } from '../../utils/rutas';

const HUELLAS = [
  { top: '10%', left: '8%', size: 28, rotate: -12 },
  { top: '70%', left: '4%', size: 20, rotate: 20 },
  { top: '20%', left: '92%', size: 24, rotate: 8 },
  { top: '75%', left: '90%', size: 32, rotate: -20 },
  { top: '45%', left: '15%', size: 16, rotate: 30 },
  { top: '85%', left: '55%', size: 18, rotate: -8 },
];

export function CtaBanner() {
  const navegar = useNavigate();
  const { estaAutenticado } = useAuth();

  function irAAgendar() {
    navegar(rutaAgendarCita(estaAutenticado));
  }

  return (
    <section className="relative overflow-hidden bg-brand-blue">
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-amber-400/30 blur-2xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-amber-400/30 blur-2xl" aria-hidden="true" />

      {HUELLAS.map((h, indice) => (
        <span
          key={indice}
          className="pointer-events-none absolute text-white/10"
          aria-hidden="true"
          style={{ top: h.top, left: h.left, width: h.size, height: h.size, transform: `rotate(${h.rotate}deg)` }}
        >
          <IconoPata className="h-full w-full" />
        </span>
      ))}

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
        <h2 className="max-w-xl text-3xl font-bold tracking-tight text-white">
          ¿Tu mascota necesita una cita?
        </h2>
        <AccentBar sobreFondoAzul centrado />
        <p className="max-w-md text-blue-100">
          Regístrate o inicia sesión para agendar en la sede que prefieras.
        </p>
        <button
          type="button"
          onClick={irAAgendar}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-[0.98]"
        >
          Agendar cita
          <IconoFlechaDerecha className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
