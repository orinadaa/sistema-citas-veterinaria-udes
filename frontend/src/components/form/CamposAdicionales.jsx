// components/form/CamposAdicionales.jsx
// Campos personalizados administrables dentro de un formulario: los que
// el administrador define en Configuracion > Campos (hoy, para la
// mascota). El formulario no sabe de antemano cuales son: los pide al
// backend (GET /api/campos?entidad=...) y los dibuja segun su tipo, al
// final, en una seccion "Información adicional".
//
// Dos piezas:
// - useCamposAdicionales(entidad), en hooks/useCamposAdicionales.js: estado
//   y logica (definiciones, valores, archivos por subir, validacion de
//   obligatorios y guardado de adjuntos);
// - <CamposAdicionales campos={...} />: la seccion visual.
//
// Como se usa en un formulario:
//   const campos = useCamposAdicionales('mascota');
//   campos.reiniciar(mascota)                 // al abrir (crear: null)
//   const falta = campos.errorObligatorios()  // antes de enviar
//   datos.camposAdicionales = campos.valoresParaEnviar()
//   await campos.guardarArchivos(guardada.id) // despues de guardar
//
// Regla de negocio: un campo desactivado ya no se pide, pero si el
// registro tiene un valor guardado se sigue mostrando, en solo lectura
// ("Datos que ya no se solicitan"): nunca se pierde.
//
// Cada tipo usa el control de vetUI que le corresponde (Campo,
// Desplegable, CampoFecha, botones Si/No): ninguno es del navegador.
import { useRef, useState } from 'react';
import { desdeFechaLocal, formatearFechaLarga } from '../../utils/fecha';
import { Campo } from './Campo';
import { CampoFecha } from './CampoFecha';
import { Desplegable } from './Desplegable';
import { IconoCheck, IconoDocumento, IconoPapelera } from '../icons';

const PESO_MAXIMO_MB = 5;
const TIPOS_ARCHIVO = ['application/pdf', 'image/jpeg', 'image/png'];

function vacio(valor) {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');
}

function Etiqueta({ htmlFor, id, requerido, children }) {
  const Elemento = htmlFor ? 'label' : 'span';
  return (
    <Elemento htmlFor={htmlFor} id={id} className="text-sm font-medium text-slate-700">
      {children}
      {requerido ? (
        <span className="ml-0.5 text-red-500" aria-hidden="true">
          *
        </span>
      ) : (
        ' (opcional)'
      )}
    </Elemento>
  );
}

function Ayuda({ children }) {
  return children ? <p className="text-xs text-slate-600">{children}</p> : null;
}

// Si / No como dos botones (grupo de radio); si no es obligatorio, un clic
// sobre la opcion elegida la desmarca.
function CampoSiNo({ id, definicion, valor, onChange }) {
  const opciones = [
    { valor: true, etiqueta: 'Sí' },
    { valor: false, etiqueta: 'No' },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      <Etiqueta id={`${id}-etiqueta`} requerido={definicion.requerido}>
        {definicion.etiqueta}
      </Etiqueta>
      <div role="radiogroup" aria-labelledby={`${id}-etiqueta`} className="grid max-w-xs grid-cols-2 gap-2">
        {opciones.map((opcion) => {
          const elegida = valor === opcion.valor;
          return (
            <button
              key={opcion.etiqueta}
              type="button"
              role="radio"
              aria-checked={elegida}
              onClick={() => onChange(elegida && !definicion.requerido ? null : opcion.valor)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-boton px-3 py-2 text-sm ring-1 transition ${
                elegida
                  ? 'bg-blue-50 font-semibold text-brand-blue-700 ring-2 ring-brand-blue'
                  : 'bg-white font-medium text-slate-700 ring-slate-300 hover:bg-slate-50'
              }`}
            >
              {elegida && <IconoCheck className="h-3.5 w-3.5" peso="bold" />}
              {opcion.etiqueta}
            </button>
          );
        })}
      </div>
      <Ayuda>{definicion.ayuda}</Ayuda>
    </div>
  );
}

// Adjunto (PDF o imagen): boton para elegir el archivo, o el archivo ya
// elegido / guardado con sus acciones. Se sube al guardar el formulario.
function CampoArchivo({ id, definicion, guardado, pendiente, onChange }) {
  const entrada = useRef(null);
  const [error, setError] = useState('');
  const porSubir = pendiente instanceof Blob ? pendiente : null;
  const actual = pendiente === undefined && guardado?.url ? guardado : null;

  function recibir(archivo) {
    if (entrada.current) entrada.current.value = '';
    if (!archivo) return;
    if (!TIPOS_ARCHIVO.includes(archivo.type)) {
      setError('El archivo debe ser PDF, JPG o PNG.');
      return;
    }
    if (archivo.size > PESO_MAXIMO_MB * 1024 * 1024) {
      setError(`El archivo no puede pesar más de ${PESO_MAXIMO_MB} MB.`);
      return;
    }
    setError('');
    onChange(archivo);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Etiqueta htmlFor={id} requerido={definicion.requerido}>
        {definicion.etiqueta}
      </Etiqueta>
      <input
        ref={entrada}
        id={id}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="sr-only"
        tabIndex={-1}
        onChange={(evento) => recibir(evento.target.files?.[0])}
      />
      {porSubir || actual ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-300">
          <IconoDocumento className="h-5 w-5 shrink-0 text-brand-blue-700" peso="duotone" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{porSubir ? porSubir.name : actual.nombre}</span>
          {actual && (
            <a href={actual.url} target="_blank" rel="noopener noreferrer" className="boton-texto text-sm font-semibold text-brand-blue-700">
              Ver
            </a>
          )}
          <button type="button" onClick={() => entrada.current?.click()} className="boton-texto text-sm font-semibold text-brand-blue-700">
            Cambiar
          </button>
          {!definicion.requerido && (
            <button
              type="button"
              onClick={() => onChange(guardado?.url ? null : undefined)}
              aria-label={`Quitar el archivo de ${definicion.etiqueta}`}
              className="boton-texto rounded-boton p-1 text-red-600"
            >
              <IconoPapelera className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          className="inline-flex items-center gap-2 self-start rounded-boton border border-brand-blue px-3.5 py-2 text-sm font-semibold text-brand-blue transition hover:bg-blue-50"
        >
          <IconoDocumento className="h-4 w-4" />
          Adjuntar archivo
        </button>
      )}
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : (
        <p className="text-xs text-slate-600">
          {definicion.ayuda ? `${definicion.ayuda} ` : ''}PDF, JPG o PNG. Máx. {PESO_MAXIMO_MB} MB.
          {porSubir ? ' Se sube al guardar.' : pendiente === null ? ' Se quitará al guardar.' : ''}
        </p>
      )}
    </div>
  );
}

// Valor de un campo como texto, para la lista de solo lectura.
function textoDelValor(definicion, valor) {
  if (definicion.tipo === 'booleano') return valor ? 'Sí' : 'No';
  if (definicion.tipo === 'fecha') return formatearFechaLarga(desdeFechaLocal(valor));
  if (definicion.tipo === 'seleccion') return definicion.opciones.find((o) => o.valor === valor)?.etiqueta ?? String(valor);
  return String(valor);
}

// soloObligatorios: en formularios rapidos (crear una mascota mientras se
// agenda) se piden solo los campos obligatorios; el resto se completa
// despues en el formulario completo.
export function CamposAdicionales({ campos, idPrefijo, soloObligatorios = false, titulo = 'Información adicional', className = '' }) {
  const { activos, definiciones, valores, archivos, cambiar, cambiarArchivo } = campos;
  const visibles = soloObligatorios ? activos.filter((d) => d.requerido) : activos;
  // Campos desactivados que este registro si tiene llenos.
  const historicos = soloObligatorios ? [] : definiciones.filter((d) => !d.activo && !vacio(valores[d.clave]));

  if (visibles.length === 0 && historicos.length === 0) return null;

  return (
    <fieldset className={`flex flex-col gap-4 border-t border-slate-900/10 pt-4 ${className}`}>
      <legend className="sr-only">{titulo}</legend>
      <p aria-hidden="true" className="font-heading text-sm font-semibold text-brand-navy">
        {titulo}
      </p>

      {visibles.map((definicion) => {
        const id = `${idPrefijo}-${definicion.clave}`;
        const valor = valores[definicion.clave];
        const { etiqueta, tipo, requerido, ayuda } = definicion;
        const rotulo = requerido ? etiqueta : `${etiqueta} (opcional)`;

        if (tipo === 'booleano') {
          return <CampoSiNo key={id} id={id} definicion={definicion} valor={valor} onChange={(v) => cambiar(definicion.clave, v)} />;
        }
        if (tipo === 'archivo') {
          return (
            <CampoArchivo
              key={id}
              id={id}
              definicion={definicion}
              guardado={valor}
              pendiente={archivos[definicion.clave]}
              onChange={(archivo) => cambiarArchivo(definicion.clave, archivo)}
            />
          );
        }
        if (tipo === 'fecha') {
          return (
            <div key={id} className="flex flex-col gap-1.5">
              <CampoFecha
                id={id}
                etiqueta={rotulo}
                requerido={requerido}
                valor={valor || ''}
                onChange={(fecha) => cambiar(definicion.clave, fecha)}
                minimo={null}
              />
              <Ayuda>{ayuda}</Ayuda>
            </div>
          );
        }
        if (tipo === 'seleccion') {
          // Una opcion desactivada solo se ofrece si es el valor guardado.
          const opciones = definicion.opciones.filter((o) => o.activo || o.valor === valor);
          return (
            <div key={id} className="flex flex-col gap-1.5">
              <Etiqueta htmlFor={id} requerido={requerido}>
                {etiqueta}
              </Etiqueta>
              <Desplegable
                id={id}
                required={requerido}
                value={valor ?? ''}
                onChange={(e) => cambiar(definicion.clave, e.target.value)}
                className="w-full px-3 py-2 text-sm"
              >
                <option value="">{requerido ? 'Selecciona una opción' : 'Sin especificar'}</option>
                {opciones.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.etiqueta}
                  </option>
                ))}
              </Desplegable>
              <Ayuda>{ayuda}</Ayuda>
            </div>
          );
        }
        if (tipo === 'texto_largo') {
          return (
            <div key={id} className="flex flex-col gap-1.5">
              <Etiqueta htmlFor={id} requerido={requerido}>
                {etiqueta}
              </Etiqueta>
              <textarea
                id={id}
                required={requerido}
                maxLength={1000}
                value={valor ?? ''}
                onChange={(e) => cambiar(definicion.clave, e.target.value)}
                className="campo px-3 py-2 text-sm"
              />
              <Ayuda>{ayuda}</Ayuda>
            </div>
          );
        }
        // texto_corto y numero
        return (
          <div key={id} className="flex flex-col gap-1.5">
            <Campo
              id={id}
              label={rotulo}
              required={requerido}
              type={tipo === 'numero' ? 'number' : 'text'}
              step={tipo === 'numero' ? 'any' : undefined}
              maxLength={tipo === 'numero' ? undefined : 120}
              value={valor ?? ''}
              onChange={(e) => cambiar(definicion.clave, e.target.value)}
            />
            <Ayuda>{ayuda}</Ayuda>
          </div>
        );
      })}

      {historicos.length > 0 && (
        <div className="rounded-xl bg-slate-900/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Datos que ya no se solicitan</p>
          <dl className="mt-2 flex flex-col gap-1.5 text-sm">
            {historicos.map((definicion) => {
              const valor = valores[definicion.clave];
              return (
                <div key={definicion.clave} className="flex flex-wrap gap-x-2">
                  <dt className="text-slate-600">{definicion.etiqueta}:</dt>
                  <dd className="font-medium text-slate-800">
                    {definicion.tipo === 'archivo' ? (
                      <a href={valor.url} target="_blank" rel="noopener noreferrer" className="boton-texto font-semibold text-brand-blue-700">
                        {valor.nombre}
                      </a>
                    ) : (
                      textoDelValor(definicion, valor)
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}
    </fieldset>
  );
}
