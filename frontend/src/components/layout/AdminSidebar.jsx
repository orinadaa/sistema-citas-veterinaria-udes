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
  IconoPata,
  IconoGrafica,
  IconoEngranaje,
  IconoFlechaDerecha,
} from '../icons';
import { useAuth } from '../../context/AuthContext';
import logoColor from '../../assets/logocolor.png';
import logoCorto from '../../assets/logocorto.png';

const ITEMS_NAV = [
  { id: 'citas', etiqueta: 'Citas', icono: IconoCalendario },
  { id: 'servicios', etiqueta: 'Servicios', icono: IconoJeringa },
  { id: 'medicos', etiqueta: 'Médicos', icono: IconoMedicos },
  { id: 'pacientes', etiqueta: 'Pacientes', icono: IconoPersona },
  { id: 'horarios', etiqueta: 'Sedes y horarios', icono: IconoSede },
  { id: 'reportes', etiqueta: 'Reportes', icono: IconoGrafica },
  { id: 'configuracion', etiqueta: 'Configuración', icono: IconoEngranaje },
];

// Panel propio del medico veterinario.
const ITEMS_MEDICO = [
  { id: 'citas', etiqueta: 'Mis citas', icono: IconoCalendario },
  { id: 'pacientes', etiqueta: 'Mis pacientes', icono: IconoPata },
  { id: 'perfil', etiqueta: 'Mi perfil', icono: IconoPersona },
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
  const items = usuario?.rol === 'administrador' ? ITEMS_NAV : ITEMS_MEDICO;

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

  return (
    <aside
      className="vidrio hidden h-full shrink-0 flex-col overflow-y-auto rounded-superficie py-6 transition-[width] duration-200 lg:flex"
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

      <nav className="mt-8 flex flex-1 flex-col gap-1 px-4">
        {items.map((item) => {
          const Icono = item.icono;
          const esActivo = activo === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onCambiar(item.id)}
              title={colapsado ? item.etiqueta : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                colapsado ? 'justify-center px-0' : ''
              } ${esActivo ? 'bg-brand-amber text-brand-navy' : 'hover-texto-ilumina text-white/80 hover:bg-white/15 hover:text-white'}`}
            >
              <Icono className="h-5 w-5 shrink-0" />
              {!colapsado && item.etiqueta}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
