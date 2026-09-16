// components/layout/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import logoAzul from '../../assets/logo-azul.png';
import { useAuth } from '../../context/AuthContext';
import { rutaAgendarCita } from '../../utils/rutas';

export function Navbar() {
  const { estaAutenticado, usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  function irAAgendar() {
    navegar(rutaAgendarCita(estaAutenticado));
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoAzul} alt="Clínica Veterinaria UDES" className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#servicios" className="hover:text-blue-700">Servicios</a>
          <a href="#sedes" className="hover:text-blue-700">Sedes</a>
          <a href="#horarios" className="hover:text-blue-700">Horarios</a>
        </nav>

        <div className="flex items-center gap-3">
          {estaAutenticado ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:inline">
                Hola, {usuario?.nombreCompleto?.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={cerrarSesion}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link
              to="/iniciar-sesion"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 sm:inline-block"
            >
              Iniciar sesión
            </Link>
          )}
          <button
            type="button"
            onClick={irAAgendar}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
          >
            Agendar cita
          </button>
        </div>
      </div>
    </header>
  );
}
