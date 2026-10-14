// components/medico/AgendarCitaMedicoPanel.jsx
// SidePanel "Agendar nueva cita" del medico veterinario, a nombre de un
// cliente.
import { useEffect, useState } from 'react';
import {
  agendarCita,
  buscarClientesMedico,
  obtenerHorarios,
  obtenerMascotasDeCliente,
  obtenerMisServiciosMedico,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { edadYPeso, especieYRaza } from '../../utils/mascota';
import { SidePanel } from '../ui/SidePanel';
import { CategoryBadge } from '../ui/CategoryBadge';
import { DatePickerCalendar } from '../agendar/DatePickerCalendar';
import { TimeSlotPicker } from '../agendar/TimeSlotPicker';
import { AvatarMascota } from '../cliente/AvatarMascota';
import { IconoBuscar, IconoCheck, IconoX } from '../icons';
import { ETIQUETA_SEXO } from '../../utils/sexo';
import { EtiquetaSexo } from '../ui/EtiquetaSexo';
import { iniciales } from '../../utils/texto';
import { Desplegable } from '../form/Desplegable';
import { CampoBusqueda } from '../form/CampoBusqueda';

const PASOS = ['Paciente y mascota', 'Servicio', 'Fecha y hora', 'Confirmar'];
const MAX_NOTAS = 255;
const CLASE_CAMPO =
  'w-full campo px-3 py-2 text-sm';

function Stepper({ paso }) {
  return (
    <ol className="flex items-start">
      {PASOS.map((etiqueta, i) => {
        const numero = i + 1;
        const completado = numero < paso;
        const activo = numero === paso;
        return (
          <li key={etiqueta} className="relative flex flex-1 flex-col items-center gap-1.5 text-center">
            {i < PASOS.length - 1 && (
              <span aria-hidden="true" className={`absolute left-1/2 top-3.5 h-0.5 w-full ${numero < paso ? 'bg-brand-blue' : 'bg-slate-200'}`} />
            )}
            <span
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                completado ? 'bg-emerald-700 text-white' : activo ? 'bg-brand-blue-600 text-white ring-4 ring-blue-100' : 'border-2 border-slate-200 bg-white text-slate-400'
              }`}
            >
              {completado ? <IconoCheck className="h-3.5 w-3.5" /> : numero}
            </span>
            <span className={`text-xs font-medium leading-tight ${activo ? 'text-brand-blue-600' : completado ? 'text-slate-700' : 'text-slate-400'}`}>
              {etiqueta}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function TarjetaCliente({ cliente, onQuitar }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue-600 text-sm font-bold text-white">
        {iniciales(cliente.nombre_completo)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900">{cliente.nombre_completo}</p>
        <p className="truncate text-xs text-slate-500">{[cliente.correo, cliente.telefono].filter(Boolean).join(' · ')}</p>
      </div>
      {onQuitar && (
        <button type="button" onClick={onQuitar} aria-label="Quitar paciente" className="boton-texto rounded-boton p-1.5 text-slate-400 hover:text-slate-600">
          <IconoX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function TarjetaMascotaResumen({ mascota }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <AvatarMascota mascota={mascota} className="h-12 w-12" />
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{mascota.nombre}</p>
        <p className="truncate text-sm text-slate-500">{especieYRaza(mascota)}</p>
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-400">
          <EtiquetaSexo sexo={mascota.sexo} />
          {ETIQUETA_SEXO[mascota.sexo] && edadYPeso(mascota) && <span aria-hidden="true">·</span>}
          {edadYPeso(mascota)}
        </p>
      </div>
    </div>
  );
}

function TarjetaServicio({ servicio }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-slate-900">{servicio.nombre}</p>
        <CategoryBadge nombre={servicio.categoria_nombre} color={servicio.categoria_color} />
      </div>
      {servicio.descripcion && <p className="mt-1 text-sm text-slate-500">{servicio.descripcion}</p>}
      <p className="mt-1 text-xs text-slate-400">Duración estimada: {servicio.duracion_minutos} min</p>
    </div>
  );
}

export function AgendarCitaMedicoPanel({ isOpen, onClose, onAgendada, pacienteInicial = null }) {
  const { token, usuario } = useAuth();
  const [paso, setPaso] = useState(1);
  const [cliente, setCliente] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState({ termino: '', clientes: [] });
  const [mascotas, setMascotas] = useState({ clienteId: null, lista: [] });
  const [mascotaId, setMascotaId] = useState('');
  const [servicios, setServicios] = useState([]);
  const [servicioId, setServicioId] = useState('');
  const [diasAbiertos, setDiasAbiertos] = useState(null);
  const [fecha, setFecha] = useState('');
  const [franja, setFranja] = useState(null);
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [refresco, setRefresco] = useState(0);

  // Al abrir: formulario limpio (con el paciente inicial si lo hay).
  const [abiertoAntes, setAbiertoAntes] = useState(false);
  if (isOpen !== abiertoAntes) {
    setAbiertoAntes(isOpen);
    if (isOpen) {
      setPaso(1);
      setCliente(pacienteInicial);
      setBusqueda('');
      setMascotaId('');
      setServicioId('');
      setFecha('');
      setFranja(null);
      setNotas('');
      setError('');
    }
  }

  // Servicios del medico y dias en que atiende su sede (una vez).
  useEffect(() => {
    if (!isOpen) return;
    obtenerMisServiciosMedico(token)
      .then((datos) => setServicios(datos.servicios))
      .catch((err) => setError(err.message));
    if (usuario?.sedeId) {
      obtenerHorarios(usuario.sedeId)
        .then((datos) => setDiasAbiertos(new Set(datos.horario.map((h) => h.dia_semana))))
        .catch(() => setDiasAbiertos(null));
    }
  }, [isOpen, token, usuario?.sedeId]);

  // Buscador de dueños (con pausa de 300 ms entre teclas).
  const termino = busqueda.trim();
  useEffect(() => {
    if (termino.length < 2) return undefined;
    const temporizador = setTimeout(() => {
      buscarClientesMedico(termino, token)
        .then((datos) => setResultados({ termino, clientes: datos.clientes }))
        .catch(() => setResultados({ termino, clientes: [] }));
    }, 300);
    return () => clearTimeout(temporizador);
  }, [termino, token]);

  // Mascotas del dueño elegido.
  useEffect(() => {
    if (!cliente) return;
    obtenerMascotasDeCliente(cliente.id, token)
      .then((datos) => setMascotas({ clienteId: cliente.id, lista: datos.mascotas }))
      .catch((err) => setError(err.message));
  }, [cliente, token]);

  const listaMascotas = cliente && mascotas.clienteId === cliente.id ? mascotas.lista : [];
  const mascota = listaMascotas.find((m) => m.id === mascotaId);
  const servicio = servicios.find((s) => s.id === servicioId);

  const pasoCompleto = {
    1: Boolean(cliente && mascota),
    2: Boolean(servicio),
    3: Boolean(franja),
    4: true,
  }[paso];

  function elegirCliente(c) {
    setCliente(c);
    setMascotaId('');
    setBusqueda('');
  }

  async function confirmar() {
    setEnviando(true);
    setError('');
    try {
      await agendarCita({ clienteId: cliente.id, servicioId, fechaHora: franja, mascotaId, motivo: notas.trim() }, token);
      onAgendada();
    } catch (err) {
      setError(err.message);
      // La hora pudo ocuparse: se vuelve al paso de fecha con la
      // disponibilidad recargada.
      setFranja(null);
      setRefresco((n) => n + 1);
      setPaso(3);
    } finally {
      setEnviando(false);
    }
  }

  const buscando = termino.length >= 2 && resultados.termino !== termino;
  const clientesEncontrados = termino.length >= 2 && resultados.termino === termino ? resultados.clientes : [];

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Agendar nueva cita"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={paso === 1 ? onClose : () => setPaso(paso - 1)}
            className="rounded-boton border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {paso === 1 ? 'Cancelar' : 'Atrás'}
          </button>
          <button
            type="button"
            disabled={!pasoCompleto || enviando}
            onClick={paso === 4 ? confirmar : () => setPaso(paso + 1)}
            className="flex-1 rounded-boton bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paso === 4 ? (enviando ? 'Agendando...' : 'Confirmar') : 'Siguiente'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Stepper paso={paso} />

        {paso === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-slate-700">
                Paciente (dueño)<span className="ml-0.5 text-red-500">*</span>
              </p>
              {cliente ? (
                <TarjetaCliente cliente={cliente} onQuitar={() => setCliente(null)} />
              ) : (
                <div className="relative">
                  <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <CampoBusqueda
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre, correo o teléfono..."
                    className={`${CLASE_CAMPO} pl-9`}
                  />
                  {termino.length >= 2 && (
                    <div className="mt-2 flex flex-col gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200">
                      {buscando ? (
                        <p className="px-3 py-2 text-sm text-slate-400">Buscando...</p>
                      ) : clientesEncontrados.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-slate-400">No hay pacientes tuyos con &quot;{termino}&quot;. A un cliente nuevo lo agenda la sede.</p>
                      ) : (
                        clientesEncontrados.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => elegirCliente(c)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-brand-blue-600">
                              {iniciales(c.nombre_completo)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-slate-800">{c.nombre_completo}</span>
                              <span className="block truncate text-xs text-slate-400">{[c.correo, c.telefono].filter(Boolean).join(' · ')}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {cliente && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mascota-cita-medico" className="text-sm font-medium text-slate-700">
                  Mascota<span className="ml-0.5 text-red-500">*</span>
                </label>
                {listaMascotas.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    Este paciente no tiene mascotas registradas. Agrégala desde Mis pacientes.
                  </p>
                ) : (
                  <Desplegable id="mascota-cita-medico" value={mascotaId} onChange={(e) => setMascotaId(e.target.value)} className={CLASE_CAMPO}>
                    <option value="">Selecciona una mascota</option>
                    {listaMascotas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} ({especieYRaza(m)})
                      </option>
                    ))}
                  </Desplegable>
                )}
                {mascota && <TarjetaMascotaResumen mascota={mascota} />}
              </div>
            )}
          </div>
        )}

        {paso === 2 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="servicio-cita-medico" className="text-sm font-medium text-slate-700">
              Servicio<span className="ml-0.5 text-red-500">*</span>
            </label>
            {servicios.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                No tienes servicios asignados. El administrador los asigna desde Médicos.
              </p>
            ) : (
              <Desplegable
                id="servicio-cita-medico"
                value={servicioId}
                onChange={(e) => {
                  setServicioId(e.target.value);
                  setFranja(null);
                }}
                className={CLASE_CAMPO}
              >
                <option value="">Selecciona un servicio</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </Desplegable>
            )}
            {servicio && <TarjetaServicio servicio={servicio} />}
          </div>
        )}

        {paso === 3 && (
          <div className="flex flex-col gap-5">
            <DatePickerCalendar
              valor={fecha}
              onChange={(valor) => {
                setFecha(valor);
                setFranja(null);
              }}
              diasAbiertos={diasAbiertos}
            />
            <div>
              <p className="mb-3 font-heading text-sm font-semibold text-brand-navy">Horarios disponibles</p>
              <TimeSlotPicker
                key={refresco}
                sedeId={usuario?.sedeId}
                servicioId={servicioId}
                medicoId={usuario?.id}
                fecha={fecha}
                valor={franja}
                onChange={setFranja}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="notas-cita-medico" className="text-sm font-medium text-slate-700">
                Notas adicionales (opcional)
              </label>
              <textarea
                id="notas-cita-medico"
                rows={3}
                maxLength={MAX_NOTAS}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Control postoperatorio, traer exámenes anteriores..."
                className={CLASE_CAMPO}
              />
              <p className="self-end text-xs text-slate-400">
                {notas.length}/{MAX_NOTAS}
              </p>
            </div>
          </div>
        )}

        {paso === 4 && cliente && mascota && servicio && franja && (
          <div className="flex flex-col gap-3">
            <p className="font-heading text-sm font-semibold text-brand-navy">Revisa los datos antes de confirmar</p>
            <TarjetaCliente cliente={cliente} />
            <TarjetaMascotaResumen mascota={mascota} />
            <TarjetaServicio servicio={servicio} />
            <div className="rounded-xl bg-[#EEF6FD] p-3">
              <p className="text-xs font-medium text-slate-500">Fecha y hora</p>
              <p className="font-semibold text-slate-900">
                {formatearFechaLarga(franja)} · {formatearHora(franja)}
              </p>
              <p className="mt-1 text-xs text-slate-500">La cita queda contigo, en tu sede.</p>
            </div>
            {notas.trim() && (
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <p className="text-xs font-medium text-slate-500">Notas adicionales</p>
                <p className="text-sm text-slate-700">{notas.trim()}</p>
              </div>
            )}
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}
      </div>
    </SidePanel>
  );
}
