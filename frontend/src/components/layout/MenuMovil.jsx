// components/layout/MenuMovil.jsx
// Menu de la barra superior en celular y tableta (por debajo de md).
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { rutaPanelPorRol } from '../../utils/rutas';
import { useFocoDialogo } from '../../hooks/useFocoDialogo';
import { IconoCalendario, IconoInicio, IconoMenu, IconoPata, IconoPersona, IconoReloj, IconoSalir, IconoX } from '../icons';

const CLASE_ENLACE =
  'flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white';

export function MenuMovil({ estaAutenticado, usuario, onSalir }) {
  const [abierto, setAbierto] = useState(false);
  const ubicacion = useLocation();
  const botonRef = useRef(null);
  const cerrarRef = useRef(null);
  const panelRef = useRef(null);
  const rol = usuario?.rol;
  const esMedico = rol === 'veterinario';
  const esCliente = rol === 'cliente';

  // Cambiar de pagina (o de seccion del inicio) cierra el menu.
  const clave = ubicacion.pathname + ubicacion.search + ubicacion.hash;
  const [claveVista, setClaveVista] = useState(clave);
  if (clave !== claveVista) {
    setClaveVista(clave);
    setAbierto(false);
  }

  useEffect(() => {
    if (!abierto) return undefined;
    cerrarRef.current?.focus();
    const boton = botonRef.current;
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('keydown', alPresionarTecla);
    // La pagina de atras no se desplaza mientras el menu esta abierto.
    const desbordeAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alPresionarTecla);
      document.body.style.overflow = desbordeAnterior;
      boton?.focus();
    };
  }, [abierto]);

  // El foco inicial y el regreso al boton ya los maneja el efecto de arriba.
  useFocoDialogo(abierto, panelRef, { enfocarAlAbrir: false });

  const cerrar = () => setAbierto(false);
  const nombre = usuario?.nombreCompleto?.split(' ')[0];

  return (
    <>
      <button
        type="button"
        ref={botonRef}
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        className="boton-texto flex h-11 w-11 items-center justify-center rounded-boton text-white md:hidden"
      >
        <IconoMenu className="h-6 w-6" />
      </button>

      {abierto &&
        createPortal(
          <div className="fixed inset-0 z-[70] md:hidden">
            <div aria-hidden="true" onClick={cerrar} className="absolute inset-0 bg-brand-blue-800/55 backdrop-blur-md" />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menú"
              className="absolute inset-x-3 top-3 max-h-[calc(100dvh-1.5rem)] overflow-y-auto vidrio vidrio-hoja rounded-[28px] p-3"
            >
              <div className="flex items-center justify-between pl-3">
                <p className="text-base font-semibold text-white">{estaAutenticado && nombre ? `Hola, ${nombre}` : 'Menú'}</p>
                <button
                  type="button"
                  ref={cerrarRef}
                  onClick={cerrar}
                  aria-label="Cerrar menú"
                  className="boton-texto flex h-11 w-11 items-center justify-center rounded-boton text-white focus-visible:outline-2 focus-visible:outline-white"
                >
                  <IconoX className="h-6 w-6" />
                </button>
              </div>

              <nav aria-label="Secciones" className="mt-1 flex flex-col">
                {esMedico ? (
                  <>
                    <Link to="/medico" onClick={cerrar} className={CLASE_ENLACE}>
                      <IconoCalendario className="h-5 w-5" />
                      Mis citas
                    </Link>
                    <Link to="/medico?tab=pacientes" onClick={cerrar} className={CLASE_ENLACE}>
                      <IconoPata className="h-5 w-5" />
                      Mis pacientes
                    </Link>
                    <Link to="/medico/perfil?tab=disponibilidad" onClick={cerrar} className={CLASE_ENLACE}>
                      <IconoReloj className="h-5 w-5" />
                      Mi horario
                    </Link>
                    <Link to="/medico/perfil" onClick={cerrar} className={CLASE_ENLACE}>
                      <IconoPersona className="h-5 w-5" />
                      Mi perfil
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/#servicios" onClick={cerrar} className={CLASE_ENLACE}>
                      Servicios
                    </Link>
                    <Link to="/#sedes" onClick={cerrar} className={CLASE_ENLACE}>
                      Sedes
                    </Link>
                    <Link to="/#horarios" onClick={cerrar} className={CLASE_ENLACE}>
                      Horarios
                    </Link>
                  </>
                )}
              </nav>

              <div className="mt-2 flex flex-col border-t border-white/15 pt-2">
                {!estaAutenticado ? (
                  <>
                    <Link to="/iniciar-sesion" onClick={cerrar} className={CLASE_ENLACE}>
                      <IconoPersona className="h-5 w-5" />
                      Iniciar sesión
                    </Link>
                    <Link to="/registrarse" onClick={cerrar} className={CLASE_ENLACE}>
                      Crear cuenta
                    </Link>
                  </>
                ) : (
                  <>
                    {esCliente && (
                      <>
                        <Link to="/panel?tab=citas" onClick={cerrar} className={CLASE_ENLACE}>
                          <IconoCalendario className="h-5 w-5" />
                          Mis citas
                        </Link>
                        <Link to="/panel?tab=mascotas" onClick={cerrar} className={CLASE_ENLACE}>
                          <IconoPata className="h-5 w-5" />
                          Mis mascotas
                        </Link>
                        <Link to="/panel/perfil" onClick={cerrar} className={CLASE_ENLACE}>
                          <IconoPersona className="h-5 w-5" />
                          Mi perfil
                        </Link>
                      </>
                    )}
                    {!esCliente && !esMedico && (
                      <Link to={rutaPanelPorRol(rol)} onClick={cerrar} className={CLASE_ENLACE}>
                        <IconoInicio className="h-5 w-5" />
                        Ir al panel
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        cerrar();
                        onSalir();
                      }}
                      className={`${CLASE_ENLACE} text-left`}
                    >
                      <IconoSalir className="h-5 w-5 text-red-300" />
                      Cerrar sesión
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
