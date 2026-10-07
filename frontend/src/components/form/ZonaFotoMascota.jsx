// components/form/ZonaFotoMascota.jsx
// Zona de foto de los formularios de mascota: caja cuadrada punteada con
// icono de camara y texto cuando esta vacia, o la foto recortada al
// cuadrado + "Cambiar foto" cuando ya hay una. Compartida por el admin
// (MascotasPaciente) y el cliente (FormularioMascotaPanel) para que el
// campo se vea igual en ambos.
//
// Es solo la zona: que pasa al hacer clic lo decide quien la usa (el
// admin abre el selector de archivos; el cliente abre su editor de
// foto). onSoltarArchivo (opcional) habilita arrastrar un archivo encima.
import { IconoCamara } from '../icons';

export function ZonaFotoMascota({ fotoUrl, onClick, onSoltarArchivo, className = '' }) {
  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        aria-label={fotoUrl ? 'Cambiar foto de la mascota' : undefined}
        onDragOver={onSoltarArchivo ? (e) => e.preventDefault() : undefined}
        onDrop={
          onSoltarArchivo
            ? (e) => {
                e.preventDefault();
                onSoltarArchivo(e.dataTransfer.files?.[0]);
              }
            : undefined
        }
        className="flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-2 text-center transition hover:border-brand-blue"
      >
        {fotoUrl ? (
          <img src={fotoUrl} alt="Foto de la mascota" className="h-full w-full rounded-lg object-cover" />
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-brand-blue">
              <IconoCamara className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold leading-tight text-slate-700">Sube una foto de tu mascota</span>
            <span className="text-[11px] text-slate-400">JPG, PNG. Máx. 5 MB.</span>
          </>
        )}
      </button>
      {fotoUrl && (
        <button type="button" onClick={onClick} className="mt-1 w-full text-center text-xs font-medium text-brand-blue hover:underline">
          Cambiar foto
        </button>
      )}
    </div>
  );
}
