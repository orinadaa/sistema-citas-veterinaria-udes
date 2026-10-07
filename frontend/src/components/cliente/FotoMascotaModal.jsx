// components/cliente/FotoMascotaModal.jsx
// Editor "Foto de la mascota". Es el UNICO modal centrado del sistema
// (excepcion explicita pedida por la usuaria): todo lo demas sigue
// siendo <SidePanel/>. No reutilizar este patron para otros flujos.
//
// Pasos: Subir foto (arrastrar/seleccionar JPG o PNG de max. 5 MB, o
// elegir una foto de otra de sus mascotas) -> Ajustar (arrastrar para
// encuadrar, zoom, rotar) -> Vista previa. El recorte se hace aqui, en
// un <canvas>, y al guardar se entrega un JPEG cuadrado de 400x400: el
// backend recibe la imagen final (POST /api/mascotas/:id/foto).
//
// z-[60]: por encima del SidePanel (z-50) desde el que se abre.
import { useEffect, useRef, useState } from 'react';
import { IconoCheck, IconoImagen, IconoRotar, IconoX } from '../icons';

const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png'];
const LADO_SALIDA = 400;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

const PASOS = [
  { id: 'subir', etiqueta: 'Subir foto' },
  { id: 'ajustar', etiqueta: 'Ajustar' },
  { id: 'vista', etiqueta: 'Vista previa' },
];

// Escala para que la imagen (ya rotada) cubra todo el circulo de lado
// `lado` con zoom 1.
function escalaCubrir(imagen, rotacion, lado) {
  const girada = rotacion % 180 !== 0;
  const ancho = girada ? imagen.naturalHeight : imagen.naturalWidth;
  const alto = girada ? imagen.naturalWidth : imagen.naturalHeight;
  return Math.max(lado / ancho, lado / alto);
}

// Recorte circular en vivo. `desplazamiento` se guarda relativo al lado
// (fraccion), asi el mismo encuadre se ve igual en recortes de distinto
// tamaño y en el canvas de salida.
function Recorte({ imagen, src, zoom, rotacion, desplazamiento, onDesplazar, lado, interactivo = true }) {
  const arrastre = useRef(null);

  if (!imagen) {
    return (
      <div
        style={{ width: lado, height: lado }}
        className="flex items-center justify-center rounded-full bg-slate-100 text-slate-300"
      >
        <IconoImagen className="h-1/3 w-1/3" />
      </div>
    );
  }

  const escala = escalaCubrir(imagen, rotacion, lado) * zoom;
  const dx = desplazamiento.x * lado;
  const dy = desplazamiento.y * lado;

  function alPresionar(evento) {
    if (!interactivo) return;
    evento.currentTarget.setPointerCapture(evento.pointerId);
    arrastre.current = { x: evento.clientX, y: evento.clientY, inicio: desplazamiento };
  }

  function alMover(evento) {
    if (!arrastre.current) return;
    onDesplazar({
      x: arrastre.current.inicio.x + (evento.clientX - arrastre.current.x) / lado,
      y: arrastre.current.inicio.y + (evento.clientY - arrastre.current.y) / lado,
    });
  }

  return (
    <div
      style={{ width: lado, height: lado }}
      onPointerDown={alPresionar}
      onPointerMove={alMover}
      onPointerUp={() => (arrastre.current = null)}
      onPointerCancel={() => (arrastre.current = null)}
      className={`relative shrink-0 touch-none overflow-hidden rounded-full bg-slate-100 ring-4 ring-white shadow-md ${
        interactivo ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          width: imagen.naturalWidth,
          height: imagen.naturalHeight,
          maxWidth: 'none',
          transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${rotacion}deg) scale(${escala})`,
        }}
        className="pointer-events-none absolute left-1/2 top-1/2 select-none"
      />
    </div>
  );
}

// Dibuja el mismo encuadre que <Recorte/> en un canvas cuadrado y lo
// entrega como JPEG. El circulo es solo visual: se guarda el cuadrado y
// la app lo muestra siempre con rounded-full.
function exportarRecorte(imagen, zoom, rotacion, desplazamiento) {
  const canvas = document.createElement('canvas');
  canvas.width = LADO_SALIDA;
  canvas.height = LADO_SALIDA;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, LADO_SALIDA, LADO_SALIDA);
  ctx.translate(LADO_SALIDA / 2 + desplazamiento.x * LADO_SALIDA, LADO_SALIDA / 2 + desplazamiento.y * LADO_SALIDA);
  ctx.rotate((rotacion * Math.PI) / 180);
  const escala = escalaCubrir(imagen, rotacion, LADO_SALIDA) * zoom;
  ctx.scale(escala, escala);
  ctx.drawImage(imagen, -imagen.naturalWidth / 2, -imagen.naturalHeight / 2);
  return new Promise((resolver, rechazar) =>
    canvas.toBlob((blob) => (blob ? resolver(blob) : rechazar(new Error('No se pudo procesar la imagen.'))), 'image/jpeg', 0.9)
  );
}

// titulo / tituloMiniaturas: el mismo editor se reutiliza para la foto
// de perfil del medico ("Foto de perfil", sin miniaturas).
export function FotoMascotaModal({
  isOpen,
  onClose,
  onGuardar,
  fotoActual,
  fotosAnteriores = [],
  titulo = 'Foto de la mascota',
  tituloMiniaturas = 'Fotos de tus otras mascotas',
}) {
  const [paso, setPaso] = useState('subir');
  const [src, setSrc] = useState(null);
  // Se incrementa en cada eleccion para recargar aunque el src no cambie
  // (misma miniatura dos veces, reabrir con la misma foto actual).
  const [carga, setCarga] = useState(0);
  const [imagen, setImagen] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotacion, setRotacion] = useState(0);
  const [desplazamiento, setDesplazamiento] = useState({ x: 0, y: 0 });
  const [error, setError] = useState('');
  const [arrastrandoArchivo, setArrastrandoArchivo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const inputArchivo = useRef(null);
  const urlObjeto = useRef(null);

  // Al abrir: arranca con la foto actual (si hay) lista para ajustar.
  const [abiertoAntes, setAbiertoAntes] = useState(false);
  if (isOpen !== abiertoAntes) {
    setAbiertoAntes(isOpen);
    if (isOpen) {
      setError('');
      setZoom(1);
      setRotacion(0);
      setDesplazamiento({ x: 0, y: 0 });
      setImagen(null);
      setSrc(fotoActual || null);
      setCarga((n) => n + 1);
      setPaso(fotoActual ? 'ajustar' : 'subir');
    }
  }

  // Carga la imagen elegida para conocer su tamaño real (lo necesita el
  // recorte). Solo actualiza estado en los callbacks de carga.
  useEffect(() => {
    if (!src) return undefined;
    let vigente = true;
    const elemento = new Image();
    elemento.onload = () => vigente && setImagen(elemento);
    elemento.onerror = () => vigente && setError('No se pudo abrir esa imagen. Prueba con otra.');
    elemento.src = src;
    return () => {
      vigente = false;
    };
  }, [src, carga]);

  useEffect(() => {
    if (!isOpen) return undefined;
    // En fase de captura y sin propagar: Escape cierra solo el editor, no
    // tambien el panel lateral desde el que se abrio.
    function alPresionarTecla(evento) {
      if (evento.key !== 'Escape') return;
      evento.stopPropagation();
      onClose();
    }
    document.addEventListener('keydown', alPresionarTecla, true);
    return () => document.removeEventListener('keydown', alPresionarTecla, true);
  }, [isOpen, onClose]);

  // Libera la URL temporal del archivo local al cambiarla o al desmontar.
  useEffect(() => () => urlObjeto.current && URL.revokeObjectURL(urlObjeto.current), []);

  function usarImagen(nuevoSrc) {
    setImagen(null);
    setSrc(nuevoSrc);
    setCarga((n) => n + 1);
    setZoom(1);
    setRotacion(0);
    setDesplazamiento({ x: 0, y: 0 });
    setPaso('ajustar');
  }

  function elegirArchivo(archivo) {
    setError('');
    if (!archivo) return;
    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      setError('La foto debe ser JPG o PNG.');
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      setError('La foto no puede pesar más de 5 MB.');
      return;
    }
    if (urlObjeto.current) URL.revokeObjectURL(urlObjeto.current);
    urlObjeto.current = URL.createObjectURL(archivo);
    usarImagen(urlObjeto.current);
  }

  async function guardar() {
    if (!imagen) return;
    setGuardando(true);
    setError('');
    try {
      const blob = await exportarRecorte(imagen, zoom, rotacion, desplazamiento);
      onGuardar(blob);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const ajustes = { imagen, src, zoom, rotacion, desplazamiento, onDesplazar: setDesplazamiento };

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-foto-mascota"
        className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="titulo-foto-mascota" className="font-heading text-lg font-semibold text-brand-navy">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-boton p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <IconoX className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-[170px_minmax(0,1fr)_230px]">
          {/* Pasos */}
          <nav className="flex gap-2 md:flex-col" aria-label="Pasos">
            {PASOS.map((p, indice) => {
              const habilitado = p.id === 'subir' || Boolean(imagen);
              const activo = paso === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={!habilitado}
                  onClick={() => setPaso(p.id)}
                  aria-current={activo ? 'step' : undefined}
                  className={`flex flex-1 items-center gap-2 rounded-boton px-3 py-2.5 text-left text-sm font-medium transition md:flex-none ${
                    activo ? 'bg-blue-50 text-brand-blue' : habilitado ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-300'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      activo ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {indice + 1}
                  </span>
                  <span className="hidden sm:inline">{p.etiqueta}</span>
                </button>
              );
            })}
          </nav>

          {/* Contenido del paso */}
          <div className="min-w-0">
            {paso === 'subir' && (
              <div className="flex flex-col gap-5">
                <button
                  type="button"
                  onClick={() => inputArchivo.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setArrastrandoArchivo(true);
                  }}
                  onDragLeave={() => setArrastrandoArchivo(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setArrastrandoArchivo(false);
                    elegirArchivo(e.dataTransfer.files?.[0]);
                  }}
                  className={`flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition ${
                    arrastrandoArchivo ? 'border-brand-blue bg-blue-50' : 'border-slate-300 hover:border-brand-blue hover:bg-slate-50'
                  }`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                    <IconoImagen className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-medium text-slate-700">Arrastra una imagen aquí o haz clic para seleccionar</span>
                  <span className="text-xs text-slate-400">JPG o PNG, máximo 5 MB</span>
                </button>
                <input
                  ref={inputArchivo}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    elegirArchivo(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />

                {fotosAnteriores.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700">{tituloMiniaturas}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {fotosAnteriores.map((url) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => usarImagen(url)}
                          className={`overflow-hidden rounded-xl ring-2 transition ${
                            src === url ? 'ring-brand-blue' : 'ring-transparent hover:ring-slate-300'
                          }`}
                        >
                          <img src={url} alt="" className="h-16 w-16 object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {paso === 'ajustar' && (
              <div className="flex flex-col items-center gap-3">
                <Recorte {...ajustes} lado={260} />
                <p className="text-center text-sm text-slate-500">Arrastra la imagen para encuadrarla dentro del círculo.</p>
              </div>
            )}

            {paso === 'vista' && (
              <div className="flex flex-col items-center gap-5">
                <Recorte {...ajustes} lado={200} interactivo={false} />
                <div className="flex items-center gap-4">
                  <Recorte {...ajustes} lado={64} interactivo={false} />
                  <Recorte {...ajustes} lado={40} interactivo={false} />
                </div>
                <p className="flex items-center gap-1.5 text-sm text-slate-500">
                  <IconoCheck className="h-4 w-4 text-brand-green" />
                  Así se verá en tu perfil y en tus citas.
                </p>
              </div>
            )}

            {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}
          </div>

          {/* Vista previa en vivo + controles */}
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-slate-50 p-4">
            <p className="self-start text-sm font-semibold text-slate-700">Vista previa</p>
            <Recorte {...ajustes} lado={150} />
            <div className="flex w-full items-center gap-2">
              <button
                type="button"
                aria-label="Alejar"
                disabled={!imagen || zoom <= ZOOM_MIN}
                onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - 0.1).toFixed(2)))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-boton border border-slate-300 bg-white text-lg leading-none text-slate-600 disabled:opacity-40"
              >
                −
              </button>
              <input
                type="range"
                aria-label="Zoom"
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={0.01}
                disabled={!imagen}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="min-w-0 flex-1 accent-brand-blue"
              />
              <button
                type="button"
                aria-label="Acercar"
                disabled={!imagen || zoom >= ZOOM_MAX}
                onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + 0.1).toFixed(2)))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-boton border border-slate-300 bg-white text-lg leading-none text-slate-600 disabled:opacity-40"
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={!imagen}
              onClick={() => setRotacion((r) => (r + 90) % 360)}
              className="inline-flex items-center gap-2 rounded-boton border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
            >
              <IconoRotar className="h-4 w-4" />
              Rotar
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-boton border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!imagen || guardando}
            onClick={guardar}
            className="rounded-boton bg-brand-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? 'Procesando...' : 'Guardar foto'}
          </button>
        </div>
      </div>
    </div>
  );
}
