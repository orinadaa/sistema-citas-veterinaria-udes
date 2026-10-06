// components/medico/PanelMisPacientesMedico.jsx
// "Mis pacientes" del medico: dueños y mascotas que ha atendido o que
// tienen cita con el (una fila por mascota). Sin "+ Agregar paciente":
// el medico no crea cuentas de cliente (decision de la usuaria); solo
// agrega mascotas a un paciente existente desde su detalle.
// - KPIs reales (sobre todos sus pacientes, no dependen de filtros).
// - Filtros: busqueda (dueño o mascota), sede de las citas, estado del
//   dueño y "Limpiar filtros".
// - "Agendar" en la columna de proxima cita abre el panel de agendar con
//   ese dueño ya elegido.
import { useEffect, useRef, useState } from 'react';
import { obtenerPacientesMedico, obtenerSedes } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaCorta, formatearHora } from '../../utils/fecha';
import { iniciales } from '../../utils/texto';
import { PageHeader } from '../ui/PageHeader';
import { KPICard } from '../ui/KPICard';
import { DataTable } from '../ui/DataTable';
import { EstadoError } from '../ui/EstadoError';
import { AvatarMascota } from '../cliente/AvatarMascota';
import { DetallePacienteMedicoPanel } from './DetallePacienteMedicoPanel';
import { AgendarCitaMedicoPanel } from './AgendarCitaMedicoPanel';
import { CrearRecordatorioPanel } from './CrearRecordatorioPanel';
import { IconoBuscar, IconoCalendario, IconoCampana, IconoCorazon, IconoPata, IconoPersona, IconoPuntos } from '../icons';

const CLASE_FILTRO =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30';

function MenuFila({ opciones }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    function alHacerClic(evento) {
      if (contenedor.current && !contenedor.current.contains(evento.target)) setAbierto(false);
    }
    document.addEventListener('mousedown', alHacerClic);
    return () => document.removeEventListener('mousedown', alHacerClic);
  }, [abierto]);

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        aria-label="Más acciones"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className="rounded-boton p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <IconoPuntos className="h-5 w-5" />
      </button>
      {abierto && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-lg bg-white py-1 text-left shadow-lg ring-1 ring-slate-200">
          {opciones.map((opcion) => (
            <button
              key={opcion.etiqueta}
              type="button"
              onClick={() => {
                setAbierto(false);
                opcion.onClick();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <opcion.icono className="h-4 w-4" />
              {opcion.etiqueta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PanelMisPacientesMedico({ busquedaInicial = '' }) {
  const { token } = useAuth();
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [sedeId, setSedeId] = useState('');
  const [estado, setEstado] = useState('todos');
  const [sedes, setSedes] = useState([]);
  const [resultado, setResultado] = useState({ clave: null, pacientes: [], kpis: null, error: '' });
  const [intento, setIntento] = useState(0);

  const [clienteDetalleId, setClienteDetalleId] = useState(null);
  const [agendarPara, setAgendarPara] = useState(null); // dueño preseleccionado
  const [recordatorioPara, setRecordatorioPara] = useState(null); // { mascota, dueno }

  // Menu ⋮ de cada mascota en el detalle del paciente.
  const accionesMascota = [
    {
      etiqueta: 'Crear recordatorio',
      icono: IconoCampana,
      onClick: (mascota, cliente) => setRecordatorioPara({ mascota, dueno: cliente.nombre_completo }),
    },
  ];

  useEffect(() => {
    obtenerSedes()
      .then((datos) => setSedes(datos.sedes))
      .catch(() => setSedes([]));
  }, []);

  // Consulta con pausa de 300 ms al escribir; `clave` descarta respuestas viejas.
  const termino = busqueda.trim();
  const clave = `${termino}|${sedeId}|${intento}`;
  useEffect(() => {
    let vigente = true;
    const temporizador = setTimeout(() => {
      obtenerPacientesMedico({ busqueda: termino, sedeId }, token)
        .then((datos) => vigente && setResultado({ clave, pacientes: datos.pacientes, kpis: datos.kpis, error: '' }))
        .catch((err) => vigente && setResultado((r) => ({ ...r, clave, error: err.message || 'No se pudieron cargar tus pacientes.' })));
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [clave, termino, sedeId, token]);

  const cargando = resultado.clave !== clave && !resultado.kpis;
  const filas = resultado.pacientes
    .filter((p) => estado === 'todos' || (estado === 'activo' ? p.cliente_activo : !p.cliente_activo))
    .map((p) => ({ ...p, id: `${p.cliente_id}-${p.mascota_id}` }));
  const hayFiltros = termino || sedeId || estado !== 'todos';
  const kpis = resultado.kpis;
  const panelAbierto = Boolean(clienteDetalleId) || Boolean(agendarPara) || Boolean(recordatorioPara);

  function agendarCon(p) {
    setAgendarPara({ id: p.cliente_id, nombre_completo: p.cliente_nombre, correo: p.cliente_correo, telefono: p.cliente_telefono });
  }

  return (
    <>
      <div className="flex flex-col gap-6" inert={panelAbierto} aria-hidden={panelAbierto}>
        <PageHeader
          title="Mis pacientes"
          subtitle="Consulta la información de los dueños y mascotas que has atendido o tienen citas contigo."
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard icon={IconoPersona} color="blue" value={kpis?.pacientes ?? '—'} label="Pacientes en total" />
          <KPICard icon={IconoCalendario} color="green" value={kpis?.conCitasProximas ?? '—'} label="Con citas próximas" />
          <KPICard icon={IconoCorazon} color="amber" value={kpis?.frecuentes ?? '—'} label="Pacientes frecuentes" />
          <KPICard icon={IconoPata} color="purple" value={kpis?.mascotas ?? '—'} label="Mascotas en total" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar dueño o mascota..."
              className={`${CLASE_FILTRO} w-full pl-9`}
            />
          </div>
          <select aria-label="Sede" value={sedeId} onChange={(e) => setSedeId(e.target.value)} className={CLASE_FILTRO}>
            <option value="">Todas las sedes</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.ciudad}
              </option>
            ))}
          </select>
          <select aria-label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} className={CLASE_FILTRO}>
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          {hayFiltros && (
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setSedeId('');
                setEstado('todos');
              }}
              className="text-sm font-semibold text-brand-blue hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {resultado.error ? (
          <EstadoError mensaje={resultado.error} onReintentar={() => setIntento((n) => n + 1)} />
        ) : cargando ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((k) => (
              <div key={k} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <DataTable
            filaVacia={hayFiltros ? 'No hay pacientes que coincidan con los filtros.' : 'Todavía no tienes pacientes.'}
            rows={filas}
            columns={[
              {
                header: 'Dueño',
                render: (p) => (
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
                      {iniciales(p.cliente_nombre)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{p.cliente_nombre}</p>
                      <p className="truncate text-xs text-slate-400">{[p.cliente_correo, p.cliente_telefono].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                ),
              },
              {
                header: 'Mascota',
                render: (p) => (
                  <div className="flex items-center gap-2.5">
                    <AvatarMascota mascota={{ nombre: p.mascota_nombre, foto_url: p.mascota_foto_url }} className="h-9 w-9" iconoClassName="h-4 w-4" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{p.mascota_nombre}</p>
                      <p className="truncate text-xs text-slate-400">{[p.mascota_especie, p.mascota_raza].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                ),
              },
              {
                header: 'Última cita',
                render: (p) => (p.ultima_cita ? formatearFechaCorta(p.ultima_cita) : <span className="text-slate-400">—</span>),
              },
              {
                header: 'Próxima cita',
                render: (p) =>
                  p.proxima_cita ? (
                    <div>
                      <p className="text-slate-800">{formatearFechaCorta(p.proxima_cita)}</p>
                      <p className="text-xs text-slate-400">{formatearHora(p.proxima_cita)}</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => agendarCon(p)}
                      className="rounded-boton border border-brand-blue px-2.5 py-1 text-xs font-semibold text-brand-blue transition hover:bg-blue-50"
                    >
                      Agendar
                    </button>
                  ),
              },
              {
                header: 'Estado',
                render: (p) => (
                  <span className={`inline-flex items-center gap-1.5 text-sm ${p.cliente_activo ? 'text-brand-green' : 'text-slate-400'}`}>
                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${p.cliente_activo ? 'bg-brand-green' : 'bg-slate-300'}`} />
                    {p.cliente_activo ? 'Activo' : 'Inactivo'}
                  </span>
                ),
              },
            ]}
            actions={(p) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setClienteDetalleId(p.cliente_id)}
                  className="rounded-boton border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Ver detalles
                </button>
                <MenuFila opciones={[{ etiqueta: 'Agendar cita', icono: IconoCalendario, onClick: () => agendarCon(p) }]} />
              </div>
            )}
          />
        )}
      </div>

      <DetallePacienteMedicoPanel
        clienteId={clienteDetalleId}
        onClose={() => setClienteDetalleId(null)}
        onCambio={() => setIntento((n) => n + 1)}
        accionesMascota={accionesMascota}
      />
      {/* Encima del detalle del paciente; "Ver perfil" vuelve a el. */}
      <CrearRecordatorioPanel
        mascota={recordatorioPara?.mascota ?? null}
        nombreDueno={recordatorioPara?.dueno}
        onClose={() => setRecordatorioPara(null)}
        onVerPerfil={() => setRecordatorioPara(null)}
      />
      <AgendarCitaMedicoPanel
        isOpen={Boolean(agendarPara)}
        pacienteInicial={agendarPara}
        onClose={() => setAgendarPara(null)}
        onAgendada={() => {
          setAgendarPara(null);
          setIntento((n) => n + 1);
        }}
      />
    </>
  );
}
