// components/admin/PanelDatos.jsx
// Datos (superadministrador): ver y cuidar la informacion del sistema sin
// abrir la base de datos. Tres pestañas:
// - Explorar: cualquier entidad en SOLO LECTURA, con busqueda, filtros,
//   orden, paginas y exportacion a CSV. Al abrir una fila se ve el registro
//   completo, lo relacionado y, si aplica, las correcciones disponibles.
// - Bitacora: quien cambio que y cuando.
// - Copia de seguridad: descarga un archivo .sql con toda la base.
// No hay edicion libre de tablas ni eliminacion: las correcciones son pocas
// y cada una tiene sus reglas (el servidor las impone).
import { useEffect, useState } from 'react';
import {
  corregirCitaDatos,
  corregirUsuarioDatos,
  descargarDatos,
  obtenerBitacora,
  obtenerEntidadesDatos,
  obtenerMedicosParaCita,
  obtenerRegistroDatos,
  obtenerRegistrosDatos,
  reactivarMascotaDatos,
  reasignarMascotaDatos,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../ui/PageHeader';
import { Tabs } from '../ui/Tabs';
import { SidePanel } from '../ui/SidePanel';
import { EstadoError } from '../ui/EstadoError';
import { Campo } from '../form/Campo';
import { CampoBusqueda } from '../form/CampoBusqueda';
import { Desplegable } from '../form/Desplegable';
import { IconoAlerta, IconoBaseDatos, IconoChevronAbajo, IconoDescargar, IconoLapiz, IconoOjo } from '../icons';
import { ROLES_DATOS as ROLES, TITULO_DETALLE, formatearDato as formatear } from '../../utils/datos';
import { DetalleRegistro, FilaRelacionada } from './DetalleRegistroDatos';

const TABS = [
  { id: 'explorar', label: 'Explorar' },
  { id: 'bitacora', label: 'Bitácora' },
  { id: 'respaldo', label: 'Copia de seguridad' },
];

function Paginas({ pagina, total, porPagina, onCambiar }) {
  const ultima = Math.max(1, Math.ceil(total / porPagina));
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-900/10 px-4 py-3 text-sm text-slate-700">
      <span>
        Mostrando {desde} - {Math.min(total, pagina * porPagina)} de {total}
      </span>
      <div className="flex gap-1">
        <button type="button" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)} className="boton-texto rounded-boton px-3 py-1.5 font-medium text-brand-blue-700 transition disabled:opacity-40">
          Anterior
        </button>
        <button type="button" disabled={pagina >= ultima} onClick={() => onCambiar(pagina + 1)} className="boton-texto rounded-boton px-3 py-1.5 font-medium text-brand-blue-700 transition disabled:opacity-40">
          Siguiente
        </button>
      </div>
    </div>
  );
}

function Mensaje({ estado }) {
  if (!estado) return null;
  return (
    <p role="alert" className={`rounded-lg px-3 py-2 text-sm ring-1 ${estado.tipo === 'ok' ? 'bg-green-50 text-green-800 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'}`}>
      {estado.texto}
    </p>
  );
}

const CLASE_BOTON = 'rounded-boton bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60';

// ------------------------------------------------------------ correcciones
// Cada correccion es un formulario propio. `alTerminar(texto)` recarga el
// registro y la tabla.
function CorregirUsuario({ registro, token, alTerminar }) {
  const [form, setForm] = useState({ nombreCompleto: registro.nombre ?? '', correo: registro.correo ?? '', telefono: registro.telefono ?? '' });
  const [estado, setEstado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setEstado(null);
    try {
      await corregirUsuarioDatos(registro.id, form, token);
      alTerminar('Datos de la cuenta corregidos.');
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-3">
      <p className="text-xs text-slate-700">Para un nombre, teléfono o correo mal escritos. El rol, la sede y el estado se cambian en Usuarios.</p>
      <Campo id="dato-nombre" label="Nombre completo" value={form.nombreCompleto} onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} required />
      <Campo id="dato-correo" label="Correo" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} required />
      <Campo id="dato-telefono" label="Teléfono (opcional)" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
      <Mensaje estado={estado} />
      <button type="submit" disabled={guardando} className={`self-end ${CLASE_BOTON}`}>
        {guardando ? 'Guardando...' : 'Guardar corrección'}
      </button>
    </form>
  );
}

function CorregirMascota({ registro, token, alTerminar }) {
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [estado, setEstado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Clientes activos que coinciden con lo escrito (minimo 2 letras).
  useEffect(() => {
    const termino = busqueda.trim();
    if (termino.length < 2) return undefined;
    let vigente = true;
    const espera = setTimeout(() => {
      obtenerRegistrosDatos('usuarios', { busqueda: termino, rol: 'cliente', activo: 'true' }, token)
        .then((datos) => vigente && setClientes(datos.filas))
        .catch(() => vigente && setClientes([]));
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [busqueda, token]);

  async function ejecutar(accion, textoOk) {
    setGuardando(true);
    setEstado(null);
    try {
      const respuesta = await accion();
      alTerminar(respuesta.mensaje || textoOk);
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
      setGuardando(false);
    }
  }

  const opciones = busqueda.trim().length < 2 ? [] : clientes;

  return (
    <div className="flex flex-col gap-5">
      {!registro.activo && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-slate-900">Reactivar la mascota</p>
          <p className="text-xs text-slate-700">Está dada de baja. Reactívala si la baja fue un error: vuelve a aparecer en la cuenta de su dueño.</p>
          <button type="button" disabled={guardando} onClick={() => ejecutar(() => reactivarMascotaDatos(registro.id, token))} className={`self-start ${CLASE_BOTON}`}>
            Reactivar mascota
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-slate-900">Pasarla a otro dueño</p>
        <p className="text-xs text-slate-700">
          Para una mascota registrada en la cuenta equivocada. Dueño actual: <strong>{registro.dueno}</strong>. Sus citas pasan también al dueño nuevo.
        </p>
        <CampoBusqueda value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar cliente por nombre o correo..." />
        <Desplegable id="dato-dueno" aria-label="Nuevo dueño" value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="campo w-full px-3 py-2 text-sm">
          <option value="">{opciones.length === 0 ? 'Escribe para buscar un cliente' : 'Selecciona el nuevo dueño'}</option>
          {opciones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} ({c.correo})
            </option>
          ))}
        </Desplegable>
        <button type="button" disabled={guardando || !clienteId} onClick={() => ejecutar(() => reasignarMascotaDatos(registro.id, clienteId, token))} className={`self-start ${CLASE_BOTON}`}>
          Pasar a este dueño
        </button>
      </div>
      <Mensaje estado={estado} />
    </div>
  );
}

function CorregirCita({ registro, token, alTerminar }) {
  const [medicos, setMedicos] = useState([]);
  const [medicoId, setMedicoId] = useState(registro.medico_id);
  const [estadoCita, setEstadoCita] = useState(registro.estado);
  const [estado, setEstado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    obtenerMedicosParaCita(registro.id, token)
      .then((datos) => vigente && setMedicos(datos.medicos))
      .catch(() => vigente && setMedicos([]));
    return () => {
      vigente = false;
    };
  }, [registro.id, token]);

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setEstado(null);
    try {
      await corregirCitaDatos(registro.id, { estado: estadoCita, medicoId }, token);
      alTerminar('Cita corregida.');
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
      setGuardando(false);
    }
  }

  const sinCambios = medicoId === registro.medico_id && estadoCita === registro.estado;
  // El medico actual siempre aparece, aunque ya no sea candidato.
  const lista = medicos.some((m) => m.id === registro.medico_id) ? medicos : [{ id: registro.medico_id, nombre_completo: registro.medico }, ...medicos];

  return (
    <form onSubmit={guardar} className="flex flex-col gap-3">
      <p className="text-xs text-slate-700">Para una cita que quedó con el estado o el médico equivocados. La fecha y la hora se cambian reprogramando desde la cuenta del cliente.</p>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">Estado</span>
        <div role="radiogroup" aria-label="Estado de la cita" className="flex gap-2">
          {[
            ['agendada', 'Agendada'],
            ['cancelada', 'Cancelada'],
          ].map(([valor, etiqueta]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={estadoCita === valor}
              onClick={() => setEstadoCita(valor)}
              className={`min-h-10 rounded-boton px-4 text-sm transition ${
                estadoCita === valor ? 'bg-blue-50 font-semibold text-brand-blue-700 ring-2 ring-brand-blue' : 'bg-white font-medium text-slate-700 ring-1 ring-slate-300'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dato-medico" className="text-sm font-medium text-slate-700">
          Médico
        </label>
        <Desplegable id="dato-medico" value={medicoId} onChange={(e) => setMedicoId(e.target.value)} className="campo w-full px-3 py-2 text-sm">
          {lista.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre_completo}
            </option>
          ))}
        </Desplegable>
        <p className="text-xs text-slate-700">Solo aparecen los médicos activos de esa sede que prestan ese servicio.</p>
      </div>
      <Mensaje estado={estado} />
      <button type="submit" disabled={guardando || sinCambios} className={`self-end ${CLASE_BOTON}`}>
        {guardando ? 'Guardando...' : 'Guardar corrección'}
      </button>
    </form>
  );
}

const CORRECCIONES = { usuarios: CorregirUsuario, mascotas: CorregirMascota, citas: CorregirCita };

// Lo relacionado con un registro: se consulta con el mismo explorador.
const RELACIONADOS = {
  usuarios: (r) =>
    r.rol === 'cliente'
      ? [
          { titulo: 'Sus mascotas', vacio: 'No tiene mascotas registradas.', entidad: 'mascotas', filtro: { cliente_id: r.id }, columnas: ['nombre', 'especie', 'raza', 'activo'] },
          { titulo: 'Sus citas', vacio: 'No tiene citas.', entidad: 'citas', filtro: { cliente_id: r.id }, columnas: ['fecha', 'mascota', 'servicio', 'estado'] },
        ]
      : r.rol === 'veterinario'
        ? [{ titulo: 'Citas que atiende', vacio: 'No tiene citas asignadas.', entidad: 'citas', filtro: { medico_id: r.id }, columnas: ['fecha', 'mascota', 'cliente', 'estado'] }]
        : [],
  mascotas: (r) => [{ titulo: 'Sus citas', vacio: 'No tiene citas.', entidad: 'citas', filtro: { mascota_id: r.id }, columnas: ['fecha', 'servicio', 'medico', 'estado'] }],
};

function Relacionado({ definicion, entidades, token }) {
  const [datos, setDatos] = useState(null);
  const entidad = entidades.find((e) => e.nombre === definicion.entidad);
  const columnas = definicion.columnas.map((clave) => entidad.columnas.find((c) => c.clave === clave));
  const filtro = JSON.stringify(definicion.filtro);

  useEffect(() => {
    let vigente = true;
    obtenerRegistrosDatos(definicion.entidad, JSON.parse(filtro), token)
      .then((respuesta) => vigente && setDatos(respuesta))
      .catch(() => vigente && setDatos({ filas: [], total: 0 }));
    return () => {
      vigente = false;
    };
  }, [definicion.entidad, filtro, token]);

  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
        {definicion.titulo}
        {datos && <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-800">{datos.total}</span>}
      </h3>
      {!datos ? (
        <div className="h-14 animate-pulse rounded-xl bg-slate-200" />
      ) : datos.filas.length === 0 ? (
        <p className="rounded-xl bg-white/50 px-3 py-4 text-center text-sm text-slate-700 ring-1 ring-slate-900/10">{definicion.vacio}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-900/10 rounded-xl bg-white/70 ring-1 ring-slate-900/10">
          {datos.filas.slice(0, 8).map((fila) => (
            <FilaRelacionada key={fila.id} entidad={definicion.entidad} fila={fila} columnas={columnas} />
          ))}
          {datos.total > 8 && <li className="px-3 py-2 text-xs text-slate-700">y {datos.total - 8} más.</li>}
        </ul>
      )}
    </section>
  );
}

// ------------------------------------------------------------ explorar
function Explorar({ token }) {
  const [entidades, setEntidades] = useState(null);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('usuarios');
  const [consulta, setConsulta] = useState({ busqueda: '', pagina: 1, orden: '', direccion: 'asc', filtros: {} });
  const [datos, setDatos] = useState(null);
  const [intento, setIntento] = useState(0);
  const [abierto, setAbierto] = useState(null); // { registro, columnas }
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    obtenerEntidadesDatos(token)
      .then((respuesta) => setEntidades(respuesta.entidades))
      .catch((err) => setError(err.message || 'No se pudieron cargar los datos.'));
  }, [token]);

  const parametros = JSON.stringify({ ...consulta.filtros, busqueda: consulta.busqueda.trim(), pagina: consulta.pagina, orden: consulta.orden, direccion: consulta.direccion });
  useEffect(() => {
    let vigente = true;
    // Espera corta: no se consulta en cada tecla de la busqueda.
    const espera = setTimeout(() => {
      obtenerRegistrosDatos(nombre, JSON.parse(parametros), token)
        .then((respuesta) => vigente && (setDatos(respuesta), setError('')))
        .catch((err) => vigente && setError(err.message || 'No se pudieron cargar los registros.'));
    }, 250);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [nombre, parametros, token, intento]);

  if (error && !entidades) return <EstadoError mensaje={error} onReintentar={() => window.location.reload()} />;
  if (!entidades) return <div className="h-48 animate-pulse rounded-2xl bg-white/20" />;

  const entidad = entidades.find((e) => e.nombre === nombre);
  const cambiar = (cambios) => setConsulta((actual) => ({ ...actual, pagina: 1, ...cambios }));

  function elegirEntidad(siguiente) {
    setNombre(siguiente);
    setDatos(null);
    setConsulta({ busqueda: '', pagina: 1, orden: '', direccion: 'asc', filtros: {} });
  }

  function ordenarPor(clave) {
    cambiar({ orden: clave, direccion: consulta.orden === clave && consulta.direccion === 'asc' ? 'desc' : 'asc' });
  }

  async function abrir(id) {
    setCorrigiendo(false);
    setAviso(null);
    try {
      setAbierto(await obtenerRegistroDatos(nombre, id, token));
    } catch (err) {
      setError(err.message);
    }
  }

  async function exportar() {
    setExportando(true);
    try {
      await descargarDatos(`/datos/${nombre}/exportar`, { ...consulta.filtros, busqueda: consulta.busqueda.trim(), orden: consulta.orden, direccion: consulta.direccion }, token, `${nombre}.csv`);
    } catch (err) {
      setError(err.message);
    } finally {
      setExportando(false);
    }
  }

  const Correccion = CORRECCIONES[nombre];
  const puedeCorregir = Correccion && !(nombre === 'usuarios' && abierto?.registro.rol === 'superadministrador');
  const relacionados = abierto ? RELACIONADOS[nombre]?.(abierto.registro) ?? [] : [];
  const filtrables = entidad.columnas.filter((c) => c.opciones);

  return (
    <>
      <div className="flex flex-col gap-4" inert={Boolean(abierto)} aria-hidden={Boolean(abierto)}>
        {/* Entidades: pocas y fijas, como botones. */}
        <div role="tablist" aria-label="Entidad" className="flex flex-wrap gap-2">
          {entidades.map((e) => (
            <button
              key={e.nombre}
              type="button"
              role="tab"
              aria-selected={e.nombre === nombre}
              onClick={() => elegirEntidad(e.nombre)}
              className={`rounded-boton px-4 py-2 text-sm transition ${
                e.nombre === nombre ? 'bg-white font-semibold text-brand-navy' : 'bg-white/15 font-medium text-white ring-1 ring-white/30'
              }`}
            >
              {e.etiqueta}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <CampoBusqueda value={consulta.busqueda} onChange={(e) => cambiar({ busqueda: e.target.value })} placeholder={`Buscar en ${entidad.etiqueta.toLowerCase()}...`} className="flex-1" />
          {filtrables.map((c) => (
            <Desplegable
              key={c.clave}
              aria-label={c.etiqueta}
              value={consulta.filtros[c.clave] ?? ''}
              onChange={(e) => cambiar({ filtros: { ...consulta.filtros, [c.clave]: e.target.value } })}
              className="campo px-3 py-2 text-sm"
            >
              <option value="">{c.etiqueta}: todos</option>
              {c.opciones.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {c.etiqueta}: {o.etiqueta}
                </option>
              ))}
            </Desplegable>
          ))}
          <button
            type="button"
            onClick={exportar}
            disabled={exportando || !datos || datos.total === 0}
            className="inline-flex shrink-0 items-center gap-2 rounded-boton bg-white/90 px-4 py-2 text-sm font-semibold text-brand-navy ring-1 ring-white transition disabled:opacity-60"
          >
            <IconoDescargar className="h-4 w-4" />
            {exportando ? 'Exportando...' : 'Exportar a Excel (CSV)'}
          </button>
        </div>

        {error ? (
          <EstadoError mensaje={error} onReintentar={() => setIntento((n) => n + 1)} />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-900/10 text-xs font-semibold uppercase tracking-wide text-slate-700">
                    {entidad.columnas.map((c) => {
                      const ordenada = consulta.orden === c.clave;
                      return (
                        <th key={c.clave} scope="col" aria-sort={ordenada ? (consulta.direccion === 'asc' ? 'ascending' : 'descending') : undefined} className="px-4 py-3">
                          <button type="button" onClick={() => ordenarPor(c.clave)} className="boton-texto inline-flex items-center gap-1 uppercase tracking-wide transition">
                            {c.etiqueta}
                            <IconoChevronAbajo className={`h-3 w-3 ${ordenada ? '' : 'opacity-0'} ${ordenada && consulta.direccion === 'asc' ? 'rotate-180' : ''}`} />
                          </button>
                        </th>
                      );
                    })}
                    {/* La columna Ver queda fija a la derecha: en tablas anchas (Citas) no hay que desplazarse para abrir un registro. */}
                    <th scope="col" className="sticky right-0 bg-[#eef2fb] px-4 py-3 text-left">
                      Ver
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!datos ? (
                    <tr>
                      <td colSpan={entidad.columnas.length + 1} className="px-4 py-8 text-center text-slate-700">
                        Cargando...
                      </td>
                    </tr>
                  ) : datos.filas.length === 0 ? (
                    <tr>
                      <td colSpan={entidad.columnas.length + 1} className="px-4 py-8 text-center text-slate-700">
                        No hay registros que coincidan.
                      </td>
                    </tr>
                  ) : (
                    datos.filas.map((fila) => (
                      <tr key={fila.id} className="border-b border-slate-900/5 last:border-0">
                        {entidad.columnas.map((c, i) => (
                          <td key={c.clave} className={`max-w-[16rem] truncate px-4 py-2.5 ${i === 0 ? 'font-medium text-slate-900' : 'text-slate-800'}`}>
                            {formatear(fila[c.clave], c)}
                          </td>
                        ))}
                        <td className="sticky right-0 bg-[#eef2fb] px-4 py-1.5 text-left shadow-[-8px_0_12px_-10px_rgb(15_23_42/0.35)]">
                          {/* -ml-2: el ojo queda alineado con el titulo de la columna. */}
                          <button
                            type="button"
                            onClick={() => abrir(fila.id)}
                            aria-label={`Ver ${formatear(fila[entidad.columnas[0].clave], entidad.columnas[0])}`}
                            title="Ver detalle"
                            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-brand-blue-700 transition hover:bg-brand-blue-600 hover:text-white"
                          >
                            <IconoOjo className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {datos && <Paginas pagina={datos.pagina} total={datos.total} porPagina={datos.porPagina} onCambiar={(pagina) => setConsulta((actual) => ({ ...actual, pagina }))} />}
          </div>
        )}
      </div>

      <SidePanel isOpen={Boolean(abierto)} onClose={() => setAbierto(null)} title={TITULO_DETALLE[nombre] ?? 'Detalle del registro'}>
        {abierto && (
          <div className="flex flex-col gap-6">
            <Mensaje estado={aviso} />
            <DetalleRegistro entidad={nombre} registro={abierto.registro} columnas={abierto.columnas} />

            {relacionados.map((definicion) => (
              <Relacionado key={definicion.titulo} definicion={definicion} entidades={entidades} token={token} />
            ))}

            {puedeCorregir && (
              <div className="flex flex-col gap-3 border-t border-slate-900/10 pt-5">
                {corrigiendo ? (
                  <>
                    <p className="font-heading text-base font-semibold text-brand-navy">Corregir</p>
                    <Correccion
                      key={abierto.registro.id}
                      registro={abierto.registro}
                      token={token}
                      alTerminar={async (texto) => {
                        setCorrigiendo(false);
                        setAbierto(await obtenerRegistroDatos(nombre, abierto.registro.id, token));
                        setAviso({ tipo: 'ok', texto });
                        setIntento((n) => n + 1);
                      }}
                    />
                    <button type="button" onClick={() => setCorrigiendo(false)} className="boton-texto self-start rounded-boton px-2 py-1 text-sm font-semibold text-slate-700 transition">
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-slate-700">Este registro es de solo lectura. Si tiene un error, usa una corrección: queda anotada en la bitácora.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setAviso(null);
                        setCorrigiendo(true);
                      }}
                      className="inline-flex items-center gap-2 self-start rounded-boton bg-white px-4 py-2 text-sm font-semibold text-brand-blue-700 ring-1 ring-brand-blue transition"
                    >
                      <IconoLapiz className="h-4 w-4" />
                      Corregir un dato
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </SidePanel>
    </>
  );
}

// ------------------------------------------------------------ bitacora
function Bitacora({ token }) {
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    const espera = setTimeout(() => {
      obtenerBitacora({ busqueda: busqueda.trim(), pagina }, token)
        .then((respuesta) => vigente && (setDatos(respuesta), setError('')))
        .catch((err) => vigente && setError(err.message || 'No se pudo cargar la bitácora.'));
    }, 250);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [busqueda, pagina, token, intento]);

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-3xl text-sm text-white/90">
        Cada cambio de configuración o corrección de datos queda anotado aquí: quién lo hizo, cuándo y sobre qué. No se puede editar ni borrar.
      </p>
      <CampoBusqueda
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setPagina(1);
        }}
        placeholder="Buscar por acción, persona o detalle..."
      />
      {error ? (
        <EstadoError mensaje={error} onReintentar={() => setIntento((n) => n + 1)} />
      ) : !datos ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white/20" />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {datos.filas.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-700">{busqueda.trim() ? 'Nada coincide con la búsqueda.' : 'Todavía no hay cambios registrados.'}</p>
          ) : (
            <ul className="divide-y divide-slate-900/10">
              {datos.filas.map((fila) => (
                <li key={fila.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
                  <span className="w-40 shrink-0 text-sm tabular-nums text-slate-700">
                    {new Date(fila.creado_en).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{fila.accion}</p>
                    {fila.detalle && <p className="break-words text-sm text-slate-800">{fila.detalle}</p>}
                    <p className="text-xs text-slate-700">
                      {fila.usuario_nombre} · {ROLES[fila.usuario_rol] ?? fila.usuario_rol}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Paginas pagina={datos.pagina} total={datos.total} porPagina={datos.porPagina} onCambiar={setPagina} />
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------ copia de seguridad
function Respaldo({ token }) {
  const [estado, setEstado] = useState(null);
  const [descargando, setDescargando] = useState(false);
  // La copia contiene toda la base: se confirma con la contraseña.
  const [contrasena, setContrasena] = useState('');

  async function descargar(evento) {
    evento.preventDefault();
    if (!contrasena) {
      setEstado({ tipo: 'error', texto: 'Escribe tu contraseña para descargar la copia.' });
      return;
    }
    setDescargando(true);
    setEstado(null);
    try {
      const nombre = await descargarDatos('/datos/respaldo', {}, token, 'respaldo-clinica.sql', { contrasena });
      setContrasena('');
      setEstado({ tipo: 'ok', texto: `Copia descargada: ${nombre}. Guárdala en un lugar seguro.` });
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setDescargando(false);
    }
  }

  return (
    <section className="flex max-w-3xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-brand-blue-700">
          <IconoBaseDatos className="h-5 w-5" peso="duotone" />
        </span>
        <div>
          <h2 className="font-heading text-base font-semibold text-brand-navy">Copia de seguridad de toda la base de datos</h2>
          <p className="text-sm text-slate-800">Descarga un archivo .sql con la estructura y todos los datos del sistema tal como están en este momento.</p>
        </div>
      </div>
      <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
        <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          El archivo contiene datos personales de clientes y las contraseñas cifradas. No lo compartas ni lo dejes en un equipo de uso común. Restaurar una copia no se hace desde el sistema: es una operación manual sobre la base de datos.
        </span>
      </p>
      <form onSubmit={descargar} className="flex flex-col gap-4">
        <div className="max-w-sm">
          <Campo
            id="contrasena-respaldo"
            label="Tu contraseña, para confirmar"
            type="password"
            autoComplete="current-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
        </div>
        <Mensaje estado={estado} />
        <button type="submit" disabled={descargando} className={`inline-flex items-center gap-2 self-start ${CLASE_BOTON}`}>
          <IconoDescargar className="h-4 w-4" />
          {descargando ? 'Generando la copia...' : 'Descargar copia de seguridad'}
        </button>
      </form>
    </section>
  );
}

export function PanelDatos() {
  const { token } = useAuth();
  const [pestana, setPestana] = useState('explorar');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Datos" subtitle="Consulta la información del sistema, corrige errores puntuales y guarda copias. Aquí nada se elimina." />
      <Tabs sobreVidrio items={TABS} activeItem={pestana} onChange={setPestana} />
      {pestana === 'explorar' && <Explorar token={token} />}
      {pestana === 'bitacora' && <Bitacora token={token} />}
      {pestana === 'respaldo' && <Respaldo token={token} />}
    </div>
  );
}
