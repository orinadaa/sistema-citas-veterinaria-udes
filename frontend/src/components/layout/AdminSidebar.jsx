// components/layout/AdminSidebar.jsx
// Sidebar fijo del panel administrativo (variante clara, fondo #F5F5F7 -
// ver seccion 3 del sistema de diseno). La variante navy de rol medico
// no se construye todavia: no existe pantalla de calendario/dashboard
// para ese rol en ningun incremento planeado.
import { IconoCalendario, IconoJeringa, IconoMedicos, IconoSede, IconoPata } from '../icons';
import { useAuth } from '../../context/AuthContext';

const ITEMS_NAV = [
  { id: 'citas', etiqueta: 'Citas', icono: IconoCalendario },
  { id: 'servicios', etiqueta: 'Servicios', icono: IconoJeringa },
  { id: 'medicos', etiqueta: 'Médicos', icono: IconoMedicos },
  { id: 'horarios', etiqueta: 'Sedes y horarios', icono: IconoSede },
];

export function AdminSidebar({ activo, onCambiar }) {
  const { usuario } = useAuth();
  // El veterinario solo tiene acceso a su seguimiento de citas (RF-12);
  // el resto de secciones son exclusivas del administrador.
  const items = usuario?.rol === 'administrador' ? ITEMS_NAV : ITEMS_NAV.filter((item) => item.id === 'citas');

  return (
    <aside className="hidden shrink-0 flex-col bg-[#F5F5F7] px-4 py-6 lg:flex" style={{ width: '248px' }}>
      <div className="flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white">
          <IconoPata className="h-5 w-5" />
        </span>
        <span className="font-heading text-sm font-bold leading-tight text-brand-navy">
          CLÍNICA VETERINARIA
          <br />
          UDES
        </span>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const Icono = item.icono;
          const esActivo = activo === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onCambiar(item.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                esActivo ? 'bg-brand-amber text-brand-navy' : 'text-brand-navy/70 hover:bg-white'
              }`}
            >
              <Icono className="h-5 w-5" />
              {item.etiqueta}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl bg-white/70 px-4 py-4 text-center">
        <IconoPata className="mx-auto h-6 w-6 text-brand-blue" />
        <p className="mt-2 font-heading text-xs italic text-brand-blue">
          Juntos por una vida más saludable
        </p>
      </div>
    </aside>
  );
}
