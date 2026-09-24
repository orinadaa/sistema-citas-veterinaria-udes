// components/layout/Navbar.jsx
// Topbar azul institucional (#4280F7): logo blanco, texto blanco y el
// boton "Agendar cita" en ambar (#F7A71C) -- unicos tres colores en
// esta barra (azul de fondo, ambar del boton, blanco para todo lo demas).
import { Link, useNavigate } from 'react-router-dom';
import logoBlanco from '../../assets/logoblanco.png';
import { useAuth } from '../../context/AuthContext';
import { rutaAgendarCita } from '../../utils/rutas';
import { IconoCalendario } from '../icons';

const COLOR_TOPBAR = '#4280F7';
const COLOR_BOTON = '#F7A71C';

export function Navbar() {
  const { estaAutenticado, usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  function irAAgendar() {
    navegar(rutaAgendarCita(estaAutenticado));
  }

  return (
    <header className="sticky top-0 z-40" style={{ backgroundColor: COLOR_TOPBAR }}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoBlanco} alt="Clínica Veterinaria UDES" className="h-12 w-auto object-contain" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-white/90 md:flex">
          <a href="#servicios" className="transition hover:text-white">Servicios</a>
          <a href="#sedes" className="transition hover:text-white">Sedes</a>
          <a href="#horarios" className="transition hover:text-white">Horarios</a>
        </nav>

        <div className="flex items-center gap-3">
          {estaAutenticado ? (
            <>
              <span className="hidden text-sm text-white/90 sm:inline">
                Hola, {usuario?.nombreCompleto?.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={cerrarSesion}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <Link
                to="/iniciar-sesion"
                className="rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/registrarse"
                className="rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Registrarse
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={irAAgendar}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:scale-[0.98]"
            style={{ backgroundColor: COLOR_BOTON }}
          >
            <IconoCalendario className="h-4 w-4" />
            Agendar cita
          </button>
        </div>
      </div>
    </header>
  );
}
