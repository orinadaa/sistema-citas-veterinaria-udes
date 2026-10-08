// components/form/ZonaImagen.jsx
// Zona de subida para fotos RECTANGULARES (foto de sede, galeria del
// inicio): la version apaisada de ZonaFoto. Rectangulo punteado con icono
// y "Subir foto" cuando esta vacio (clic o arrastrar el archivo), o la
// foto cuando ya hay una, con "Cambiar foto" debajo.
//
// Reemplaza a los campos donde antes se pegaba un enlace: la foto siempre
// se sube como archivo. Valida y reduce la imagen (utils/imagen.js) y
// entrega el resultado por onElegir(blob); quien la usa decide cuando
// subirla. Las fotos circulares (mascota, medico) usan ZonaFoto.
import { useRef, useState } from 'react';
import { IconoImagen } from '../icons';
import { prepararImagen, PESO_MAXIMO_ORIGINAL_MB } from '../../utils/imagen';

export function ZonaImagen({
  id,
  imagenUrl,
  onElegir,
  ayuda = 'Sube una foto',
  alt = '',
  ladoMaximo = 1600,
  // Proporcion del recuadro (clase de Tailwind).
  proporcion = 'aspect-[16/9]',
  // Encuadre de la foto dentro del recuadro (object-position), si lo tiene.
  posicion,
  className = '',
}) {
  const entrada = useRef(null);
  const [procesando, setProcesando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState('');

  async function recibir(archivo) {
    if (!archivo) return;
    setError('');
    setProcesando(true);
    try {
      onElegir(await prepararImagen(archivo, { ladoMaximo }));
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
      // Permite volver a elegir el mismo archivo.
      if (entrada.current) entrada.current.value = '';
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <input
        ref={entrada}
        id={id}
        type="file"
        accept="image/jpeg,image/png"
        className="sr-only"
        tabIndex={-1}
        onChange={(evento) => recibir(evento.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        onDragOver={(evento) => {
          evento.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(evento) => {
          evento.preventDefault();
          setArrastrando(false);
          recibir(evento.dataTransfer.files?.[0]);
        }}
        disabled={procesando}
        aria-label={imagenUrl ? 'Cambiar foto' : ayuda}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`flex w-full ${proporcion} flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 border-dashed p-1.5 text-center transition hover:border-brand-blue disabled:opacity-60 ${
          arrastrando ? 'border-brand-blue bg-blue-50' : 'border-blue-200 bg-blue-50/40'
        }`}
      >
        {imagenUrl ? (
          <img
            src={imagenUrl}
            alt={alt}
            style={posicion ? { objectPosition: posicion } : undefined}
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-brand-blue">
              <IconoImagen className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold leading-tight text-slate-700">
              {procesando ? 'Preparando la foto...' : 'Subir foto'}
            </span>
            <span className="text-xs leading-tight text-slate-500">Haz clic o arrastra el archivo aquí</span>
          </>
        )}
      </button>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : imagenUrl ? (
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          className="self-start text-xs font-medium text-brand-blue hover:underline"
        >
          {procesando ? 'Preparando la foto...' : 'Cambiar foto'}
        </button>
      ) : (
        <p className="text-xs leading-tight text-slate-500">
          {ayuda}. JPG o PNG, máx. {PESO_MAXIMO_ORIGINAL_MB} MB.
        </p>
      )}
    </div>
  );
}
