// components/admin/PanelCatalogos.jsx
// Catalogos (superadministrador): las listas de opciones del sistema, que
// se cambian sin programar. Dos pestañas:
// - Categorias y especialidades: es un solo catalogo. Clasifica los
//   servicios y es la lista de especialidades de los medicos.
// - Especies y razas: lo que ofrecen los formularios de mascota. Una
//   especie sin razas activas pide la raza como texto libre.
// Regla comun (decision de Oriana): nada se elimina, se desactiva. Lo
// desactivado deja de ofrecerse en registros nuevos; lo que ya lo usa lo
// conserva. Por eso cada fila dice cuantos registros la usan.
// Renombrar corrige el nombre tambien en las mascotas que ya lo tienen.
import { useEffect, useState } from 'react';
import {
  actualizarCategoriaCatalogo,
  actualizarEspecieCatalogo,
  actualizarRazaCatalogo,
  crearCategoriaCatalogo,
  crearEspecieCatalogo,
  crearRazaCatalogo,
  obtenerCategoriasCatalogo,
  obtenerEspeciesCatalogo,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { olvidarCatalogoEspecies } from '../../hooks/useCatalogoEspecies';
import { PageHeader } from '../ui/PageHeader';
import { Tabs } from '../ui/Tabs';
import { StatusToggle } from '../ui/StatusToggle';
import { EstadoError } from '../ui/EstadoError';
import { COLORES_CATEGORIA } from '../ui/CategoryBadge';
import { Campo } from '../form/Campo';
import { IconoAve, IconoCheck, IconoGato, IconoLapiz, IconoMas, IconoPata, IconoPerro } from '../icons';

const TABS = [
  { id: 'categorias', label: 'Categorías y especialidades' },
  { id: 'especies', label: 'Especies y razas' },
];

const ICONOS_ESPECIE = [
  { id: 'perro', nombre: 'Perro', Icono: IconoPerro },
  { id: 'gato', nombre: 'Gato', Icono: IconoGato },
  { id: 'ave', nombre: 'Ave', Icono: IconoAve },
  { id: 'pata', nombre: 'Huella', Icono: IconoPata },
];
const iconoDe = (id) => ICONOS_ESPECIE.find((i) => i.id === id)?.Icono ?? IconoPata;

const NOMBRE_COLOR = { blue: 'Azul', amber: 'Ámbar', teal: 'Verde azulado', purple: 'Morado', pink: 'Rosa', cyan: 'Celeste', orange: 'Naranja' };

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

function Desactivado() {
  return <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">Desactivada</span>;
}

// Opciones como botones (pocas y fijas): color de categoria o icono de especie.
function Opciones({ etiqueta, opciones, valor, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{etiqueta}</span>
      <div role="radiogroup" aria-label={etiqueta} className="flex flex-wrap gap-2">
        {opciones.map((opcion) => {
          const elegida = opcion.id === valor;
          return (
            <button
              key={opcion.id}
              type="button"
              role="radio"
              aria-checked={elegida}
              onClick={() => onChange(opcion.id)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-boton px-3 py-1.5 text-sm transition ${
                elegida ? 'bg-blue-50 font-semibold text-brand-blue-700 ring-2 ring-brand-blue' : 'bg-white font-medium text-slate-700 ring-1 ring-slate-300'
              }`}
            >
              {opcion.muestra}
              {opcion.nombre}
              {elegida && <IconoCheck className="h-3.5 w-3.5" peso="bold" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Formulario corto en linea: crear o renombrar (categoria, especie o raza).
function FormularioEnLinea({ id, titulo, inicial, extra, textoGuardar, onGuardar, onCancelar }) {
  const [valores, setValores] = useState(inicial);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    if (!valores.nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await onGuardar({ ...valores, nombre: valores.nombre.trim() });
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-2 ring-brand-blue">
      <p className="text-sm font-semibold text-brand-navy">{titulo}</p>
      <Campo id={id} label="Nombre" value={valores.nombre} maxLength={80} onChange={(e) => setValores({ ...valores, nombre: e.target.value })} required />
      {extra?.(valores, setValores)}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancelar} disabled={guardando} className="boton-texto rounded-boton px-3 py-2 text-sm font-semibold text-slate-700 transition">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="rounded-boton bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : textoGuardar}
        </button>
      </div>
    </form>
  );
}

function BotonEditar({ onClick, etiqueta }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="boton-texto inline-flex items-center gap-1.5 rounded-boton px-3 py-1.5 text-sm font-medium text-brand-blue-700 transition"
    >
      <IconoLapiz className="h-4 w-4" />
      Editar
    </button>
  );
}

function BotonNuevo({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="boton-glass-ambar inline-flex shrink-0 items-center gap-2 rounded-boton px-4 py-2.5 text-sm font-semibold text-brand-navy transition"
    >
      <IconoMas className="h-4 w-4" />
      {children}
    </button>
  );
}

// ------------------------------------------------------------ categorias
function Categorias({ token }) {
  const [categorias, setCategorias] = useState(null);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null); // 'nueva' | id
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerCategoriasCatalogo(token)
      .then((datos) => vigente && (setCategorias(datos.categorias), setError('')))
      .catch((err) => vigente && setError(err.message || 'No se pudieron cargar las categorías.'));
    return () => {
      vigente = false;
    };
  }, [token, intento]);

  const recargar = () => setIntento((n) => n + 1);
  const colores = Object.keys(COLORES_CATEGORIA).map((id) => ({
    id,
    nombre: NOMBRE_COLOR[id],
    muestra: <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORES_CATEGORIA[id].dot }} />,
  }));
  const campoColor = (valores, setValores) => <Opciones etiqueta="Color" opciones={colores} valor={valores.color} onChange={(color) => setValores({ ...valores, color })} />;

  if (error) return <EstadoError mensaje={error} onReintentar={recargar} />;
  if (!categorias) return <div className="h-40 animate-pulse rounded-2xl bg-white/20" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-white/90">
          Clasifican los servicios y son la lista de especialidades de los médicos. {plural(categorias.length, 'categoría', 'categorías')},{' '}
          {categorias.filter((c) => c.activo).length} activas.
        </p>
        <BotonNuevo onClick={() => setEditando('nueva')}>Nueva categoría</BotonNuevo>
      </div>

      {editando === 'nueva' && (
        <FormularioEnLinea
          id="categoria-nueva"
          titulo="Nueva categoría"
          inicial={{ nombre: '', color: 'blue' }}
          extra={campoColor}
          textoGuardar="Crear categoría"
          onCancelar={() => setEditando(null)}
          onGuardar={async (valores) => {
            await crearCategoriaCatalogo(valores, token);
            setEditando(null);
            recargar();
          }}
        />
      )}

      <ul className="flex flex-col gap-2">
        {categorias.map((categoria) =>
          editando === categoria.id ? (
            <li key={categoria.id}>
              <FormularioEnLinea
                id={`categoria-${categoria.id}`}
                titulo={`Editar “${categoria.nombre}”`}
                inicial={{ nombre: categoria.nombre, color: categoria.color }}
                extra={campoColor}
                textoGuardar="Guardar cambios"
                onCancelar={() => setEditando(null)}
                onGuardar={async (valores) => {
                  await actualizarCategoriaCatalogo(categoria.id, valores, token);
                  setEditando(null);
                  recargar();
                }}
              />
            </li>
          ) : (
            <li key={categoria.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: COLORES_CATEGORIA[categoria.color]?.dot }} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                  {categoria.nombre}
                  {!categoria.activo && <Desactivado />}
                </p>
                <p className="text-xs text-slate-700">
                  {plural(categoria.servicios, 'servicio', 'servicios')} · {plural(categoria.medicos, 'médico', 'médicos')} con esta especialidad
                </p>
              </div>
              <StatusToggle
                checked={categoria.activo}
                onChange={async () => {
                  await actualizarCategoriaCatalogo(categoria.id, { activo: !categoria.activo }, token);
                  recargar();
                }}
                label={categoria.activo ? 'Activa' : 'Inactiva'}
              />
              <BotonEditar onClick={() => setEditando(categoria.id)} etiqueta={`Editar la categoría ${categoria.nombre}`} />
            </li>
          )
        )}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------ especies y razas
function Especies({ token }) {
  const [especies, setEspecies] = useState(null);
  const [error, setError] = useState('');
  const [elegidaId, setElegidaId] = useState(null);
  const [editando, setEditando] = useState(null); // 'especie-nueva' | 'especie' | 'raza-nueva' | id de raza
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerEspeciesCatalogo(token)
      .then((datos) => vigente && (setEspecies(datos.especies), setError('')))
      .catch((err) => vigente && setError(err.message || 'No se pudieron cargar las especies.'));
    return () => {
      vigente = false;
    };
  }, [token, intento]);

  // Tras cualquier cambio: recargar esta pantalla y hacer que los
  // formularios de mascota vuelvan a pedir la lista.
  function recargar() {
    olvidarCatalogoEspecies();
    setEditando(null);
    setIntento((n) => n + 1);
  }

  const iconos = ICONOS_ESPECIE.map(({ id, nombre, Icono }) => ({ id, nombre, muestra: <Icono className="h-5 w-5" /> }));
  const campoIcono = (valores, setValores) => <Opciones etiqueta="Icono del botón" opciones={iconos} valor={valores.icono} onChange={(icono) => setValores({ ...valores, icono })} />;

  if (error) return <EstadoError mensaje={error} onReintentar={() => setIntento((n) => n + 1)} />;
  if (!especies) return <div className="h-40 animate-pulse rounded-2xl bg-white/20" />;

  const elegida = especies.find((e) => e.id === elegidaId) ?? especies[0];
  const razasActivas = elegida ? elegida.razas.filter((r) => r.activo).length : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-white/90">
          Son las opciones que ven el cliente y el personal al registrar una mascota. Elige una especie para ver sus razas.
        </p>
        <BotonNuevo onClick={() => setEditando('especie-nueva')}>Nueva especie</BotonNuevo>
      </div>

      {editando === 'especie-nueva' && (
        <FormularioEnLinea
          id="especie-nueva"
          titulo="Nueva especie"
          inicial={{ nombre: '', icono: 'pata' }}
          extra={campoIcono}
          textoGuardar="Crear especie"
          onCancelar={() => setEditando(null)}
          onGuardar={async (valores) => {
            const { especie } = await crearEspecieCatalogo(valores, token);
            setElegidaId(especie.id);
            recargar();
          }}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        {/* Especies */}
        <ul role="tablist" aria-label="Especies" className="flex flex-col gap-2">
          {especies.map((especie) => {
            const Icono = iconoDe(especie.icono);
            const activa = especie.id === elegida?.id;
            return (
              <li key={especie.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  onClick={() => {
                    setElegidaId(especie.id);
                    setEditando(null);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-sm transition ${
                    activa ? 'ring-2 ring-brand-amber' : 'ring-1 ring-slate-200'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${especie.activo ? 'bg-blue-100 text-brand-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                    <Icono className="h-5 w-5" peso="duotone" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                      {especie.nombre}
                      {!especie.activo && <Desactivado />}
                    </span>
                    <span className="block text-xs text-slate-700">
                      {plural(especie.razas.filter((r) => r.activo).length, 'raza activa', 'razas activas')} · {plural(especie.mascotas, 'mascota', 'mascotas')}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Detalle de la especie elegida */}
        {elegida && (
          <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            {editando === 'especie' ? (
              <FormularioEnLinea
                id="especie-editar"
                titulo={`Editar “${elegida.nombre}”`}
                inicial={{ nombre: elegida.nombre, icono: elegida.icono }}
                extra={campoIcono}
                textoGuardar="Guardar cambios"
                onCancelar={() => setEditando(null)}
                onGuardar={async (valores) => {
                  await actualizarEspecieCatalogo(elegida.id, valores, token);
                  recargar();
                }}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h2 className="min-w-0 flex-1 font-heading text-lg font-semibold text-brand-navy">{elegida.nombre}</h2>
                <StatusToggle
                  checked={elegida.activo}
                  onChange={async () => {
                    await actualizarEspecieCatalogo(elegida.id, { activo: !elegida.activo }, token);
                    recargar();
                  }}
                  label={elegida.activo ? 'Activa' : 'Inactiva'}
                />
                <BotonEditar onClick={() => setEditando('especie')} etiqueta={`Editar la especie ${elegida.nombre}`} />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-900/10 pt-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Razas</h3>
                <p className="text-xs text-slate-700">
                  {razasActivas === 0
                    ? 'Sin razas activas: en el formulario la raza se escribe a mano.'
                    : `${plural(razasActivas, 'activa', 'activas')} de ${elegida.razas.length}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditando('raza-nueva')}
                className="boton-texto inline-flex items-center gap-1.5 rounded-boton px-3 py-1.5 text-sm font-semibold text-brand-blue-700 transition"
              >
                <IconoMas className="h-4 w-4" />
                Agregar raza
              </button>
            </div>

            {editando === 'raza-nueva' && (
              <FormularioEnLinea
                id="raza-nueva"
                titulo={`Nueva raza de ${elegida.nombre}`}
                inicial={{ nombre: '' }}
                textoGuardar="Agregar raza"
                onCancelar={() => setEditando(null)}
                onGuardar={async (valores) => {
                  await crearRazaCatalogo(elegida.id, valores.nombre, token);
                  recargar();
                }}
              />
            )}

            <ul className="flex flex-col divide-y divide-slate-900/10">
              {elegida.razas.map((raza) =>
                editando === raza.id ? (
                  <li key={raza.id} className="py-2">
                    <FormularioEnLinea
                      id={`raza-${raza.id}`}
                      titulo={`Renombrar “${raza.nombre}”`}
                      inicial={{ nombre: raza.nombre }}
                      textoGuardar="Guardar"
                      onCancelar={() => setEditando(null)}
                      onGuardar={async (valores) => {
                        await actualizarRazaCatalogo(raza.id, { nombre: valores.nombre }, token);
                        recargar();
                      }}
                    />
                  </li>
                ) : (
                  <li key={raza.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                    <div className="min-w-0 flex-1">
                      <p className={`flex flex-wrap items-center gap-2 text-sm ${raza.activo ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                        {raza.nombre}
                        {!raza.activo && <Desactivado />}
                      </p>
                      {raza.mascotas > 0 && <p className="text-xs text-slate-700">{plural(raza.mascotas, 'mascota', 'mascotas')}</p>}
                    </div>
                    <StatusToggle
                      checked={raza.activo}
                      onChange={async () => {
                        await actualizarRazaCatalogo(raza.id, { activo: !raza.activo }, token);
                        recargar();
                      }}
                      label={raza.activo ? 'Activa' : 'Inactiva'}
                    />
                    <BotonEditar onClick={() => setEditando(raza.id)} etiqueta={`Renombrar la raza ${raza.nombre}`} />
                  </li>
                )
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

export function PanelCatalogos() {
  const { token } = useAuth();
  const [pestana, setPestana] = useState('categorias');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Catálogos" subtitle="Las listas de opciones del sistema. Nada se elimina: lo que desactivas deja de ofrecerse, y lo que ya lo usa lo conserva." />
      <Tabs sobreVidrio items={TABS} activeItem={pestana} onChange={setPestana} />
      {pestana === 'categorias' ? <Categorias token={token} /> : <Especies token={token} />}
    </div>
  );
}
