// components/layout/AdminHeader.jsx
// Barra superior del panel administrativo: buscador global +
// notificaciones + avatar/nombre/rol. Las notificaciones siguen siendo
// un placeholder visual (no hay backend de notificaciones en este
// incremento). El buscador si es funcional: busca en Servicios,
// Médicos y Pacientes (las 3 listas administrables con filtro de
// nombre); al elegir un resultado cambia a esa pestaña del sidebar y
// precarga el filtro de esa pantalla con el termino buscado. Solo
// disponible para el rol administrador — el veterinario no tiene
// ninguna de esas 3 pantallas en su sidebar.
import { useEffect, useRef, useState } from 'react';
import { IconoBuscar, IconoCampana, IconoChevronAbajo, IconoJeringa, IconoMedicos, IconoPersona } from '../icons';
import { useAuth } from '../../context/AuthContext';
import { obtenerServiciosAdmin, obtenerMedicosAdmin, obtenerPacientes } from '../../api/client';

const ETIQUETA_ROL = { administrador: 'Administrador', veterinario: 'Médico Veterinario' };
const RESULTADOS_VACIOS = { pacientes: [], medicos: [], servicios: [] };

export function AdminHeader({ onNavegar }) {
  const { usuario, token, cerrarSesion } = useAuth();
  const esAdmin = usuario?.rol === 'administrador';

  function salir() {
    // Redireccion "dura" (no navegar() de react-router): /admin esta
    // protegido por ProtectedRoute, que reacciona al cambio de
    // estaAutenticado -- por mas que se reordenen las llamadas,
    // ProtectedRoute puede llegar a evaluarse con la ruta /admin todavia
    // activa y redirigir el solo a /iniciar-sesion?next=%2Fadmin,
    // pisando cualquier navegacion interna de la SPA. Una recarga
    // completa a "/" evita el problema de raiz.
    cerrarSesion();
    window.location.href = '/';
  }

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [termino, setTermino] = useState('');
  const [resultados, setResultados] = useState(RESULTADOS_VACIOS);
  const [buscando, setBuscando] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const contenedorRef = useRef(null);

  const iniciales = usuario?.nombreCompleto
    ?.split(' ')
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    if (!esAdmin) return undefined;
    const terminoLimpio = termino.trim();
    if (terminoLimpio.length < 2) {
      setResultados(RESULTADOS_VACIOS);
      setBuscando(false);
      return undefined;
    }

    setBuscando(true);
    const temporizador = setTimeout(async () => {
      const coincide = (texto) => texto?.toLowerCase().includes(terminoLimpio.toLowerCase());
      const [servicios, medicos, pacientes] = await Promise.all([
        obtenerServiciosAdmin(token),
        obtenerMedicosAdmin(token),
        obtenerPacientes({}, token),
      ]);
      setResultados({
        servicios: servicios.servicios.filter((s) => coincide(s.nombre)).slice(0, 4),
        medicos: medicos.medicos.filter((m) => coincide(m.nombre_completo)).slice(0, 4),
        pacientes: pacientes.pacientes.filter((p) => coincide(p.nombre_completo)).slice(0, 4),
      });
      setBuscando(false);
    }, 300);

    return () => clearTimeout(temporizador);
  }, [termino, token, esAdmin]);

  useEffect(() => {
    function alHacerClicFuera(evento) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setDropdownAbierto(false);
      }
    }
    document.addEventListener('mousedown', alHacerClicFuera);
    return () => document.removeEventListener('mousedown', alHacerClicFuera);
  }, []);

  function seleccionarResultado(pestana, texto) {
    onNavegar?.(pestana, texto);
    setTermino('');
    setResultados(RESULTADOS_VACIOS);
    setDropdownAbierto(false);
  }

  const terminoValido = termino.trim().length >= 2;
  const hayResultados = resultados.pacientes.length + resultados.medicos.length + resultados.servicios.length > 0;

  return (
    <header
      className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6"
      style={{ height: '76px' }}
    >
      <div ref={contenedorRef} className="relative max-w-md flex-1">
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-slate-400">
          <IconoBuscar className="h-4 w-4 shrink-0" />
          <input
            type="search"
            value={termino}
            onChange={(evento) => {
              setTermino(evento.target.value);
              setDropdownAbierto(true);
            }}
            onFocus={() => setDropdownAbierto(true)}
            disabled={!esAdmin}
            placeholder={esAdmin ? 'Buscar paciente, médico o servicio...' : 'Búsqueda disponible para administrador'}
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
          />
        </div>

        {esAdmin && dropdownAbierto && terminoValido && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-200">
            {buscando && <p className="px-3 py-2 text-sm text-slate-400">Buscando...</p>}

            {!buscando && !hayResultados && (
              <p className="px-3 py-2 text-sm text-slate-400">Sin resultados para &quot;{termino.trim()}&quot;.</p>
            )}

            {!buscando && resultados.pacientes.length > 0 && (
              <div className="mb-1">
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Pacientes</p>
                {resultados.pacientes.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => seleccionarResultado('pacientes', p.nombre_completo)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <IconoPersona className="h-4 w-4 shrink-0 text-brand-blue" />
                    {p.nombre_completo}
                  </button>
                ))}
              </div>
            )}

            {!buscando && resultados.medicos.length > 0 && (
              <div className="mb-1">
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Médicos</p>
                {resultados.medicos.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => seleccionarResultado('medicos', m.nombre_completo)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <IconoMedicos className="h-4 w-4 shrink-0 text-brand-blue" />
                    {m.nombre_completo}
                  </button>
                ))}
              </div>
            )}

            {!buscando && resultados.servicios.length > 0 && (
              <div>
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Servicios</p>
                {resultados.servicios.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => seleccionarResultado('servicios', s.nombre)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <IconoJeringa className="h-4 w-4 shrink-0 text-brand-blue" />
                    {s.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
                onClick={salir}
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
