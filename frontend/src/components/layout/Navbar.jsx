// components/layout/Navbar.jsx
// Topbar azul institucional (brand.blue): logo blanco, texto blanco y
// el boton "Agendar cita" en ambar (brand.amber, texto slate-900 --
// mismo color de texto que el boton equivalente del Hero). En la
// landing (unica pagina con Hero), brand.blue tambien es el primer
// stop del degradado del Hero (from-brand-blue-500), asi que el
// navbar solido se continua sin costura visible hacia el degradado de
// abajo.
import { Link, useNavigate } from 'react-router-dom';
import logoCorto from '../../assets/logocorto.png';
import { useAuth } from '../../context/AuthContext';
import { rutaAgendarCita } from '../../utils/rutas';
import { IconoCalendario } from '../icons';

export function Navbar() {
  const { estaAutenticado, usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  function irAAgendar() {
    navegar(rutaAgendarCita(estaAutenticado));
  }

  return (
    <header className="sticky top-0 z-40 bg-brand-blue">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoCorto} alt="Clínica Veterinaria UDES" className="h-12 w-auto object-contain" />
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
            className="inline-flex items-center gap-2 rounded-lg bg-brand-amber px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:brightness-95 active:scale-[0.98]"
          >
            <IconoCalendario className="h-4 w-4" />
            Agendar cita
          </button>
        </div>
      </div>
    </header>
  );
}
