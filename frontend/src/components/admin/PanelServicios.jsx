// components/admin/PanelServicios.jsx
// RF-11: catalogo de servicios veterinarios (categoria, precio, duracion
// estimada, estado). La duracion se muestra al cliente en el resumen del
// flujo de agendamiento; es informativa (la agenda sigue en franjas de 30 min).
import { useEffect, useMemo, useState } from 'react';
import {
  obtenerServiciosAdmin,
  obtenerCategoriasServicio,
  crearServicio,
  actualizarServicio,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';
import { PageHeader } from '../ui/PageHeader';
import { KPICard } from '../ui/KPICard';
import { CategoryBadge } from '../ui/CategoryBadge';
import { StatusToggle } from '../ui/StatusToggle';
import { DataTable } from '../ui/DataTable';
import { SidePanel } from '../ui/SidePanel';
import { EstadoError } from '../ui/EstadoError';
import { IconoJeringa } from '../icons';
import { formatearCOP } from '../../utils/moneda';

const FORM_VACIO = { nombre: '', descripcion: '', categoriaId: '', precio: '', duracionMinutos: '30', activo: true };

export function PanelServicios({ busquedaInicial }) {
  const { token } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [busqueda, setBusqueda] = useState(busquedaInicial || '');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Llega desde la busqueda global del topbar (AdminHeader): al hacer
  // clic en un resultado se cambia de pestana y se precarga el filtro
  // con el termino buscado.
  useEffect(() => {
    if (busquedaInicial) setBusqueda(busquedaInicial);
  }, [busquedaInicial]);

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [servicioEditando, setServicioEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    setCargando(true);
    setErrorCarga('');
    Promise.all([obtenerServiciosAdmin(token), obtenerCategoriasServicio()])
      .then(([serviciosDatos, categoriasDatos]) => {
        setServicios(serviciosDatos.servicios);
        setCategorias(categoriasDatos.categorias);
      })
      .catch((err) => setErrorCarga(err.message || 'No se pudieron cargar los servicios.'))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [token]);

  const serviciosFiltrados = useMemo(() => {
    return servicios.filter((servicio) => {
      const coincideBusqueda = servicio.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = !filtroCategoria || servicio.categoria_id === filtroCategoria;
      const coincideEstado =
        !filtroEstado || (filtroEstado === 'activo' ? servicio.activo : !servicio.activo);
      return coincideBusqueda && coincideCategoria && coincideEstado;
    });
  }, [servicios, busqueda, filtroCategoria, filtroEstado]);

  const kpis = useMemo(
    () => ({
      total: servicios.length,
      activos: servicios.filter((s) => s.activo).length,
      inactivos: servicios.filter((s) => !s.activo).length,
      categorias: new Set(servicios.map((s) => s.categoria_id)).size,
    }),
    [servicios]
  );

  function abrirCrear() {
    setServicioEditando(null);
    setForm(FORM_VACIO);
    setError('');
    setPanelAbierto(true);
  }

  function abrirEditar(servicio) {
    setServicioEditando(servicio);
    setForm({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      categoriaId: servicio.categoria_id,
      precio: String(servicio.precio),
      duracionMinutos: String(servicio.duracion_minutos ?? 30),
      activo: servicio.activo,
    });
    setError('');
    setPanelAbierto(true);
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    if (!form.nombre || !form.categoriaId) {
      setError('El nombre y la categoría son obligatorios.');
      return;
    }

    const cuerpo = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      categoriaId: form.categoriaId,
      precio: Number(form.precio) || 0,
      duracionMinutos: Number(form.duracionMinutos) || 30,
      activo: form.activo,
    };

    setGuardando(true);
    try {
      if (servicioEditando) {
        await actualizarServicio(servicioEditando.id, cuerpo, token);
      } else {
        await crearServicio(cuerpo, token);
      }
      setPanelAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function desactivarDesdeElPanel() {
    if (!servicioEditando) return;
    setGuardando(true);
    try {
      await actualizarServicio(servicioEditando.id, { activo: false }, token);
      setPanelAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function alternarActivo(servicio) {
    await actualizarServicio(servicio.id, { activo: !servicio.activo }, token);
    cargar();
  }

  return (
    <>
    <div className="flex flex-col gap-6" inert={panelAbierto} aria-hidden={panelAbierto}>
      <PageHeader
        title="Servicios veterinarios"
        subtitle="Gestiona los servicios que ofrece tu clínica."
        actionLabel="Nuevo servicio"
        onAction={abrirCrear}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard icon={IconoJeringa} color="blue" value={kpis.total} label="Servicios totales" />
        <KPICard icon={IconoJeringa} color="green" value={kpis.activos} label="Activos" />
        <KPICard icon={IconoJeringa} color="red" value={kpis.inactivos} label="Inactivos" />
        <KPICard icon={IconoJeringa} color="blue" value={kpis.categorias} label="Categorías" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar servicio..."
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
        />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
        >
          <option value="">Todas las categorías</option>
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
          {[0, 1, 2].map((clave) => (
            <div key={clave} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : errorCarga ? (
        <EstadoError mensaje={errorCarga} onReintentar={cargar} />
      ) : (
        <DataTable
          filaVacia="No hay servicios que coincidan con los filtros."
          columns={[
            {
              header: 'Servicio',
              render: (s) => (
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                    <IconoJeringa className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{s.nombre}</p>
                    {s.descripcion && <p className="text-xs text-slate-400">{s.descripcion}</p>}
                  </div>
                </div>
              ),
            },
            { header: 'Categoría', render: (s) => <CategoryBadge nombre={s.categoria_nombre} color={s.categoria_color} /> },
            { header: 'Precio', render: (s) => formatearCOP(s.precio) },
            { header: 'Duración', render: (s) => `${s.duracion_minutos} min` },
            {
              header: 'Estado',
              render: (s) => (
                <StatusToggle checked={s.activo} onChange={() => alternarActivo(s)} label={s.activo ? 'Activo' : 'Inactivo'} />
              ),
            },
          ]}
          rows={serviciosFiltrados}
          actions={(s) => (
            <button
              type="button"
              onClick={() => abrirEditar(s)}
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
      title={servicioEditando ? 'Editar servicio' : 'Nuevo servicio'}
      footer={
        <div className="flex items-center justify-between gap-3">
          {servicioEditando ? (
            <button
              type="button"
              disabled={guardando}
              onClick={desactivarDesdeElPanel}
              className="rounded-boton border border-red-200 px-4 py-2 text-sm font-semibold text-brand-red transition hover:bg-red-50 disabled:opacity-60"
            >
              Desactivar servicio
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            form="form-servicio"
            disabled={guardando}
            className="rounded-boton bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      }
    >
        <form id="form-servicio" onSubmit={guardar} className="flex flex-col gap-4">
          {servicioEditando && (
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                <IconoJeringa className="h-5 w-5" />
              </span>
              <CategoryBadge nombre={servicioEditando.categoria_nombre} color={servicioEditando.categoria_color} />
            </div>
          )}

          <Campo id="nombre-servicio" label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="categoria-servicio" className="text-sm font-medium text-slate-700">
              Categoría<span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="categoria-servicio"
              value={form.categoriaId}
              onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="descripcion-servicio" className="text-sm font-medium text-slate-700">
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion-servicio"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={3}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <Campo
            id="precio-servicio"
            label="Precio (COP)"
            type="number"
            min="0"
            step="1000"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
          />

          <Campo
            id="duracion-servicio"
            label="Duración estimada (minutos)"
            type="number"
            min="5"
            max="480"
            step="5"
            value={form.duracionMinutos}
            onChange={(e) => setForm({ ...form, duracionMinutos: e.target.value })}
            required
          />

          <StatusToggle
            checked={form.activo}
            onChange={(valor) => setForm({ ...form, activo: valor })}
            label="Servicio activo"
            helpText="Si se desactiva, no aparecerá disponible para agendar citas."
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
    </SidePanel>
    </>
  );
}
