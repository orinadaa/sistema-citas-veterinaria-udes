// components/admin/PanelMedicos.jsx
// RF-10/RF-11: CRUD de medicos de la sede del administrador (perfil,
// especialidades y que servicio presta cada uno).
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  obtenerMedicosAdmin,
  obtenerServiciosAdmin,
  obtenerCategoriasServicio,
  crearMedico,
  actualizarMedico,
  actualizarServiciosDeMedico,
  actualizarEspecialidadesDeMedico,
  subirFotoMedicoAdmin,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';
import { ZonaFoto } from '../form/ZonaFoto';
import { FotoMascotaModal } from '../cliente/FotoMascotaModal';
import { PageHeader } from '../ui/PageHeader';
import { KPICard } from '../ui/KPICard';
import { CategoryBadge } from '../ui/CategoryBadge';
import { StatusToggle } from '../ui/StatusToggle';
import { DataTable } from '../ui/DataTable';
import { SidePanel } from '../ui/SidePanel';
import { EstadoError } from '../ui/EstadoError';
import { IconoMedicos } from '../icons';

const FORM_VACIO = {
  nombreCompleto: '',
  correo: '',
  documento: '',
  telefono: '',
  biografia: '',
  activo: true,
};

function iniciales(nombre) {
  return (nombre || '')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function PanelMedicos({ busquedaInicial }) {
  const { token } = useAuth();
  const [medicos, setMedicos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [busqueda, setBusqueda] = useState(busquedaInicial || '');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Llega desde la busqueda global del topbar (AdminHeader).
  useEffect(() => {
    if (busquedaInicial) setBusqueda(busquedaInicial);
  }, [busquedaInicial]);

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [medicoEditando, setMedicoEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);
  // Foto del medico: se sube como archivo (ya no es un enlace). `foto` es
  // la imagen recortada en el editor (Blob), pendiente de subir al guardar.
  const [foto, setFoto] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [editorFotoAbierto, setEditorFotoAbierto] = useState(false);

  useEffect(() => () => vistaPrevia && URL.revokeObjectURL(vistaPrevia), [vistaPrevia]);

  function limpiarFoto() {
    setFoto(null);
    setVistaPrevia(null);
    setEditorFotoAbierto(false);
  }

  function cargar() {
    setCargando(true);
    setErrorCarga('');
    Promise.all([obtenerMedicosAdmin(token), obtenerServiciosAdmin(token), obtenerCategoriasServicio()])
      .then(([medicosDatos, serviciosDatos, categoriasDatos]) => {
        setMedicos(medicosDatos.medicos);
        setServicios(serviciosDatos.servicios.filter((s) => s.activo));
        setCategorias(categoriasDatos.categorias);
      })
      .catch((err) => setErrorCarga(err.message || 'No se pudieron cargar los médicos.'))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [token]);

  const medicosFiltrados = useMemo(() => {
    return medicos.filter((m) => {
      const coincideBusqueda = m.nombre_completo.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEspecialidad =
        !filtroEspecialidad || m.especialidades.some((e) => e.id === filtroEspecialidad);
      const coincideEstado = !filtroEstado || (filtroEstado === 'activo' ? m.activo : !m.activo);
      return coincideBusqueda && coincideEspecialidad && coincideEstado;
    });
  }, [medicos, busqueda, filtroEspecialidad, filtroEstado]);

  const kpis = useMemo(
    () => ({
      total: medicos.length,
      activos: medicos.filter((m) => m.activo).length,
      inactivos: medicos.filter((m) => !m.activo).length,
      especialidades: new Set(medicos.flatMap((m) => m.especialidades.map((e) => e.id))).size,
    }),
    [medicos]
  );

  function abrirCrear() {
    setMedicoEditando(null);
    setForm(FORM_VACIO);
    limpiarFoto();
    setError('');
    setAviso(null);
    setPanelAbierto(true);
  }

  function abrirEditar(medico) {
    setMedicoEditando(medico);
    setForm({
      nombreCompleto: medico.nombre_completo,
      correo: medico.correo,
      documento: medico.documento || '',
      telefono: medico.telefono || '',
      biografia: medico.biografia || '',
      activo: medico.activo,
    });
    limpiarFoto();
    setError('');
    setAviso(null);
    setPanelAbierto(true);
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    if (!form.nombreCompleto) {
      setError('El nombre completo es obligatorio.');
      return;
    }

    setGuardando(true);
    try {
      let medicoId = medicoEditando?.id;
      let avisoGuardado = null;
      if (medicoEditando) {
        await actualizarMedico(
          medicoEditando.id,
          {
            nombreCompleto: form.nombreCompleto,
            documento: form.documento || null,
            telefono: form.telefono || null,
            biografia: form.biografia || null,
            activo: form.activo,
          },
          token
        );
      } else {
        if (!form.correo || !form.documento) {
          setError('El correo y el documento de identidad son obligatorios para crear un médico.');
          setGuardando(false);
          return;
        }
        const respuesta = await crearMedico(
          {
            nombreCompleto: form.nombreCompleto,
            correo: form.correo,
            documento: form.documento,
            telefono: form.telefono || null,
          },
          token
        );
        medicoId = respuesta.medico?.id;
        avisoGuardado = respuesta.correoEnviado
          ? { tipo: 'exito', texto: `Médico creado. Se envió un correo con sus credenciales a ${form.correo}.` }
          : { tipo: 'advertencia', texto: 'Médico creado, pero no se pudo enviar el correo con sus credenciales — verifica la configuración de correo.' };
      }
      // Los datos ya quedaron guardados: si la foto falla, se avisa sin
      // perder lo demas.
      if (foto && medicoId) {
        try {
          await subirFotoMedicoAdmin(medicoId, foto, token);
        } catch (err) {
          avisoGuardado = {
            tipo: 'advertencia',
            texto: `${avisoGuardado ? `${avisoGuardado.texto} ` : 'Los datos del médico se guardaron. '}La foto no se pudo subir: ${err.message}`,
          };
        }
      }
      if (avisoGuardado) setAviso(avisoGuardado);
      setPanelAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function desactivarDesdeElPanel() {
    if (!medicoEditando) return;
    setGuardando(true);
    try {
      await actualizarMedico(medicoEditando.id, { activo: false }, token);
      setPanelAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function alternarActivo(medico) {
    await actualizarMedico(medico.id, { activo: !medico.activo }, token);
    cargar();
  }

  async function alternarEspecialidad(medico, categoriaId) {
    const tiene = medico.especialidades.some((e) => e.id === categoriaId);
    const nuevosIds = tiene
      ? medico.especialidades.filter((e) => e.id !== categoriaId).map((e) => e.id)
      : [...medico.especialidades.map((e) => e.id), categoriaId];
    await actualizarEspecialidadesDeMedico(medico.id, nuevosIds, token);
    cargar();
  }

  async function alternarServicio(medico, servicioId) {
    const tiene = medico.servicios.some((s) => s.id === servicioId);
    const nuevosIds = tiene
      ? medico.servicios.filter((s) => s.id !== servicioId).map((s) => s.id)
      : [...medico.servicios.map((s) => s.id), servicioId];
    await actualizarServiciosDeMedico(medico.id, nuevosIds, token);
    cargar();
  }

  const medicoActual = medicoEditando ? medicos.find((m) => m.id === medicoEditando.id) ?? medicoEditando : null;
  const fotoMostrada = vistaPrevia || medicoEditando?.foto_url || null;

  return (
    <>
    <div className="flex flex-col gap-6" inert={panelAbierto} aria-hidden={panelAbierto}>
      <PageHeader
        title="Médicos Veterinarios"
        subtitle="Gestiona el personal médico de tu sede."
        actionLabel="Nuevo médico"
        onAction={abrirCrear}
      />

      {aviso && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ring-1 ${
            aviso.tipo === 'exito'
              ? 'bg-green-50 text-green-700 ring-green-200'
              : 'bg-amber-50 text-amber-700 ring-amber-200'
          }`}
        >
          {aviso.texto}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard icon={IconoMedicos} color="blue" value={kpis.total} label="Registrados" />
        <KPICard icon={IconoMedicos} color="green" value={kpis.activos} label="Activos" />
        <KPICard icon={IconoMedicos} color="red" value={kpis.inactivos} label="Inactivos" />
        <KPICard icon={IconoMedicos} color="blue" value={kpis.especialidades} label="Especialidades" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar médico..."
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
        />
        <select
          value={filtroEspecialidad}
          onChange={(e) => setFiltroEspecialidad(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
        >
          <option value="">Todas las especialidades</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
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
          {[0, 1].map((clave) => (
            <div key={clave} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : errorCarga ? (
        <EstadoError mensaje={errorCarga} onReintentar={cargar} />
      ) : (
        <DataTable
          filaVacia="No hay médicos que coincidan con los filtros."
          columns={[
            {
              header: 'Médico',
              render: (m) => (
                <div className="flex items-center gap-3">
                  {m.foto_url ? (
                    <img src={m.foto_url} alt={m.nombre_completo} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
                      {iniciales(m.nombre_completo)}
                    </span>
                  )}
                  <div>
                    <p className="font-medium text-slate-900">{m.nombre_completo}</p>
                    <p className="text-xs text-slate-400">
                      Médico Veterinario{m.documento ? ` · ${m.documento}` : ''}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              header: 'Especialidades',
              render: (m) => (
                <div className="flex max-w-[220px] flex-wrap gap-1">
                  {m.especialidades.length === 0 ? (
                    <span className="text-xs text-slate-400">Sin asignar</span>
                  ) : (
                    m.especialidades.map((e) => <CategoryBadge key={e.id} nombre={e.nombre} color={e.color} />)
                  )}
                </div>
              ),
            },
            {
              header: 'Contacto',
              render: (m) => (
                <div className="text-sm">
                  <p className="text-slate-700">{m.correo}</p>
                  {m.telefono && <p className="text-xs text-slate-400">{m.telefono}</p>}
                </div>
              ),
            },
            {
              header: 'Estado',
              render: (m) => (
                <StatusToggle checked={m.activo} onChange={() => alternarActivo(m)} label={m.activo ? 'Activo' : 'Inactivo'} />
              ),
            },
          ]}
          rows={medicosFiltrados}
          actions={(m) => (
            <button
              type="button"
              onClick={() => abrirEditar(m)}
              className="rounded-boton px-3 py-1.5 text-sm font-medium text-brand-blue transition hover:bg-blue-50"
            >
              Editar
            </button>
          )}
        />
      )}

    </div>

    <SidePanel
      isOpen={panelAbierto}
      onClose={() => setPanelAbierto(false)}
      title={medicoEditando ? 'Editar médico' : 'Nuevo médico'}
      footer={
        <div className="flex items-center justify-between gap-3">
          {medicoEditando ? (
            <button
              type="button"
              disabled={guardando}
              onClick={desactivarDesdeElPanel}
              className="rounded-boton border border-red-200 px-4 py-2 text-sm font-semibold text-brand-red transition hover:bg-red-50 disabled:opacity-60"
            >
              Desactivar médico
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            form="form-medico"
            disabled={guardando}
            className="rounded-boton bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      }
    >
        <form id="form-medico" onSubmit={guardar} className="flex flex-col gap-4">
          {/* Zona de foto estandar: el clic abre el editor de foto (abajo). */}
          <ZonaFoto
            fotoUrl={fotoMostrada}
            onClick={() => setEditorFotoAbierto(true)}
            ayuda="Sube la foto del médico (opcional)"
            alt={form.nombreCompleto ? `Foto de ${form.nombreCompleto}` : 'Foto del médico'}
            className="w-32 self-center"
          />

          <Campo
            id="nombre-medico"
            label="Nombre completo"
            value={form.nombreCompleto}
            onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
            required
          />
          <Campo
            id="documento-medico"
            label="Documento de identidad"
            value={form.documento}
            onChange={(e) => setForm({ ...form, documento: e.target.value })}
            required={!medicoEditando}
          />
          <Campo
            id="correo-medico"
            label="Correo"
            type="email"
            value={form.correo}
            disabled={Boolean(medicoEditando)}
            onChange={(e) => setForm({ ...form, correo: e.target.value })}
            required={!medicoEditando}
          />
          {!medicoEditando && (
            <p className="text-xs text-slate-500">
              La contraseña se genera automáticamente y se envía por correo al médico.
            </p>
          )}
          <Campo
            id="telefono-medico"
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          />

          {medicoEditando && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Especialidades</span>
              <div className="flex flex-wrap gap-2">
                {categorias.map((c) => {
                  const activa = medicoActual?.especialidades.some((e) => e.id === c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => alternarEspecialidad(medicoActual, c.id)}
                      className={activa ? '' : 'opacity-40 transition hover:opacity-70'}
                    >
                      <CategoryBadge nombre={c.nombre} color={c.color} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {medicoEditando && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Servicios que presta</span>
              <div className="flex flex-wrap gap-2">
                {servicios.map((s) => {
                  const activo = medicoActual?.servicios.some((sv) => sv.id === s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => alternarServicio(medicoActual, s.id)}
                      className={`rounded-boton px-3 py-1.5 text-xs font-medium transition ${
                        activo ? 'bg-brand-blue text-white hover:bg-blue-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="biografia-medico" className="text-sm font-medium text-slate-700">
                Biografía
              </label>
              <span className="text-xs text-slate-400">{form.biografia.length}/500</span>
            </div>
            <textarea
              id="biografia-medico"
              value={form.biografia}
              maxLength={500}
              onChange={(e) => setForm({ ...form, biografia: e.target.value })}
              rows={4}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <StatusToggle
            checked={form.activo}
            onChange={(valor) => setForm({ ...form, activo: valor })}
            label="Médico activo"
            helpText="Si se desactiva, no aparecerá en la agenda de citas."
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
    </SidePanel>

    {/* En <body> (portal): mismo editor de foto que mascotas y "Mi perfil"
        del medico; entrega la foto ya recortada. */}
    {createPortal(
      <FotoMascotaModal
        isOpen={editorFotoAbierto}
        onClose={() => setEditorFotoAbierto(false)}
        titulo="Foto del médico"
        fotoActual={fotoMostrada}
        onGuardar={(blob) => {
          setFoto(blob);
          setVistaPrevia(URL.createObjectURL(blob));
          setEditorFotoAbierto(false);
        }}
      />,
      document.body
    )}
    </>
  );
}
