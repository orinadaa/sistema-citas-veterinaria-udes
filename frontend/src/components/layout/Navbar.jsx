// components/layout/Navbar.jsx
// Topbar azul institucional (brand.blue): logo blanco, texto blanco y
// el boton "Agendar cita" en ambar (brand.amber, texto slate-900 --
// mismo color de texto que el boton equivalente del Hero). En la
// landing (unica pagina con Hero), brand.blue tambien es el primer
// stop del degradado del Hero (from-brand-blue-500), asi que el
// navbar solido se continua sin costura visible hacia el degradado de
// abajo.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoCorto from '../../assets/logocorto.png';
import { useAuth, CLAVE_ALMACENAMIENTO } from '../../context/AuthContext';
import { rutaAgendarCita } from '../../utils/rutas';
import { IconoCalendario, IconoCampana, IconoChevronAbajo } from '../icons';

export function Navbar() {
  const { estaAutenticado, usuario } = useAuth();
  const navegar = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const iniciales = usuario?.nombreCompleto
    ?.split(' ')
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase();

  function irAAgendar() {
    navegar(rutaAgendarCita(estaAutenticado));
  }

  function salir() {
    // No se llama cerrarSesion() (dispara un re-render vía React state):
    // en /panel (protegido por ProtectedRoute) eso mostraba un flash de
    // /iniciar-sesion antes de que la recarga completa tuviera efecto.
    // Se limpia localStorage directamente y se recarga -- la pagina
    // nueva arranca ya sin sesion, sin pasar por ningun render intermedio.
    localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    window.location.href = '/';
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
            <div className="hidden items-center gap-2 sm:flex">
              <button type="button" className="relative rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white">
                <IconoCampana className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuAbierto((v) => !v)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/10"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                    {iniciales || '·'}
                  </span>
                  <span className="text-left text-sm font-medium text-white">
                    {usuario?.nombreCompleto?.split(' ')[0]}
                  </span>
                  <IconoChevronAbajo className="h-4 w-4 text-white/70" />
                </button>

                {menuAbierto && (
                  <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white py-1.5 shadow-lg ring-1 ring-slate-200">
                    <button
                      type="button"
                      onClick={salir}
                      className="w-full px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
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
