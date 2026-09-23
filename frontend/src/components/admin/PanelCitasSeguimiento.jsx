// components/admin/PanelCitasSeguimiento.jsx
// RF-12: seguimiento de citas programadas, como vista de calendario
// semanal (reemplaza la tabla anterior). El administrador ademas puede
// agendar citas en nombre de un cliente ("+ Nueva cita"); reprogramar y
// cancelar siguen siendo exclusivas del cliente (RF-08/RF-09), no se
// hacen desde aqui. Al hacer clic en una cita se abre un SidePanel con
// el detalle (mismo patron que Servicios/Médicos).
import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  obtenerCitasAdministracion,
  obtenerServicios,
  obtenerClientes,
  agendarCita,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaLarga, formatearHora, esMismoDia, sumarDias, inicioDeSemana, formatearMesAnio, formatearRangoSemana } from '../../utils/fecha';
import { PageHeader } from '../ui/PageHeader';
import { SidePanel } from '../ui/SidePanel';
import { CategoryBadge, COLORES_CATEGORIA } from '../ui/CategoryBadge';
import { Campo } from '../form/Campo';
import { MiniCalendario } from '../citas/MiniCalendario';
import { SelectorFranjas } from '../citas/SelectorFranjas';
import { SelectorMedico } from '../citas/SelectorMedico';
import { IconoFlechaDerecha, IconoPata } from '../icons';

const HORA_INICIO_GRID = 7;
const HORA_FIN_GRID = 19;
const TOTAL_SLOTS = (HORA_FIN_GRID - HORA_INICIO_GRID) * 2;
const LETRAS_DIA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const FORM_VACIO = { clienteId: '', servicioId: '', franja: null, medicoId: '', nombreMascota: '', motivo: '' };

function etiquetaHora(slotIndex) {
  const hora24 = HORA_INICIO_GRID + slotIndex / 2;
  const periodo = hora24 < 12 ? 'AM' : 'PM';
  const hora12 = hora24 % 12 === 0 ? 12 : hora24 % 12;
  return `${hora12}:00 ${periodo}`;
}

function hoyAMedianoche() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

function TarjetaCita({ cita, mostrarMedico, onClick }) {
  const tono = COLORES_CATEGORIA[cita.categoria_color] ?? COLORES_CATEGORIA.blue;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: tono.bg, color: tono.text }}
      className="mb-1 flex w-full flex-col rounded-lg px-1.5 py-1 text-left text-[11px] leading-tight transition hover:brightness-95"
    >
      <span className="font-semibold">{formatearHora(cita.fecha_hora)}</span>
      <span className="truncate">{cita.nombre_mascota}</span>
      <span className="truncate opacity-80">{mostrarMedico ? cita.medico_nombre : cita.servicio_nombre}</span>
    </button>
  );
}

export function PanelCitasSeguimiento() {
  const { token, usuario } = useAuth();
  const esAdmin = usuario.rol === 'administrador';

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');

  const [diaSeleccionado, setDiaSeleccionado] = useState(hoyAMedianoche);
  const [semanaInicio, setSemanaInicio] = useState(() => inicioDeSemana(hoyAMedianoche()));

  const [citaDetalle, setCitaDetalle] = useState(null);
  const [panelNuevaAbierto, setPanelNuevaAbierto] = useState(false);
  const [formNueva, setFormNueva] = useState(FORM_VACIO);
  const [errorNueva, setErrorNueva] = useState('');
  const [guardandoNueva, setGuardandoNueva] = useState(false);

  function cargarCitas() {
    setCargando(true);
    obtenerCitasAdministracion(token).then((datos) => {
      setCitas(datos.citas);
      setCargando(false);
    });
  }

  useEffect(cargarCitas, [token]);

  useEffect(() => {
    if (!esAdmin) return;
    obtenerServicios().then((datos) => setServicios(datos.servicios));
    obtenerClientes(token).then((datos) => setClientes(datos.usuarios));
  }, [token, esAdmin]);

  const diasSemana = useMemo(() => Array.from({ length: 6 }, (_, i) => sumarDias(semanaInicio, i)), [semanaInicio]);

  const citasEnGrid = useMemo(() => {
    const mapa = new Map();
    citas.forEach((cita) => {
      const fecha = new Date(cita.fecha_hora);
      const dayIndex = diasSemana.findIndex((dia) => esMismoDia(dia, fecha));
      if (dayIndex === -1) return;
      const minutosDesdeInicio = fecha.getHours() * 60 + fecha.getMinutes() - HORA_INICIO_GRID * 60;
      const slotIndex = Math.floor(minutosDesdeInicio / 30);
      if (slotIndex < 0 || slotIndex >= TOTAL_SLOTS) return;
      const clave = `${dayIndex}-${slotIndex}`;
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave).push(cita);
    });
    return mapa;
  }, [citas, diasSemana]);

  const citasDelDia = useMemo(
    () =>
      citas
        .filter((c) => esMismoDia(new Date(c.fecha_hora), diaSeleccionado))
        .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora)),
    [citas, diaSeleccionado]
  );

  const categoriasEnUso = useMemo(() => {
    const vistos = new Map();
    citas.forEach((c) => {
      if (!vistos.has(c.categoria_nombre)) vistos.set(c.categoria_nombre, c.categoria_color);
    });
    return Array.from(vistos, ([nombre, color]) => ({ nombre, color }));
  }, [citas]);

  const clientesFiltrados = useMemo(
    () =>
      clientes.filter((c) => c.nombre_completo.toLowerCase().includes(busquedaCliente.toLowerCase())),
    [clientes, busquedaCliente]
  );

  function irSemanaAnterior() {
    setSemanaInicio((s) => sumarDias(s, -7));
  }
  function irSemanaSiguiente() {
    setSemanaInicio((s) => sumarDias(s, 7));
  }
  function irHoy() {
    const hoy = hoyAMedianoche();
    setDiaSeleccionado(hoy);
    setSemanaInicio(inicioDeSemana(hoy));
  }
  function seleccionarDia(dia) {
    setDiaSeleccionado(dia);
    setSemanaInicio(inicioDeSemana(dia));
  }

  function abrirNueva() {
    setFormNueva(FORM_VACIO);
    setErrorNueva('');
    setBusquedaCliente('');
    setPanelNuevaAbierto(true);
  }

  async function guardarNueva(evento) {
    evento.preventDefault();
    setErrorNueva('');
    if (!formNueva.clienteId || !formNueva.servicioId || !formNueva.franja || !formNueva.medicoId || !formNueva.nombreMascota) {
      setErrorNueva('Completa cliente, servicio, franja, médico y el nombre de la mascota.');
      return;
    }

    setGuardandoNueva(true);
    try {
      await agendarCita(
        {
          clienteId: formNueva.clienteId,
          servicioId: formNueva.servicioId,
          medicoId: formNueva.medicoId,
          fechaHora: formNueva.franja,
          nombreMascota: formNueva.nombreMascota,
          motivo: formNueva.motivo || null,
        },
        token
      );
      setPanelNuevaAbierto(false);
      cargarCitas();
    } catch (err) {
      setErrorNueva(err.message);
    } finally {
      setGuardandoNueva(false);
    }
  }

  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i);
  const fin = sumarDias(semanaInicio, 5);
  const hoy = hoyAMedianoche();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={esAdmin ? 'Calendario de citas' : 'Mi Calendario'}
        subtitle={esAdmin ? 'Consulta y agenda las citas de tu sede.' : 'Gestiona tus citas y organiza tu día.'}
        actionLabel={esAdmin ? 'Nueva cita' : undefined}
        onAction={esAdmin ? abrirNueva : undefined}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={irSemanaAnterior} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100">
          <IconoFlechaDerecha className="h-4 w-4 rotate-180" />
        </button>
        <button type="button" onClick={irSemanaSiguiente} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100">
          <IconoFlechaDerecha className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={irHoy}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Hoy
        </button>
        <p className="font-heading text-sm font-semibold text-brand-navy">
          {formatearMesAnio(semanaInicio)} · {formatearRangoSemana(semanaInicio, fin)}
        </p>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex-1 overflow-x-auto rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          {cargando ? (
            <div className="flex flex-col gap-2 p-4">
              {[0, 1, 2, 3].map((k) => (
                <div key={k} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="min-w-[760px]" style={{ display: 'grid', gridTemplateColumns: '64px repeat(6, minmax(110px, 1fr))' }}>
              <div />
              {diasSemana.map((dia, i) => (
                <div
                  key={i}
                  className={`border-b border-l border-slate-100 px-2 py-2 text-center text-xs font-semibold ${
                    esMismoDia(dia, hoy) ? 'text-brand-blue' : 'text-slate-500'
                  }`}
                >
                  {LETRAS_DIA[i]} <span className="block text-sm">{dia.getDate()}</span>
                </div>
              ))}

              {slots.map((slotIndex) => (
                <Fragment key={slotIndex}>
                  <div className="border-t border-slate-100 pr-2 pt-1 text-right text-[11px] text-slate-400">
                    {slotIndex % 2 === 0 ? etiquetaHora(slotIndex) : ''}
                  </div>
                  {diasSemana.map((dia, dayIndex) => {
                    const clave = `${dayIndex}-${slotIndex}`;
                    const citasSlot = citasEnGrid.get(clave) || [];
                    return (
                      <div key={clave} className="min-h-[44px] border-t border-l border-slate-100 p-0.5">
                        {citasSlot.map((cita) => (
                          <TarjetaCita key={cita.id} cita={cita} mostrarMedico={esAdmin} onClick={() => setCitaDetalle(cita)} />
                        ))}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 xl:w-72">
          <MiniCalendario diaSeleccionado={diaSeleccionado} onSeleccionarDia={seleccionarDia} />

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="font-heading text-sm font-semibold text-brand-navy">
              Citas del {esMismoDia(diaSeleccionado, hoy) ? 'día' : formatearFechaLarga(diaSeleccionado).split(',')[0].toLowerCase()}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {citasDelDia.length === 0 ? (
                <p className="text-sm text-slate-400">No hay citas ese día.</p>
              ) : (
                citasDelDia.map((cita) => (
                  <button
                    key={cita.id}
                    type="button"
                    onClick={() => setCitaDetalle(cita)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                      <IconoPata className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">{cita.nombre_mascota}</span>
                      <span className="block truncate text-xs text-slate-400">
                        {formatearHora(cita.fecha_hora)} · {cita.servicio_nombre}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {categoriasEnUso.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="font-heading text-sm font-semibold text-brand-navy">Tipos de servicio</p>
              <div className="mt-3 flex flex-col gap-2">
                {categoriasEnUso.map((c) => (
                  <div key={c.nombre} className="flex items-center gap-2 text-sm text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: (COLORES_CATEGORIA[c.color] ?? COLORES_CATEGORIA.blue).dot }}
                    />
                    {c.nombre}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <SidePanel isOpen={Boolean(citaDetalle)} onClose={() => setCitaDetalle(null)} title="Detalle de la cita">
        {citaDetalle && (
          <div className="flex flex-col gap-4">
            <CategoryBadge nombre={citaDetalle.categoria_nombre} color={citaDetalle.categoria_color} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Fecha y hora</p>
              <p className="text-sm text-slate-800">
                {formatearFechaLarga(citaDetalle.fecha_hora)} · {formatearHora(citaDetalle.fecha_hora)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Servicio</p>
              <p className="text-sm text-slate-800">{citaDetalle.servicio_nombre}</p>
            </div>
            {esAdmin && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Médico</p>
                <p className="text-sm text-slate-800">{citaDetalle.medico_nombre}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Cliente</p>
              <p className="text-sm text-slate-800">{citaDetalle.cliente_nombre}</p>
              {citaDetalle.cliente_telefono && <p className="text-xs text-slate-400">{citaDetalle.cliente_telefono}</p>}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Mascota</p>
              <p className="text-sm text-slate-800">{citaDetalle.nombre_mascota}</p>
            </div>
            {citaDetalle.motivo && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Motivo</p>
                <p className="text-sm text-slate-800">{citaDetalle.motivo}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Estado</p>
              <span
                className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                  citaDetalle.estado === 'agendada' ? 'bg-emerald-50 text-brand-green' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {citaDetalle.estado === 'agendada' ? 'Agendada' : 'Cancelada'}
              </span>
            </div>
          </div>
        )}
      </SidePanel>

      {esAdmin && (
        <SidePanel isOpen={panelNuevaAbierto} onClose={() => setPanelNuevaAbierto(false)} title="Nueva cita">
          <form onSubmit={guardarNueva} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cliente-cita" className="text-sm font-medium text-slate-700">
                Cliente
              </label>
              <input
                type="search"
                placeholder="Buscar cliente por nombre..."
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
              <select
                id="cliente-cita"
                value={formNueva.clienteId}
                onChange={(e) => setFormNueva({ ...formNueva, clienteId: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="">Selecciona un cliente</option>
                {clientesFiltrados.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre_completo} ({c.correo})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="servicio-cita-admin" className="text-sm font-medium text-slate-700">
                Servicio
              </label>
              <select
                id="servicio-cita-admin"
                value={formNueva.servicioId}
                onChange={(e) => setFormNueva({ ...formNueva, servicioId: e.target.value, franja: null, medicoId: '' })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="">Selecciona un servicio</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <SelectorFranjas
              sedeId={usuario.sedeId}
              servicioId={formNueva.servicioId}
              valorSeleccionado={formNueva.franja}
              onSeleccionar={(valor) => setFormNueva({ ...formNueva, franja: valor, medicoId: '' })}
            />

            <SelectorMedico
              sedeId={usuario.sedeId}
              servicioId={formNueva.servicioId}
              fechaHora={formNueva.franja}
              valorSeleccionado={formNueva.medicoId}
              onSeleccionar={(valor) => setFormNueva({ ...formNueva, medicoId: valor })}
            />

            <Campo
              id="mascota-cita-admin"
              label="Nombre de la mascota"
              value={formNueva.nombreMascota}
              onChange={(e) => setFormNueva({ ...formNueva, nombreMascota: e.target.value })}
            />
            <Campo
              id="motivo-cita-admin"
              label="Motivo (opcional)"
              value={formNueva.motivo}
              onChange={(e) => setFormNueva({ ...formNueva, motivo: e.target.value })}
            />

            {errorNueva && <p className="text-sm text-red-600">{errorNueva}</p>}

            <button
              type="submit"
              disabled={guardandoNueva}
              className="rounded-xl bg-brand-amber px-4 py-2 text-sm font-semibold text-brand-navy transition hover:brightness-95 disabled:opacity-60"
            >
              {guardandoNueva ? 'Agendando...' : 'Agendar cita'}
            </button>
          </form>
        </SidePanel>
      )}
    </div>
  );
}
