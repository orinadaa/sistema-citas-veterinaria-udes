// components/admin/PanelConfiguracion.jsx
// Configuracion, acotada a lo que tiene respaldo real: gestion de
// cuentas de personal (Usuarios), Sedes (reutiliza PanelHorarios tal
// cual). Desde la separacion de roles es el modulo "Usuarios" del
// superadministrador. El resto de pestanas del mockup (Notificaciones, Seguridad,
// Respaldo, Preferencias, Apariencia) no se construyen: sin RF/RNF ni
// backend detras, ver docs/incremento_3_pruebas.md.
import { useEffect, useMemo, useState } from 'react';
import {
  obtenerUsuarios,
  obtenerSedesAdmin,
  crearUsuarioStaff,
  cambiarRolUsuario,
  actualizarUsuario,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';
import { PageHeader } from '../ui/PageHeader';
import { StatusToggle } from '../ui/StatusToggle';
import { DataTable } from '../ui/DataTable';
import { SidePanel } from '../ui/SidePanel';
import { EstadoError } from '../ui/EstadoError';
import { Desplegable } from '../form/Desplegable';
import { CampoBusqueda } from '../form/CampoBusqueda';


const ETIQUETA_ROL = { administrador: 'Administrador de sede', veterinario: 'Médico Veterinario', cliente: 'Cliente' };
const FORM_VACIO = { nombreCompleto: '', correo: '', rol: 'veterinario', sedeId: '', telefono: '', activo: true };

// busquedaInicial: llega del buscador de la barra superior al elegir un usuario.
export function PanelConfiguracion({ busquedaInicial }) {
  const { token, usuario } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [busqueda, setBusqueda] = useState(busquedaInicial || '');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroRol, setFiltroRol] = useState('');

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);

  function cargar() {
    setCargando(true);
    setErrorCarga('');
    Promise.all([obtenerUsuarios(token), obtenerSedesAdmin(token)])
      .then(([usuariosDatos, sedesDatos]) => {
        // Todas las cuentas menos la del superadministrador (no se edita desde
        // el sistema). Los clientes aparecen para poder activarlos o
        // desactivarlos: es el unico rol que puede hacerlo.
        setUsuarios(usuariosDatos.usuarios.filter((u) => u.rol !== 'superadministrador'));
        setSedes(sedesDatos.sedes);
      })
      .catch((err) => setErrorCarga(err.message || 'No se pudieron cargar los usuarios.'))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [token]);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const coincideBusqueda = u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = !filtroEstado || (filtroEstado === 'activo' ? u.activo : !u.activo);
      const coincideRol = !filtroRol || u.rol === filtroRol;
      return coincideBusqueda && coincideEstado && coincideRol;
    });
  }, [usuarios, busqueda, filtroEstado, filtroRol]);

  function abrirCrear() {
    setUsuarioEditando(null);
    setForm(FORM_VACIO);
    setError('');
    setAviso(null);
    setPanelAbierto(true);
  }

  function abrirEditar(u) {
    setUsuarioEditando(u);
    setForm({
      nombreCompleto: u.nombre_completo,
      correo: u.correo,
      rol: u.rol,
      sedeId: u.sede_id || '',
      telefono: u.telefono || '',
      activo: u.activo,
    });
    setError('');
    setAviso(null);
    setPanelAbierto(true);
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');

    if (!form.nombreCompleto || !form.sedeId) {
      setError('El nombre y la sede son obligatorios.');
      return;
    }

    setGuardando(true);
    try {
      if (usuarioEditando) {
        await cambiarRolUsuario(usuarioEditando.id, { rol: form.rol, sedeId: form.sedeId }, token);
        await actualizarUsuario(usuarioEditando.id, { nombreCompleto: form.nombreCompleto, telefono: form.telefono, activo: form.activo }, token);
      } else {
        if (!form.correo) {
          setError('El correo es obligatorio para crear un usuario.');
          setGuardando(false);
          return;
        }
        const respuesta = await crearUsuarioStaff(
          {
            nombreCompleto: form.nombreCompleto,
            correo: form.correo,
            rol: form.rol,
            sedeId: form.sedeId,
            telefono: form.telefono || null,
          },
          token
        );
        setAviso(
          respuesta.correoEnviado
            ? { tipo: 'exito', texto: `Usuario creado. Se envió un correo con sus credenciales a ${form.correo}.` }
            : { tipo: 'advertencia', texto: 'Usuario creado, pero no se pudo enviar el correo con sus credenciales — verifica la configuración de correo.' }
        );
      }
      setPanelAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function alternarActivo(u) {
    if (u.id === usuario.id) return;
    await actualizarUsuario(u.id, { activo: !u.activo }, token);
    cargar();
  }

  return (
    <>
    <div className="flex flex-col gap-6" inert={panelAbierto} aria-hidden={panelAbierto}>
      <PageHeader title="Usuarios" subtitle="Todas las cuentas del sistema. Solo desde aquí se activan o desactivan." />

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

      {(
        <div className="flex flex-col gap-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={abrirCrear}
              className="boton-glass-ambar inline-flex items-center gap-2 rounded-boton px-4 py-2.5 text-sm font-semibold text-brand-navy transition"
            >
              + Nuevo usuario
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <CampoBusqueda
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar usuario..."
              className="flex-1"
            />
            <Desplegable value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} className="campo px-3 py-2 text-sm">
              <option value="">Todos los roles</option>
              <option value="administrador">Administradores de sede</option>
              <option value="veterinario">Médicos</option>
              <option value="cliente">Clientes</option>
            </Desplegable>
            <Desplegable
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="campo px-3 py-2 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </Desplegable>
          </div>

          {cargando ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((k) => (
                <div key={k} className="h-14 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : errorCarga ? (
            <EstadoError mensaje={errorCarga} onReintentar={cargar} />
          ) : (
            <DataTable
              filaVacia="No hay usuarios que coincidan con los filtros."
              columns={[
                {
                  header: 'Usuario',
                  render: (u) => (
                    <div>
                      <p className="font-medium text-slate-900">{u.nombre_completo}</p>
                      <p className="text-xs text-slate-400">{u.correo}</p>
                    </div>
                  ),
                },
                {
                  header: 'Rol',
                  render: (u) => <span className="text-sm text-slate-600">{ETIQUETA_ROL[u.rol] ?? u.rol}</span>,
                },
                {
                  header: 'Sede',
                  render: (u) => <span className="text-sm text-slate-600">{sedes.find((s) => s.id === u.sede_id)?.nombre ?? '—'}</span>,
                },
                {
                  header: 'Estado',
                  render: (u) => (
                    <StatusToggle
                      checked={u.activo}
                      onChange={() => alternarActivo(u)}
                      disabled={u.id === usuario.id}
                      label={u.activo ? 'Activo' : 'Inactivo'}
                    />
                  ),
                },
              ]}
              rows={usuariosFiltrados}
              // Un cliente no tiene rol ni sede que editar: en su fila solo
              // se cambia el estado de la cuenta.
              actions={(u) =>
                u.rol === 'cliente' ? null : (
                <button
                  type="button"
                  onClick={() => abrirEditar(u)}
                  className="boton-texto rounded-boton px-3 py-1.5 text-sm font-medium text-brand-blue-600 transition"
                >
                  Editar
                </button>
                )
              }
            />
          )}
        </div>
      )}

    </div>

    <SidePanel
      isOpen={panelAbierto}
      onClose={() => setPanelAbierto(false)}
      title={usuarioEditando ? 'Editar usuario' : 'Nuevo usuario'}
      footer={
        <button
          type="submit"
          form="form-usuario-config"
          disabled={guardando}
          className="w-full rounded-boton bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-700 disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      }
    >
        <form id="form-usuario-config" onSubmit={guardar} className="flex flex-col gap-4">
          <Campo id="nombre-usuario-config" label="Nombre completo" value={form.nombreCompleto} onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} required />
          <Campo
            id="correo-usuario-config"
            label="Correo"
            type="email"
            value={form.correo}
            disabled={Boolean(usuarioEditando)}
            onChange={(e) => setForm({ ...form, correo: e.target.value })}
            required={!usuarioEditando}
          />
          {!usuarioEditando && (
            <p className="text-xs text-slate-500">
              La contraseña se genera automáticamente y se envía por correo al usuario.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="rol-usuario-config" className="text-sm font-medium text-slate-700">
              Rol<span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
            </label>
            <Desplegable
              id="rol-usuario-config"
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
              className="campo px-3 py-2 text-sm"
            >
              <option value="veterinario">Médico Veterinario</option>
              <option value="administrador">Administrador</option>
            </Desplegable>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sede-usuario-config" className="text-sm font-medium text-slate-700">
              Sede<span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
            </label>
            <Desplegable
              id="sede-usuario-config"
              value={form.sedeId}
              onChange={(e) => setForm({ ...form, sedeId: e.target.value })}
              className="campo px-3 py-2 text-sm"
            >
              <option value="">Selecciona una sede</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </Desplegable>
          </div>

          <Campo id="telefono-usuario-config" label="Teléfono (opcional)" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />

          {usuarioEditando && (
            <StatusToggle
              checked={form.activo}
              onChange={(valor) => setForm({ ...form, activo: valor })}
              disabled={usuarioEditando.id === usuario.id}
              label="Usuario activo"
              helpText={usuarioEditando.id === usuario.id ? 'No puedes desactivar tu propia cuenta.' : 'Si se desactiva, no podrá iniciar sesión.'}
            />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
    </SidePanel>
    </>
  );
}
