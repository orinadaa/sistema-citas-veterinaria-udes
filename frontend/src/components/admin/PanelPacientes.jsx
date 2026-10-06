// components/admin/PanelPacientes.jsx
// "Paciente" = un cliente (dueño) con sus mascotas y su historial de
// citas. Vista multisede (filtro de sede opcional), sin historial
// clinico (solo identidad y agenda, ver el alcance del proyecto).
import { useEffect, useMemo, useState } from 'react';
import {
  obtenerPacientes,
  obtenerDetallePaciente,
  obtenerSedesAdmin,
  actualizarUsuario,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { PageHeader } from '../ui/PageHeader';
import { KPICard } from '../ui/KPICard';
import { StatusToggle } from '../ui/StatusToggle';
import { DataTable } from '../ui/DataTable';
import { SidePanel } from '../ui/SidePanel';
import { Tabs } from '../ui/Tabs';
import { EstadoError } from '../ui/EstadoError';
import { IconoPersona, IconoPata, IconoCalendario } from '../icons';
import { MascotasPaciente } from './MascotasPaciente';

const UMBRAL_FRECUENTE = 3;
const TABS_DETALLE = [
  { id: 'info', label: 'Información', icon: IconoPersona },
  { id: 'mascotas', label: 'Mascota(s)', icon: IconoPata },
  { id: 'citas', label: 'Citas', icon: IconoCalendario },
];

export function PanelPacientes({ busquedaInicial }) {
  const { token } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [citasDelMes, setCitasDelMes] = useState(0);
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [busqueda, setBusqueda] = useState(busquedaInicial || '');
  const [filtroSede, setFiltroSede] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Llega desde la busqueda global del topbar (AdminHeader).
  useEffect(() => {
    if (busquedaInicial) setBusqueda(busquedaInicial);
  }, [busquedaInicial]);

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [pestanaDetalle, setPestanaDetalle] = useState('info');
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [pacienteDetalleId, setPacienteDetalleId] = useState(null);


  function cargar() {
    setCargando(true);
    setErrorCarga('');
    Promise.all([obtenerPacientes({ sedeId: filtroSede || undefined }, token), obtenerSedesAdmin(token)])
      .then(([pacientesDatos, sedesDatos]) => {
        setPacientes(pacientesDatos.pacientes);
        setCitasDelMes(pacientesDatos.citasDelMes);
        setSedes(sedesDatos.sedes);
      })
      .catch((err) => setErrorCarga(err.message || 'No se pudieron cargar los pacientes.'))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [token, filtroSede]);

  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter((p) => {
      const coincideBusqueda = p.nombre_completo.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = !filtroEstado || (filtroEstado === 'activo' ? p.activo : !p.activo);
      return coincideBusqueda && coincideEstado;
    });
  }, [pacientes, busqueda, filtroEstado]);

  const kpis = useMemo(
    () => ({
      total: pacientes.length,
      mascotas: pacientes.reduce((suma, p) => suma + Number(p.mascotas_total), 0),
      citasDelMes,
      frecuentes: pacientes.filter((p) => Number(p.citas_total) >= UMBRAL_FRECUENTE).length,
    }),
    [pacientes, citasDelMes]
  );

  async function abrirDetalle(paciente) {
    setPanelAbierto(true);
    setPestanaDetalle('info');
    setCargandoDetalle(true);
    setErrorDetalle('');
    setDetalle(null);
    setPacienteDetalleId(paciente.id);
    try {
      const datos = await obtenerDetallePaciente(paciente.id, token);
      setDetalle(datos);
    } catch (err) {
      setErrorDetalle(err.message || 'No se pudo cargar el detalle del paciente.');
    } finally {
      setCargandoDetalle(false);
    }
  }

  async function alternarActivo(paciente) {
    await actualizarUsuario(paciente.id, { activo: !paciente.activo }, token);
    cargar();
  }

  // Tras agregar/editar/eliminar una mascota: refresca el detalle abierto
  // y la tabla (el conteo de mascotas por paciente).
  async function refrescarDetalle() {
    try {
      setDetalle(await obtenerDetallePaciente(detalle.cliente.id, token));
    } catch (err) {
      setErrorDetalle(err.message || 'No se pudo recargar el detalle del paciente.');
    }
    cargar();
  }

  return (
    <>
    <div className="flex flex-col gap-6" inert={panelAbierto} aria-hidden={panelAbierto}>
      <PageHeader title="Pacientes" subtitle="Dueños y mascotas registrados en el sistema." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard icon={IconoPersona} color="blue" value={kpis.total} label="Pacientes registrados" />
        <KPICard icon={IconoPata} color="green" value={kpis.mascotas} label="Mascotas registradas" />
        <KPICard icon={IconoPata} color="blue" value={kpis.citasDelMes} label="Citas este mes" />
        <KPICard icon={IconoPersona} color="amber" value={kpis.frecuentes} label="Pacientes frecuentes" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre..."
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
        />
        <select
          value={filtroSede}
          onChange={(e) => setFiltroSede(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
        >
          <option value="">Todas las sedes</option>
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      {cargando ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((clave) => (
            <div key={clave} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : errorCarga ? (
        <EstadoError mensaje={errorCarga} onReintentar={cargar} />
      ) : (
        <DataTable
          filaVacia="No hay pacientes que coincidan con los filtros."
          columns={[
            {
              header: 'Dueño',
              render: (p) => (
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
                    {p.nombre_completo
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{p.nombre_completo}</p>
                    <p className="text-xs text-slate-400">{p.correo}</p>
                  </div>
                </div>
              ),
            },
            { header: 'Mascotas', render: (p) => <span>{p.mascotas_total}</span> },
            { header: 'Citas', render: (p) => <span>{p.citas_total}</span> },
            {
              header: 'Última cita',
              render: (p) => <span className="text-sm text-slate-500">{p.ultima_cita ? formatearFechaLarga(p.ultima_cita) : '—'}</span>,
            },
            {
              header: 'Estado',
              render: (p) => (
                <StatusToggle checked={p.activo} onChange={() => alternarActivo(p)} label={p.activo ? 'Activo' : 'Inactivo'} />
              ),
            },
          ]}
          rows={pacientesFiltrados}
          actions={(p) => (
            <button
              type="button"
              onClick={() => abrirDetalle(p)}
              className="rounded-boton px-3 py-1.5 text-sm font-medium text-brand-blue transition hover:bg-blue-50"
            >
              Ver
            </button>
          )}
        />
      )}
    </div>

    <SidePanel isOpen={panelAbierto} onClose={() => setPanelAbierto(false)} title="Detalle del paciente">
        {errorDetalle ? (
          <EstadoError mensaje={errorDetalle} onReintentar={() => abrirDetalle({ id: pacienteDetalleId })} />
        ) : cargandoDetalle || !detalle ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((k) => (
              <div key={k} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-blue text-sm font-bold text-white">
                {detalle.cliente.nombre_completo
                  .split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </span>
              <div>
                <p className="font-heading text-base font-semibold text-brand-navy">{detalle.cliente.nombre_completo}</p>
                <span
                  className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    detalle.cliente.activo ? 'bg-emerald-50 text-brand-green' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${detalle.cliente.activo ? 'bg-brand-green' : 'bg-slate-400'}`} />
                  {detalle.cliente.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <Tabs items={TABS_DETALLE} activeItem={pestanaDetalle} onChange={setPestanaDetalle} />

            {pestanaDetalle === 'info' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Correo</p>
                  <p className="text-sm text-slate-800">{detalle.cliente.correo}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Teléfono</p>
                  <p className="text-sm text-slate-800">{detalle.cliente.telefono || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Registrado desde</p>
                  <p className="text-sm text-slate-800">{formatearFechaLarga(detalle.cliente.creado_en)}</p>
                </div>
                <StatusToggle
                  checked={detalle.cliente.activo}
                  onChange={async (valor) => {
                    await actualizarUsuario(detalle.cliente.id, { activo: valor }, token);
                    setDetalle({ ...detalle, cliente: { ...detalle.cliente, activo: valor } });
                    cargar();
                  }}
                  label="Cliente activo"
                  helpText="Si se desactiva, la cuenta no podrá iniciar sesión."
                />
              </div>
            )}

            {pestanaDetalle === 'mascotas' && (
              <MascotasPaciente clienteId={detalle.cliente.id} mascotas={detalle.mascotas} onCambio={refrescarDetalle} />
            )}

            {pestanaDetalle === 'citas' && (
              <div className="flex flex-col gap-2">
                {detalle.citas.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin citas registradas todavía.</p>
                ) : (
                  detalle.citas.map((c) => (
                    <div key={c.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                      <p className="font-medium text-slate-900">
                        {formatearFechaLarga(c.fecha_hora)} · {formatearHora(c.fecha_hora)}
                      </p>
                      <p className="text-slate-500">
                        {c.servicio_nombre} con {c.medico_nombre} — {c.mascota_nombre}
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          c.estado === 'agendada' ? 'bg-emerald-50 text-brand-green' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.estado === 'agendada' ? 'Agendada' : 'Cancelada'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </SidePanel>
    </>
  );
}
