// components/layout/AdminHeader.jsx
// Barra superior del panel administrativo: buscador + notificaciones +
// avatar/nombre/rol. La busqueda y las notificaciones son placeholders
// visuales por ahora (no hay backend de busqueda global ni de
// notificaciones en este incremento).
import { useState } from 'react';
import { IconoBuscar, IconoCampana, IconoChevronAbajo } from '../icons';
import { useAuth } from '../../context/AuthContext';

const ETIQUETA_ROL = { administrador: 'Administrador', veterinario: 'Médico Veterinario' };

export function AdminHeader() {
  const { usuario, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const iniciales = usuario?.nombreCompleto
    ?.split(' ')
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6" style={{ height: '76px' }}>
      <div className="flex max-w-md flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-slate-400">
        <IconoBuscar className="h-4 w-4 shrink-0" />
        <input
          type="search"
          placeholder="Buscar paciente, cita o servicio..."
          className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <button type="button" className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100">
          <IconoCampana className="h-5 w-5" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
              {iniciales || '·'}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium text-slate-800">{usuario?.nombreCompleto}</span>
              <span className="block text-xs text-slate-400">{ETIQUETA_ROL[usuario?.rol] ?? usuario?.rol}</span>
            </span>
            <IconoChevronAbajo className="h-4 w-4 text-slate-400" />
          </button>

          {menuAbierto && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white py-1.5 shadow-lg ring-1 ring-slate-200">
              <button
                type="button"
                onClick={cerrarSesion}
                className="w-full px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
