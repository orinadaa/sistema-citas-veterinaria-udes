// components/admin/PanelCampos.jsx
// Configuracion > Campos: el administrador agrega campos a un formulario
// sin programar (ej. "Certificado de vacunación" en la mascota). Los
// formularios los leen de GET /api/campos y los dibujan solos (ver
// form/CamposAdicionales.jsx).
//
// REGLA DE NEGOCIO: un campo nunca se elimina, solo se desactiva. Por eso
// esta pantalla no tiene ningun boton de eliminar: desactivado, el campo
// deja de pedirse en registros nuevos y los valores ya guardados se
// conservan. Por la misma razon el tipo no se puede cambiar despues de
// crear el campo, y las opciones de una lista solo se desactivan.
//
// Hoy solo existe la entidad "Mascota"; el selector de formulario aparece
// solo cuando haya mas de una.
import { useEffect, useState } from 'react';
import { obtenerCampos, obtenerEntidadesCampos, crearCampo, actualizarCampo, reordenarCampos } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';
import { Desplegable } from '../form/Desplegable';
import { StatusToggle } from '../ui/StatusToggle';
import { SidePanel } from '../ui/SidePanel';
import { EstadoError } from '../ui/EstadoError';
import { IconoChevronAbajo, IconoDocumento, IconoLapiz, IconoMas, IconoX } from '../icons';

const NOMBRE_TIPO = {
  texto_corto: 'Texto corto',
  texto_largo: 'Texto largo',
  numero: 'Número',
  fecha: 'Fecha',
  booleano: 'Sí / No',
  seleccion: 'Lista de opciones',
  archivo: 'Archivo adjunto (PDF o imagen)',
};
const ORDEN_TIPOS = ['texto_corto', 'texto_largo', 'numero', 'fecha', 'booleano', 'seleccion', 'archivo'];

const FORM_VACIO = { etiqueta: '', tipo: 'texto_corto', ayuda: '', requerido: false, activo: true, opciones: [] };
const opcionNueva = () => ({ id: crypto.randomUUID(), valor: null, etiqueta: '', activo: true });

export function PanelCampos() {
  const { token } = useAuth();
  const [entidades, setEntidades] = useState([{ id: 'mascota', nombre: 'Mascota' }]);
  const [entidad, setEntidad] = useState('mascota');
  const [campos, setCampos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [errorLista, setErrorLista] = useState('');
  const [ocupado, setOcupado] = useState(null);
  const [recarga, setRecarga] = useState(0);

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [campoEditando, setCampoEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    obtenerEntidadesCampos(token)
      .then((datos) => vigente && setEntidades(datos.entidades))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [token]);

  useEffect(() => {
    let vigente = true;
    obtenerCampos(entidad, token)
      .then((datos) => {
        if (!vigente) return;
        setCampos(datos.campos);
        setErrorCarga('');
      })
      .catch((err) => vigente && setErrorCarga(err.message || 'No se pudieron cargar los campos.'))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [entidad, token, recarga]);

  const recargar = () => setRecarga((n) => n + 1);

  function abrir(campo) {
    setCampoEditando(campo);
    setForm(
      campo
        ? {
            etiqueta: campo.etiqueta,
            tipo: campo.tipo,
            ayuda: campo.ayuda || '',
            requerido: campo.requerido,
            activo: campo.activo,
            opciones: campo.opciones.map((o) => ({ ...o, id: o.valor })),
          }
        : { ...FORM_VACIO, opciones: [opcionNueva(), opcionNueva()] }
    );
    setError('');
    setPanelAbierto(true);
  }

  function cambiarOpcion(id, cambios) {
    setForm((actual) => ({ ...actual, opciones: actual.opciones.map((o) => (o.id === id ? { ...o, ...cambios } : o)) }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    const etiqueta = form.etiqueta.trim();
    if (!etiqueta) {
      setError('Escribe el nombre del campo.');
      return;
    }
    const opciones = form.opciones.filter((o) => o.etiqueta.trim()).map((o) => ({ valor: o.valor, etiqueta: o.etiqueta.trim(), activo: o.activo }));
    if (form.tipo === 'seleccion' && opciones.filter((o) => o.activo).length < 2) {
      setError('Una lista de opciones necesita al menos dos opciones activas.');
      return;
    }

    setGuardando(true);
    try {
      if (campoEditando) {
        await actualizarCampo(
          campoEditando.id,
          {
            etiqueta,
            ayuda: form.ayuda.trim(),
            requerido: form.requerido,
            activo: form.activo,
            ...(form.tipo === 'seleccion' ? { opciones } : {}),
          },
          token
        );
      } else {
        await crearCampo(
          { entidad, etiqueta, tipo: form.tipo, ayuda: form.ayuda.trim(), requerido: form.requerido, opciones: opciones.map((o) => o.etiqueta) },
          token
        );
      }
      setPanelAbierto(false);
      recargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  // Acciones directas sobre la fila (activar / mover).
  async function conCampo(campo, accion) {
    setOcupado(campo.id);
    setErrorLista('');
    try {
      await accion();
    } catch (err) {
      setErrorLista(err.message);
    } finally {
      setOcupado(null);
    }
  }

  function alternarActivo(campo) {
    return conCampo(campo, async () => {
      const { campo: actualizado } = await actualizarCampo(campo.id, { activo: !campo.activo }, token);
      setCampos((lista) => lista.map((c) => (c.id === campo.id ? actualizado : c)));
    });
  }

  function mover(campo, paso) {
    const origen = campos.findIndex((c) => c.id === campo.id);
    const destino = origen + paso;
    if (destino < 0 || destino >= campos.length) return undefined;
    const nuevos = [...campos];
    [nuevos[origen], nuevos[destino]] = [nuevos[destino], nuevos[origen]];
    return conCampo(campo, async () => {
      const datos = await reordenarCampos(entidad, nuevos.map((c) => c.id), token);
      setCampos(datos.campos);
    });
  }

  const nombreEntidad = entidades.find((e) => e.id === entidad)?.nombre ?? entidad;
  const activos = campos.filter((c) => c.activo).length;

  return (
    <>
      <div className="flex flex-col gap-6" inert={panelAbierto} aria-hidden={panelAbierto}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="font-heading text-base font-semibold text-white">Campos del formulario de {nombreEntidad.toLowerCase()}</p>
            <p className="mt-1 text-sm text-white/90">
              Agrega campos al formulario sin programar. Aparecen al final, en “Información adicional”, en el orden de esta lista.
              {!cargando && !errorCarga && ` ${campos.length} ${campos.length === 1 ? 'campo' : 'campos'}, ${activos} ${activos === 1 ? 'activo' : 'activos'}.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {entidades.length > 1 && (
              <Desplegable aria-label="Formulario" value={entidad} onChange={(e) => setEntidad(e.target.value)} className="px-3 py-2 text-sm">
                {entidades.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </Desplegable>
            )}
            <button
              type="button"
              onClick={() => abrir(null)}
              className="boton-glass-ambar inline-flex items-center gap-2 rounded-boton px-4 py-2.5 text-sm font-semibold text-brand-navy transition"
            >
              <IconoMas className="h-4 w-4" />
              Nuevo campo
            </button>
          </div>
        </div>

        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-brand-blue-800 ring-1 ring-blue-200">
          Los campos no se eliminan: al desactivar uno deja de pedirse en registros nuevos, pero los datos que ya se guardaron se conservan.
        </p>

        {errorLista && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {errorLista}
          </p>
        )}

        {cargando ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((k) => (
              <div key={k} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : errorCarga ? (
          <EstadoError
            mensaje={errorCarga}
            onReintentar={() => {
              setErrorCarga('');
              setCargando(true);
              recargar();
            }}
          />
        ) : campos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/45 px-6 py-12 text-center">
            <IconoDocumento className="h-10 w-10 text-white/70" peso="duotone" />
            <p className="text-sm font-medium text-white">Este formulario aún no tiene campos adicionales</p>
            <p className="text-sm text-white/85">Crea el primero con el botón “Nuevo campo”.</p>
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {campos.map((campo, i) => (
              <li
                key={campo.id}
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3 ${
                  campo.activo ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium ${campo.activo ? 'text-slate-900' : 'text-slate-500'}`}>{campo.etiqueta}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                    <span>{NOMBRE_TIPO[campo.tipo] ?? campo.tipo}</span>
                    {campo.requerido && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">Obligatorio</span>}
                    {!campo.activo && <span className="rounded-full bg-slate-200 px-2 py-0.5 font-semibold text-slate-700">Desactivado</span>}
                  </p>
                </div>
                <StatusToggle
                  checked={campo.activo}
                  onChange={() => alternarActivo(campo)}
                  disabled={ocupado === campo.id}
                  label={campo.activo ? 'Activo' : 'Inactivo'}
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => mover(campo, -1)}
                    disabled={i === 0 || ocupado !== null}
                    aria-label={`Subir el campo ${campo.etiqueta}`}
                    title="Subir"
                    className="boton-texto rounded-boton p-2 text-slate-500 transition hover:text-slate-700 disabled:opacity-40"
                  >
                    <IconoChevronAbajo className="h-4 w-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(campo, 1)}
                    disabled={i === campos.length - 1 || ocupado !== null}
                    aria-label={`Bajar el campo ${campo.etiqueta}`}
                    title="Bajar"
                    className="boton-texto rounded-boton p-2 text-slate-500 transition hover:text-slate-700 disabled:opacity-40"
                  >
                    <IconoChevronAbajo className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => abrir(campo)}
                    className="boton-texto inline-flex items-center gap-1.5 rounded-boton px-3 py-1.5 text-sm font-medium text-brand-blue transition"
                  >
                    <IconoLapiz className="h-4 w-4" />
                    Editar
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <SidePanel
        isOpen={panelAbierto}
        onClose={() => setPanelAbierto(false)}
        title={campoEditando ? 'Editar campo' : 'Nuevo campo'}
        footer={
          <button
            type="submit"
            form="form-campo"
            disabled={guardando}
            className="w-full rounded-boton bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : campoEditando ? 'Guardar cambios' : 'Crear campo'}
          </button>
        }
      >
        <form id="form-campo" onSubmit={guardar} className="flex flex-col gap-4">
          <Campo
            id="campo-etiqueta"
            label="Nombre del campo"
            value={form.etiqueta}
            maxLength={80}
            onChange={(e) => setForm({ ...form, etiqueta: e.target.value })}
            placeholder="Ej. Certificado de vacunación"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="campo-tipo" className="text-sm font-medium text-slate-700">
              Tipo de campo
              <span className="ml-0.5 text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <Desplegable
              id="campo-tipo"
              value={form.tipo}
              disabled={Boolean(campoEditando)}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="w-full px-3 py-2 text-sm"
            >
              {ORDEN_TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {NOMBRE_TIPO[tipo]}
                </option>
              ))}
            </Desplegable>
            <p className="text-xs text-slate-500">
              {campoEditando
                ? 'El tipo no se puede cambiar: si necesitas otro, desactiva este campo y crea uno nuevo.'
                : 'Elígelo con cuidado: después de crear el campo no se puede cambiar.'}
            </p>
          </div>

          {form.tipo === 'seleccion' && (
            <fieldset className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
              <legend className="px-1 text-sm font-medium text-slate-700">Opciones de la lista</legend>
              {form.opciones.map((opcion, i) => (
                <div key={opcion.id} className="flex items-center gap-2">
                  <input
                    aria-label={`Opción ${i + 1}`}
                    value={opcion.etiqueta}
                    maxLength={60}
                    onChange={(e) => cambiarOpcion(opcion.id, { etiqueta: e.target.value })}
                    placeholder={`Opción ${i + 1}`}
                    className={`campo min-w-0 flex-1 px-3 py-2 text-sm ${opcion.activo ? '' : 'text-slate-500 line-through'}`}
                  />
                  {opcion.valor ? (
                    // Ya guardada: no se elimina, solo se desactiva.
                    <StatusToggle
                      checked={opcion.activo}
                      onChange={(valor) => cambiarOpcion(opcion.id, { activo: valor })}
                      label={opcion.activo ? 'Activa' : 'Inactiva'}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setForm((actual) => ({ ...actual, opciones: actual.opciones.filter((o) => o.id !== opcion.id) }))}
                      aria-label={`Quitar la opción ${i + 1}`}
                      className="boton-texto rounded-boton p-2 text-slate-500 hover:text-red-600"
                    >
                      <IconoX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm((actual) => ({ ...actual, opciones: [...actual.opciones, opcionNueva()] }))}
                className="boton-texto inline-flex items-center gap-1.5 self-start rounded-boton px-2 py-1.5 text-sm font-semibold text-brand-blue"
              >
                <IconoMas className="h-4 w-4" />
                Agregar opción
              </button>
              {campoEditando && (
                <p className="text-xs text-slate-500">Las opciones ya guardadas no se eliminan: desactívalas para que dejen de ofrecerse.</p>
              )}
            </fieldset>
          )}

          <div className="flex flex-col gap-1.5">
            <Campo
              id="campo-ayuda"
              label="Texto de ayuda (opcional)"
              value={form.ayuda}
              maxLength={160}
              onChange={(e) => setForm({ ...form, ayuda: e.target.value })}
              placeholder="Ej. Sube el carné con las vacunas al día"
            />
            <p className="text-xs text-slate-500">Se muestra debajo del campo, para orientar a quien lo llena.</p>
          </div>

          <StatusToggle
            checked={form.requerido}
            onChange={(valor) => setForm({ ...form, requerido: valor })}
            label="Campo obligatorio"
            helpText="No se podrá guardar el formulario sin llenarlo."
          />

          {campoEditando && (
            <StatusToggle
              checked={form.activo}
              onChange={(valor) => setForm({ ...form, activo: valor })}
              label="Campo activo"
              helpText="Desactivado deja de pedirse, pero los datos ya guardados se conservan."
            />
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
        </form>
      </SidePanel>
    </>
  );
}
