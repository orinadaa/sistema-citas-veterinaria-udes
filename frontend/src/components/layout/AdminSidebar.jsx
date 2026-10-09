// components/layout/AdminSidebar.jsx
// Sidebar fijo del panel administrativo, con la identidad de marca real
// de la clinica (ver identidadmarca/): mismo degradado de marca que el
// Hero del landing y las pantallas de login/registro (bg-gradient-to-b
// from-brand-blue-500 to-brand-blue-800, ver Hero.jsx/AuthLayout.jsx),
// logo completo a color (logocolor.png) expandido y el isotipo corto
// (logocorto.png) colapsado. El rol veterinario usa el mismo sidebar
// (sin "variante navy": decision de la usuaria) con su propio set de
// items (ITEMS_MEDICO).
//
// Material: vidrio que desenfoca el fondo. Contraido queda como una pildora
// flotante (igual que la pildora de la topbar del cliente, en vertical),
// mas corta que la ventana y centrada en el eje vertical; "Cerrar sesión"
// queda abajo del todo dentro de la pildora.
//
// Se puede expandir/contraer (solo iconos); el estado se recuerda entre
// sesiones. El ancho es fijo dentro de cada estado (no cambia con el
// contenido de la pagina): lo controla PanelAdminPage con un layout de
// alto completo (h-screen) donde solo el <main> hace scroll.
import { useState } from 'react';
import {
  IconoCalendario,
  IconoJeringa,
  IconoMedicos,
  IconoSede,
  IconoPersona,
  IconoGrafica,
  IconoInicio,
  IconoGlobo,
  IconoCatalogo,
  IconoBaseDatos,
  IconoFlechaDerecha,
  IconoSalir,
} from '../icons';
import { useAuth, CLAVE_ALMACENAMIENTO } from '../../context/AuthContext';
import logoColor from '../../assets/logocolor.png';
import logoCorto from '../../assets/logocorto.png';

// Administrador de sede: el dia a dia de SU sede.
const ITEMS_NAV = [
  { id: 'inicio', etiqueta: 'Inicio', icono: IconoInicio },
  { id: 'citas', etiqueta: 'Citas', icono: IconoCalendario },
  { id: 'medicos', etiqueta: 'Médicos', icono: IconoMedicos },
  { id: 'pacientes', etiqueta: 'Pacientes', icono: IconoPersona },
  { id: 'servicios', etiqueta: 'Servicios', icono: IconoJeringa },
  { id: 'horarios', etiqueta: 'Horario', icono: IconoSede },
  { id: 'reportes', etiqueta: 'Reportes', icono: IconoGrafica },
];

// Superadministrador: configura el sistema completo (no opera citas).
const ITEMS_SUPER = [
  { id: 'inicio', etiqueta: 'Inicio', icono: IconoInicio },
  { id: 'sedes', etiqueta: 'Sedes', icono: IconoSede },
  { id: 'usuarios', etiqueta: 'Usuarios', icono: IconoMedicos },
  { id: 'servicios', etiqueta: 'Servicios', icono: IconoJeringa },
  { id: 'web', etiqueta: 'Página web', icono: IconoGlobo },
  { id: 'catalogos', etiqueta: 'Catálogos', icono: IconoCatalogo },
  { id: 'datos', etiqueta: 'Datos', icono: IconoBaseDatos },
  { id: 'reportes', etiqueta: 'Reportes', icono: IconoGrafica },
];

const CLAVE_COLAPSADO = 'udes_veterinaria_sidebar_colapsado';
const ANCHO_EXPANDIDO = '244px';
const ANCHO_COLAPSADO = '76px';

function leerColapsadoGuardado() {
  try {
    return localStorage.getItem(CLAVE_COLAPSADO) === 'true';
  } catch {
    return false;
  }
}

export function AdminSidebar({ activo, onCambiar }) {
  const { usuario } = useAuth();
  const [colapsado, setColapsado] = useState(leerColapsadoGuardado);
  const items = usuario?.rol === 'superadministrador' ? ITEMS_SUPER : ITEMS_NAV;

  function alternarColapsado() {
    setColapsado((anterior) => {
      const nuevo = !anterior;
      try {
        localStorage.setItem(CLAVE_COLAPSADO, String(nuevo));
      } catch {
        // localStorage no disponible (modo privado, etc.): el estado
        // sigue funcionando en memoria, solo no se recuerda al recargar.
      }
      return nuevo;
    });
  }

  // Igual que el "Cerrar sesión" de la barra superior (AdminHeader): se
  // limpia la sesion y se recarga, sin render intermedio sobre /admin.
  function salir() {
    localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    window.location.href = '/';
  }

  return (
    <aside
      className={`vidrio hidden max-h-full shrink-0 flex-col overflow-y-auto transition-[width,border-radius] duration-200 lg:flex ${
        colapsado ? 'h-[95%] self-center rounded-[38px] py-4' : 'h-full rounded-superficie py-6'
      }`}
      style={{ width: colapsado ? ANCHO_COLAPSADO : ANCHO_EXPANDIDO }}
    >
      <div className={`flex items-center px-4 ${colapsado ? 'justify-center' : 'justify-end'}`}>
        <button
          type="button"
          onClick={alternarColapsado}
          title={colapsado ? 'Expandir menú' : 'Contraer menú'}
          className="flex h-8 w-8 shrink-0 items-center justify-center boton-texto rounded-boton text-white/70 transition hover:text-white"
        >
          <IconoFlechaDerecha className={`h-4 w-4 transition-transform duration-200 ${colapsado ? '' : 'rotate-180'}`} />
        </button>
      </div>

      <div className={`mt-4 flex items-center px-4 ${colapsado ? 'justify-center px-0' : ''}`}>
        {colapsado ? (
          <img src={logoCorto} alt="Clínica Veterinaria UDES" className="h-10 w-10 object-contain" />
        ) : (
          <img src={logoColor} alt="Clínica Veterinaria UDES" className="h-auto w-full max-w-[200px] object-contain" />
        )}
      </div>

      <nav className={`flex flex-1 flex-col gap-1 px-4 ${colapsado ? 'mt-5' : 'mt-8'}`}>
        {items.map((item) => {
          const Icono = item.icono;
          const esActivo = activo === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onCambiar(item.id)}
              title={colapsado ? item.etiqueta : undefined}
              className={`flex items-center gap-3 text-sm font-medium transition ${
                colapsado ? 'h-11 w-11 justify-center rounded-full' : 'rounded-boton px-4 py-2.5'
              } ${esActivo ? 'bg-brand-amber text-brand-navy' : 'hover-texto-ilumina text-white/80 hover:bg-white/15 hover:text-white'}`}
            >
              <Icono className="h-5 w-5 shrink-0" />
              {!colapsado && item.etiqueta}
            </button>
          );
        })}
      </nav>

      {/* Cerrar sesion, al fondo del menu (pedido de Oriana): solo el icono y
          el texto en rojo, sin contenedor. Con el menu contraido, al pasar el
          cursor o enfocarlo queda un circulo rojo con el icono blanco. */}
      <div className={`px-4 ${colapsado ? 'mt-5' : 'mt-6'}`}>
        <button
          type="button"
          onClick={salir}
          title={colapsado ? 'Cerrar sesión' : undefined}
          aria-label="Cerrar sesión"
          className={`flex items-center gap-3 text-sm font-bold text-red-400 transition ${
            colapsado
              ? 'h-11 w-11 justify-center rounded-full hover:bg-red-600 hover:text-white focus-visible:bg-red-600 focus-visible:text-white'
              : 'boton-texto w-full rounded-boton px-4 py-2.5'
          }`}
        >
          <IconoSalir className="h-5 w-5 shrink-0" />
          {!colapsado && 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  );
}
