// components/medico/PanelMisPacientesMedico.jsx
// Presentacion vetUI, igual que la vista del cliente: va directo sobre el fondo
// de marca, con indicadores en TarjetaDato, el filtro de estado en Chips con
// conteo real y una tarjeta de vidrio blanco por mascota (como "Mis citas" del
// cliente) en vez de una tabla.
// "Mis pacientes" del medico: dueños y mascotas que ha atendido o que
// tienen cita con el (una fila por mascota). Sin "+ Agregar paciente":
// el medico no crea cuentas de cliente (decision de la usuaria); solo
// agrega mascotas a un paciente existente desde su detalle.
// - KPIs reales (sobre todos sus pacientes, no dependen de filtros).
// - Filtros: busqueda (dueño o mascota), sede de las citas, estado del
//   dueño y "Limpiar filtros".
// - "Agendar" en la columna de proxima cita abre el panel de agendar con
//   ese dueño ya elegido.
import { useEffect, useState } from 'react';
import { obtenerPacientesMedico, obtenerSedes } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaCorta, formatearHora } from '../../utils/fecha';
import { Boton, Chips, EstadoError, EstadoVacio, Esqueleto, Insignia, Tarjeta, TarjetaDato } from '../vetui';
import { AvatarMascota } from '../cliente/AvatarMascota';
import { DetallePacienteMedicoPanel } from './DetallePacienteMedicoPanel';
import { AgendarCitaMedicoPanel } from './AgendarCitaMedicoPanel';
import { CrearRecordatorioPanel } from './CrearRecordatorioPanel';
import { IconoCalendario, IconoCampana, IconoCorazon, IconoPata, IconoPersona } from '../icons';
import { Desplegable } from '../form/Desplegable';
import { CampoBusqueda } from '../form/CampoBusqueda';

const CLASE_FILTRO =
  'campo px-3 py-2 text-sm';

// Cuantas tarjetas se muestran de entrada y cuantas agrega "Ver más".
const POR_TANDA = 8;

export function PanelMisPacientesMedico({ busquedaInicial = '' }) {
  const { token } = useAuth();
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [sedeId, setSedeId] = useState('');
  const [estado, setEstado] = useState('todos');
  const [visibles, setVisibles] = useState(POR_TANDA);
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
  // Filtro de estado como botones con conteo real (pocas opciones fijas).
  const todos = resultado.pacientes;
  const ESTADOS = [
    { id: 'todos', etiqueta: 'Todos', conteo: todos.length },
    { id: 'activo', etiqueta: 'Activos', conteo: todos.filter((x) => x.cliente_activo).length },
    { id: 'inactivo', etiqueta: 'Inactivos', conteo: todos.filter((x) => !x.cliente_activo).length },
  ];
  // Al cambiar un filtro se vuelve a la primera tanda (ajuste durante el render).
  const claveFiltros = `${termino}|${sedeId}|${estado}`;
  const [filtrosVistos, setFiltrosVistos] = useState(claveFiltros);
  if (claveFiltros !== filtrosVistos) {
    setFiltrosVistos(claveFiltros);
    setVisibles(POR_TANDA);
  }
  const kpis = resultado.kpis;
  const panelAbierto = Boolean(clienteDetalleId) || Boolean(agendarPara) || Boolean(recordatorioPara);

  function agendarCon(p) {
    setAgendarPara({ id: p.cliente_id, nombre_completo: p.cliente_nombre, correo: p.cliente_correo, telefono: p.cliente_telefono });
  }

  return (
    <>
      <div className="flex flex-col gap-6" inert={panelAbierto} aria-hidden={panelAbierto}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <TarjetaDato icono={IconoPersona} tono="azul" valor={kpis?.pacientes ?? '—'} etiqueta="Pacientes en total" />
          <TarjetaDato icono={IconoCalendario} tono="verde" valor={kpis?.conCitasProximas ?? '—'} etiqueta="Con citas próximas" />
          <TarjetaDato icono={IconoCorazon} tono="ambar" valor={kpis?.frecuentes ?? '—'} etiqueta="Pacientes frecuentes" />
          <TarjetaDato icono={IconoPata} tono="rosa" valor={kpis?.mascotas ?? '—'} etiqueta="Mascotas en total" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">Mis pacientes</h2>
          <p className="mt-1 text-sm text-blue-50">Dueños y mascotas que has atendido o que tienen cita contigo.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Chips items={ESTADOS} activo={estado} onCambiar={setEstado} />
          <CampoBusqueda
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar dueño o mascota..."
            className="min-w-[220px] flex-1"
          />
          <Desplegable aria-label="Sede" value={sedeId} onChange={(e) => setSedeId(e.target.value)} className={CLASE_FILTRO}>
            <option value="">Todas las sedes</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.ciudad}
              </option>
            ))}
          </Desplegable>
          {hayFiltros && (
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setSedeId('');
                setEstado('todos');
              }}
              className="boton-texto rounded-boton px-2 py-1 text-sm font-semibold text-white transition"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {resultado.error ? (
          <EstadoError mensaje={resultado.error} onReintentar={() => setIntento((n) => n + 1)} />
        ) : cargando ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((k) => (
              <Esqueleto key={k} className="h-28" />
            ))}
          </div>
        ) : filas.length === 0 ? (
          <EstadoVacio>{hayFiltros ? 'No hay pacientes que coincidan con los filtros.' : 'Todavía no tienes pacientes.'}</EstadoVacio>
        ) : (
          <>
            {/* Una tarjeta por mascota, como las citas del cliente. */}
            <div className="flex flex-col gap-3">
              {filas.slice(0, visibles).map((paciente) => (
                <Tarjeta
                  key={paciente.id}
                  material="blanco"
                  className="grid grid-cols-1 items-center gap-4 p-4 md:grid-cols-[9rem_minmax(0,1.2fr)_minmax(0,1fr)_auto] md:gap-5"
                >
                  {/* 1. Mascota */}
                  <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                    <AvatarMascota
                      mascota={{ nombre: paciente.mascota_nombre, foto_url: paciente.mascota_foto_url }}
                      className="h-20 w-20 shadow-md ring-4 ring-white"
                      iconoClassName="h-9 w-9"
                    />
                    <div className="min-w-0 max-w-full">
                      <p className="truncate font-semibold text-slate-900">{paciente.mascota_nombre}</p>
                      <p className="line-clamp-2 text-sm text-slate-700">{[paciente.mascota_especie, paciente.mascota_raza].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>

                  {/* 2. Dueño */}
                  <div className="flex min-w-0 items-start gap-2.5">
                    <IconoPersona className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue-700" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{paciente.cliente_nombre}</p>
                      {paciente.cliente_correo && <p className="truncate text-sm text-slate-700">{paciente.cliente_correo}</p>}
                      {paciente.cliente_telefono && <p className="truncate text-sm text-slate-700">{paciente.cliente_telefono}</p>}
                    </div>
                  </div>

                  {/* 3. Citas */}
                  <div className="flex min-w-0 items-start gap-2.5">
                    <IconoCalendario className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue-700" />
                    <div className="min-w-0 text-sm text-slate-700">
                      <p>
                        Próxima:{' '}
                        <span className="font-semibold text-slate-900">
                          {paciente.proxima_cita ? `${formatearFechaCorta(paciente.proxima_cita)}, ${formatearHora(paciente.proxima_cita)}` : 'sin agendar'}
                        </span>
                      </p>
                      <p>
                        Última: <span className="font-semibold text-slate-900">{paciente.ultima_cita ? formatearFechaCorta(paciente.ultima_cita) : '—'}</span>
                      </p>
                    </div>
                  </div>

                  {/* 4. Estado y acciones */}
                  <div className="flex flex-row flex-wrap items-center gap-2 md:flex-col md:items-end">
                    <Insignia tono={paciente.cliente_activo ? 'verde' : 'gris'}>{paciente.cliente_activo ? 'Activo' : 'Inactivo'}</Insignia>
                    <Boton variante="contorno" tamano="sm" onClick={() => setClienteDetalleId(paciente.cliente_id)}>
                      Ver detalles
                    </Boton>
                    <button
                      type="button"
                      onClick={() => agendarCon(paciente)}
                      className="boton-texto inline-flex items-center gap-1.5 rounded-boton px-2 py-1 text-sm font-semibold text-brand-blue-700 transition"
                    >
                      <IconoCalendario className="h-4 w-4" />
                      Agendar cita
                    </button>
                  </div>
                </Tarjeta>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-blue-50">
              <span>
                Mostrando {Math.min(visibles, filas.length)} de {filas.length}
              </span>
              {visibles < filas.length && (
                <Boton variante="secundario" tamano="sm" onClick={() => setVisibles((n) => n + POR_TANDA)}>
                  Ver más
                </Boton>
              )}
            </div>
          </>
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
