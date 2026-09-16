// components/landing/CtaBanner.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccentBar } from '../AccentBar';
import { rutaAgendarCita } from '../../utils/rutas';

export function CtaBanner() {
  const navegar = useNavigate();
  const { estaAutenticado } = useAuth();

  function irAAgendar() {
    navegar(rutaAgendarCita(estaAutenticado));
  }

  return (
    <section className="bg-blue-600">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
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
          className="rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-[0.98]"
        >
          Agendar cita
        </button>
      </div>
    </section>
  );
}
