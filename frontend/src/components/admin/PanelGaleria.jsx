// components/admin/PanelGaleria.jsx
// Configuracion > Galeria: las fotos que rotan en la portada (Hero) de la
// pagina publica. El administrador las sube como archivo (ZonaImagen),
// las describe, elige que parte debe quedar al centro (encuadre), las
// ordena, las oculta o las elimina. El Hero las lee de GET /api/galeria
// (ver landing/HeroGaleria.jsx); si no hay ninguna visible, el Hero usa
// las fotos de ejemplo que vienen con el sistema.
import { useEffect, useState } from 'react';
import {
  obtenerGaleriaAdmin,
  subirFotoGaleria,
  actualizarFotoGaleria,
  reordenarGaleria,
  eliminarFotoGaleria,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ZonaImagen } from '../form/ZonaImagen';
import { SelectorEncuadre } from '../form/SelectorEncuadre';
import { StatusToggle } from '../ui/StatusToggle';
import { SidePanel } from '../ui/SidePanel';
import { EstadoError } from '../ui/EstadoError';
import { IconoChevronAbajo, IconoImagen, IconoLapiz } from '../icons';

const LARGO_MAXIMO_DESCRIPCION = 200;
const FORM_VACIO = { descripcion: '', focoX: 50, focoY: 50, activo: true };

export function PanelGaleria() {
  const { token } = useAuth();
  const [fotos, setFotos] = useState([]);
  const [maximo, setMaximo] = useState(12);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [errorLista, setErrorLista] = useState('');
  const [ocupada, setOcupada] = useState(null); // id de la foto con una accion en curso

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [fotoEditando, setFotoEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [archivo, setArchivo] = useState(null); // foto nueva ya reducida (Blob), pendiente de subir
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  // Se incrementa para volver a pedir la galeria (despues de guardar).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerGaleriaAdmin(token)
      .then((datos) => {
        if (!vigente) return;
        setFotos(datos.fotos);
        setMaximo(datos.maximo);
        setErrorCarga('');
      })
      .catch((err) => vigente && setErrorCarga(err.message || 'No se pudo cargar la galería.'))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [token, recarga]);

  function cargar() {
    setRecarga((n) => n + 1);
  }

  function reintentar() {
    setErrorCarga('');
    setCargando(true);
    cargar();
  }

  // La vista previa es una URL temporal del navegador: se libera al
  // cambiarla o al salir.
  useEffect(() => () => vistaPrevia && URL.revokeObjectURL(vistaPrevia), [vistaPrevia]);

  function abrir(foto) {
    setFotoEditando(foto);
    setForm(
      foto
        ? { descripcion: foto.descripcion, focoX: foto.foco_x, focoY: foto.foco_y, activo: foto.activo }
        : FORM_VACIO
    );
    setArchivo(null);
    setVistaPrevia(null);
    setError('');
    setConfirmandoEliminar(false);
    setPanelAbierto(true);
  }

  function elegirArchivo(blob) {
    setArchivo(blob);
    setVistaPrevia(URL.createObjectURL(blob));
    setForm((f) => ({ ...f, focoX: 50, focoY: 50 }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    const descripcion = form.descripcion.trim();
    if (!fotoEditando && !archivo) {
      setError('Elige la foto que quieres subir.');
      return;
    }
    if (!descripcion) {
      setError('Describe brevemente qué se ve en la foto.');
      return;
    }

    setGuardando(true);
    try {
      if (fotoEditando) {
        await actualizarFotoGaleria(
          fotoEditando.id,
          { descripcion, focoX: form.focoX, focoY: form.focoY, activo: form.activo },
          token
        );
      } else {
        const { foto } = await subirFotoGaleria(archivo, descripcion, token);
        if (form.focoX !== 50 || form.focoY !== 50) {
          await actualizarFotoGaleria(foto.id, { focoX: form.focoX, focoY: form.focoY }, token);
        }
      }
      setPanelAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    setGuardando(true);
    setError('');
    try {
      await eliminarFotoGaleria(fotoEditando.id, token);
      setPanelAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  // Acciones directas sobre la tarjeta (visible / mover).
  async function conFoto(foto, accion) {
    setOcupada(foto.id);
    setErrorLista('');
    try {
      await accion();
    } catch (err) {
      setErrorLista(err.message);
    } finally {
      setOcupada(null);
    }
  }

  function alternarVisible(foto) {
    return conFoto(foto, async () => {
      const { foto: actualizada } = await actualizarFotoGaleria(foto.id, { activo: !foto.activo }, token);
      setFotos((lista) => lista.map((f) => (f.id === foto.id ? actualizada : f)));
    });
  }

  function mover(foto, paso) {
    const origen = fotos.findIndex((f) => f.id === foto.id);
    const destino = origen + paso;
    if (destino < 0 || destino >= fotos.length) return undefined;
    const nuevas = [...fotos];
    [nuevas[origen], nuevas[destino]] = [nuevas[destino], nuevas[origen]];
    return conFoto(foto, async () => {
      const datos = await reordenarGaleria(nuevas.map((f) => f.id), token);
      setFotos(datos.fotos);
    });
  }

  const visibles = fotos.filter((f) => f.activo).length;
  const galeriaLlena = fotos.length >= maximo;
  const srcEncuadre = fotoEditando ? fotoEditando.foto_url : vistaPrevia;

  return (
    <>
      <div className="flex flex-col gap-6" inert={panelAbierto} aria-hidden={panelAbierto}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="font-heading text-base font-semibold text-white">Galería del inicio</p>
            <p className="mt-1 text-sm text-white/90">
              Estas fotos rotan en la portada de la página pública, en el orden en que aparecen aquí.
              {!cargando && !errorCarga && ` ${fotos.length} de ${maximo} fotos, ${visibles} visibles.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => abrir(null)}
            disabled={galeriaLlena}
            title={galeriaLlena ? `La galería admite máximo ${maximo} fotos` : undefined}
            className="boton-glass-ambar inline-flex items-center gap-2 rounded-boton px-4 py-2.5 text-sm font-semibold text-brand-navy transition disabled:opacity-60"
          >
            + Subir foto
          </button>
        </div>

        {errorLista && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {errorLista}
          </p>
        )}

        {cargando ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((k) => (
              <div key={k} className="aspect-[4/3] animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : errorCarga ? (
          <EstadoError mensaje={errorCarga} onReintentar={reintentar} />
        ) : (
          <>
            {visibles === 0 && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
                No hay fotos visibles: mientras tanto, el inicio muestra las fotos de ejemplo del sistema.
              </p>
            )}
            {fotos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/45 px-6 py-12 text-center">
                <IconoImagen className="h-10 w-10 text-white/70" peso="duotone" />
                <p className="text-sm font-medium text-white">La galería está vacía</p>
                <p className="text-sm text-white/85">Sube la primera foto con el botón “Subir foto”.</p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {fotos.map((foto, i) => (
                  <li key={foto.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="relative">
                      <img
                        src={foto.foto_url}
                        alt={foto.descripcion}
                        loading="lazy"
                        style={{ objectPosition: `${foto.foco_x}% ${foto.foco_y}%` }}
                        className={`aspect-[4/3] w-full object-cover ${foto.activo ? '' : 'opacity-50 grayscale'}`}
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-brand-navy px-2 py-0.5 text-xs font-semibold text-white">
                        {i + 1}
                      </span>
                      {!foto.activo && (
                        <span className="absolute right-2 top-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-white">
                          Oculta
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-3">
                      <p className="flex-1 text-sm text-slate-700">{foto.descripcion}</p>
                      <StatusToggle
                        checked={foto.activo}
                        onChange={() => alternarVisible(foto)}
                        disabled={ocupada === foto.id}
                        label={foto.activo ? 'Visible en el inicio' : 'Oculta'}
                      />
                      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => mover(foto, -1)}
                            disabled={i === 0 || ocupada !== null}
                            aria-label={`Mover la foto ${i + 1} una posición antes`}
                            title="Mover antes"
                            className="boton-texto rounded-boton p-2 text-slate-500 transition hover:text-slate-700 disabled:opacity-40"
                          >
                            <IconoChevronAbajo className="h-4 w-4 rotate-90" />
                          </button>
                          <button
                            type="button"
                            onClick={() => mover(foto, 1)}
                            disabled={i === fotos.length - 1 || ocupada !== null}
                            aria-label={`Mover la foto ${i + 1} una posición después`}
                            title="Mover después"
                            className="boton-texto rounded-boton p-2 text-slate-500 transition hover:text-slate-700 disabled:opacity-40"
                          >
                            <IconoChevronAbajo className="h-4 w-4 -rotate-90" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => abrir(foto)}
                          className="inline-flex items-center gap-1.5 boton-texto rounded-boton px-3 py-1.5 text-sm font-medium text-brand-blue-600 transition"
                        >
                          <IconoLapiz className="h-4 w-4" />
                          Editar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <SidePanel
        isOpen={panelAbierto}
        onClose={() => setPanelAbierto(false)}
        title={fotoEditando ? 'Editar foto de la galería' : 'Subir foto a la galería'}
        footer={
          confirmandoEliminar ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-700">¿Eliminar esta foto? No se puede deshacer.</p>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmandoEliminar(false)}
                  disabled={guardando}
                  className="boton-texto rounded-boton px-3 py-2 text-sm font-medium text-slate-600 transition"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={eliminar}
                  disabled={guardando}
                  className="rounded-boton bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {guardando ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              {fotoEditando ? (
                <button
                  type="button"
                  onClick={() => setConfirmandoEliminar(true)}
                  className="boton-texto rounded-boton px-3 py-2 text-sm font-medium text-red-600 transition"
                >
                  Eliminar foto
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                form="form-galeria"
                disabled={guardando}
                className="rounded-boton bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-700 disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : fotoEditando ? 'Guardar cambios' : 'Subir foto'}
              </button>
            </div>
          )
        }
      >
        <form id="form-galeria" onSubmit={guardar} className="flex flex-col gap-5">
          {!fotoEditando && (
            <ZonaImagen
              id="archivo-galeria"
              imagenUrl={vistaPrevia}
              onElegir={elegirArchivo}
              ayuda="Sube una foto horizontal de la clínica"
              proporcion="aspect-[4/3]"
            />
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="descripcion-galeria" className="text-sm font-medium text-slate-700">
              Descripción de la foto
              <span className="ml-0.5 text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <textarea
              id="descripcion-galeria"
              rows={2}
              required
              maxLength={LARGO_MAXIMO_DESCRIPCION}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej. Veterinaria examinando a un perro en consulta"
              className="w-full campo px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-500">
              Di qué se ve en la foto: es lo que escuchan las personas que usan lector de pantalla.
            </p>
          </div>

          {srcEncuadre && (
            <SelectorEncuadre
              src={srcEncuadre}
              focoX={form.focoX}
              focoY={form.focoY}
              onCambiar={(foco) => setForm((f) => ({ ...f, ...foco }))}
            />
          )}

          {fotoEditando && (
            <>
              <StatusToggle
                checked={form.activo}
                onChange={(valor) => setForm({ ...form, activo: valor })}
                label="Visible en el inicio"
                helpText="Si la ocultas, sigue guardada pero no se muestra en la portada."
              />
              <p className="text-xs text-slate-500">
                Para cambiar la imagen, elimina esta foto y sube la nueva.
              </p>
            </>
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
