// components/admin/PanelTextos.jsx
// Pagina web > Textos (superadministrador): los textos de marca de la pagina
// publica (hero, titulos de seccion y pie de pagina) se cambian sin programar.
// Solo texto plano. "Restaurar texto original" vuelve al de siempre.
import { useEffect, useMemo, useState } from 'react';
import { actualizarTextosSitio, obtenerTextosSitioAdmin } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { olvidarTextosSitio } from '../../hooks/useTextosSitio';
import { EstadoError } from '../ui/EstadoError';
import { IconoRotar } from '../icons';
import { VistaPreviaPortada } from './VistaPreviaPortada';

// Textos que caben en una linea: campo simple; los largos, area de texto.
const LARGO_LINEA = 70;

export function PanelTextos() {
  const { token } = useAuth();
  const [textos, setTextos] = useState(null);
  const [valores, setValores] = useState({});
  const [errorCarga, setErrorCarga] = useState('');
  const [estado, setEstado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(0);

  function cargarEn(lista) {
    setTextos(lista);
    setValores(Object.fromEntries(lista.map((t) => [t.clave, t.valor])));
  }

  useEffect(() => {
    let vigente = true;
    obtenerTextosSitioAdmin(token)
      .then((datos) => vigente && (cargarEn(datos.textos), setErrorCarga('')))
      .catch((err) => vigente && setErrorCarga(err.message || 'No se pudieron cargar los textos.'));
    return () => {
      vigente = false;
    };
  }, [token, intento]);

  const secciones = useMemo(() => {
    const grupos = [];
    for (const t of textos ?? []) {
      let grupo = grupos.find((g) => g.nombre === t.seccion);
      if (!grupo) grupos.push((grupo = { nombre: t.seccion, textos: [] }));
      grupo.textos.push(t);
    }
    return grupos;
  }, [textos]);

  // Solo se envia lo que cambio respecto a lo guardado.
  const cambios = useMemo(() => {
    const salida = {};
    for (const t of textos ?? []) if ((valores[t.clave] ?? '') !== t.valor) salida[t.clave] = valores[t.clave];
    return salida;
  }, [textos, valores]);
  const hayCambios = Object.keys(cambios).length > 0;

  async function guardar(evento) {
    evento.preventDefault();
    if (!hayCambios) return;
    setGuardando(true);
    setEstado(null);
    try {
      const respuesta = await actualizarTextosSitio(cambios, token);
      cargarEn(respuesta.textos);
      olvidarTextosSitio();
      setEstado({ tipo: 'ok', texto: 'Textos guardados. Ya se ven en la página pública.' });
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  if (errorCarga) return <EstadoError mensaje={errorCarga} onReintentar={() => setIntento((n) => n + 1)} />;
  if (!textos) return <div className="h-48 animate-pulse rounded-2xl bg-white/20" />;

  return (
    <form onSubmit={guardar} className="flex flex-col gap-6" noValidate>
      <p className="max-w-2xl text-sm text-white/90">
        Textos de la página pública que identifican a la clínica. Los botones, los avisos y los textos legales no se cambian desde aquí.
      </p>

      {secciones.map((seccion) => (
        <section key={seccion.nombre} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-heading text-base font-semibold text-brand-navy">{seccion.nombre}</h2>
          <div className={`mt-4 grid grid-cols-[minmax(0,1fr)] gap-6 ${seccion.nombre === 'Portada' ? 'xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]' : ''}`}>
            <div className="flex max-w-xl flex-col gap-5">
              {seccion.textos.map((t) => {
                const valor = valores[t.clave] ?? '';
                const esOriginal = valor === t.original;
                const id = `texto-${t.clave}`;
                const Control = t.maximo > LARGO_LINEA ? 'textarea' : 'input';
                return (
                  <div key={t.clave} className="flex flex-col gap-1.5">
                    <label htmlFor={id} className="text-sm font-medium text-slate-700">
                      {t.etiqueta}
                    </label>
                    <Control
                      id={id}
                      value={valor}
                      maxLength={t.maximo}
                      rows={Control === 'textarea' ? 2 : undefined}
                      aria-describedby={`${id}-ayuda`}
                      onChange={(e) => setValores({ ...valores, [t.clave]: e.target.value.replace(/\n/g, ' ') })}
                      className="campo w-full resize-none px-3 py-2 text-sm"
                    />
                    <div id={`${id}-ayuda`} className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                      <span>
                        {valor.length}/{t.maximo} caracteres
                        {t.vacioPermitido && ' · Puede quedar vacío'}
                      </span>
                      {!esOriginal && (
                        <button
                          type="button"
                          onClick={() => setValores({ ...valores, [t.clave]: t.original })}
                          className="boton-texto inline-flex items-center gap-1 font-semibold text-brand-blue-700"
                        >
                          <IconoRotar className="h-3.5 w-3.5 shrink-0" />
                          Restaurar texto original
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {seccion.nombre === 'Portada' && <VistaPreviaPortada valores={valores} />}
          </div>
        </section>
      ))}

      {estado && (
        <p role="alert" className={`rounded-lg px-3 py-2 text-sm ring-1 ${estado.tipo === 'ok' ? 'bg-green-50 text-green-800 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'}`}>
          {estado.texto}
        </p>
      )}
      <button
        type="submit"
        disabled={guardando || !hayCambios}
        className="boton-glass-ambar self-end rounded-boton px-5 py-2.5 text-sm font-semibold text-brand-navy transition disabled:opacity-60"
      >
        {guardando ? 'Guardando...' : 'Guardar textos'}
      </button>
    </form>
  );
}
