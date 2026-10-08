// components/layout/AdminHeader.jsx
// Barra superior del panel administrativo: buscador global +
// notificaciones + avatar/nombre/rol. Las notificaciones siguen siendo
// un placeholder visual (no hay backend de notificaciones en este
// incremento). El buscador si es funcional: busca en Servicios,
// Médicos y Pacientes (las 3 listas administrables con filtro de
// nombre); al elegir un resultado cambia a esa pestaña del sidebar y
// precarga el filtro de esa pantalla con el termino buscado. Para el
// veterinario busca entre SUS pacientes (dueños y mascotas) y lleva a
// "Mis pacientes" con el termino precargado.
import { useEffect, useRef, useState } from 'react';
import { IconoBuscar, IconoCampana, IconoChevronAbajo, IconoJeringa, IconoMedicos, IconoPata, IconoPersona } from '../icons';
import { useAuth, CLAVE_ALMACENAMIENTO } from '../../context/AuthContext';
import { obtenerServiciosAdmin, obtenerMedicosAdmin, obtenerPacientes, obtenerPacientesMedico } from '../../api/client';

const ETIQUETA_ROL = { administrador: 'Administrador', veterinario: 'Médico Veterinario' };
const RESULTADOS_VACIOS = { pacientes: [], medicos: [], servicios: [], mascotas: [] };

export function AdminHeader({ onNavegar }) {
  const { usuario, token } = useAuth();
  const esAdmin = usuario?.rol === 'administrador';
  const esMedico = usuario?.rol === 'veterinario';
  const buscadorActivo = esAdmin || esMedico;

  function salir() {
    // No se llama cerrarSesion() (dispara un re-render vía React state):
    // /admin esta protegido por ProtectedRoute, que mostraba un flash de
    // /iniciar-sesion?next=%2Fadmin antes de que la recarga completa
    // tuviera efecto. Se limpia localStorage directamente y se recarga
    // -- la pagina nueva arranca ya sin sesion, sin ningun render
    // intermedio sobre /admin.
    localStorage.removeItem(CLAVE_ALMACENAMIENTO);
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
    if (!buscadorActivo) return undefined;
    const terminoLimpio = termino.trim();
    if (terminoLimpio.length < 2) {
      setResultados(RESULTADOS_VACIOS);
      setBuscando(false);
      return undefined;
    }

    setBuscando(true);
    const temporizador = setTimeout(async () => {
      const coincide = (texto) => texto?.toLowerCase().includes(terminoLimpio.toLowerCase());
      if (esMedico) {
        // Una fila por mascota: se separan dueños (sin repetir) y mascotas.
        const { pacientes: filas } = await obtenerPacientesMedico({ busqueda: terminoLimpio }, token).catch(() => ({ pacientes: [] }));
        const duenos = new Map();
        filas.filter((f) => coincide(f.cliente_nombre)).forEach((f) => duenos.set(f.cliente_id, { id: f.cliente_id, nombre_completo: f.cliente_nombre }));
        setResultados({
          ...RESULTADOS_VACIOS,
          pacientes: [...duenos.values()].slice(0, 4),
          mascotas: filas.filter((f) => coincide(f.mascota_nombre)).slice(0, 4),
        });
        setBuscando(false);
        return;
      }
      // Si una consulta falla, esa categoria queda vacia en vez de dejar
      // el buscador colgado en "Buscando...".
      const [servicios, medicos, pacientes] = await Promise.all([
        obtenerServiciosAdmin(token).catch(() => ({ servicios: [] })),
        obtenerMedicosAdmin(token).catch(() => ({ medicos: [] })),
        obtenerPacientes({}, token).catch(() => ({ pacientes: [] })),
      ]);
      // Se parte de RESULTADOS_VACIOS para que no falte ninguna categoria
      // (el admin no busca mascotas, pero el render lee resultados.mascotas).
      setResultados({
        ...RESULTADOS_VACIOS,
        servicios: servicios.servicios.filter((s) => coincide(s.nombre)).slice(0, 4),
        medicos: medicos.medicos.filter((m) => coincide(m.nombre_completo)).slice(0, 4),
        pacientes: pacientes.pacientes.filter((p) => coincide(p.nombre_completo)).slice(0, 4),
      });
      setBuscando(false);
    }, 300);

    return () => clearTimeout(temporizador);
  }, [termino, token, buscadorActivo, esMedico]);

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
  const hayResultados =
    resultados.pacientes.length + resultados.medicos.length + resultados.servicios.length + resultados.mascotas.length > 0;

  return (
    <header
      className="vidrio-blanco relative z-30 flex shrink-0 items-center justify-between rounded-superficie px-6"
      style={{ height: '68px' }}
    >
      <div ref={contenedorRef} className="relative max-w-md flex-1">
        <div className="flex items-center gap-2 rounded-boton bg-white/70 px-4 py-2 text-slate-500 ring-1 ring-slate-900/10">
          <IconoBuscar className="h-4 w-4 shrink-0" />
          <input
            type="search"
            value={termino}
            onChange={(evento) => {
              setTermino(evento.target.value);
              setDropdownAbierto(true);
            }}
            onFocus={() => setDropdownAbierto(true)}
            disabled={!buscadorActivo}
            placeholder={esMedico ? 'Buscar paciente o mascota...' : 'Buscar paciente, médico o servicio...'}
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
          />
        </div>

        {buscadorActivo && dropdownAbierto && terminoValido && (
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

            {!buscando && resultados.mascotas.length > 0 && (
              <div className="mb-1">
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Mascotas</p>
                {resultados.mascotas.map((m) => (
                  <button
                    key={m.mascota_id}
                    type="button"
                    onClick={() => seleccionarResultado('pacientes', m.mascota_nombre)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <IconoPata className="h-4 w-4 shrink-0 text-brand-blue" />
                    {m.mascota_nombre}
                    <span className="truncate text-xs text-slate-400">· {m.cliente_nombre}</span>
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
        {/* Campana: adorno hasta que exista el modulo de notificaciones. No
            es un boton (no hace nada): no reacciona al mouse ni recibe foco. */}
        <span aria-hidden="true" className="relative p-2 text-slate-500">
          <IconoCampana className="h-5 w-5" />
        </span>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            className="boton-texto flex items-center gap-2 rounded-xl px-2 py-1.5 transition"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
              {iniciales || '·'}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium text-slate-800">{usuario?.nombreCompleto}</span>
              <span className="block text-xs text-slate-600">{ETIQUETA_ROL[usuario?.rol] ?? usuario?.rol}</span>
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
