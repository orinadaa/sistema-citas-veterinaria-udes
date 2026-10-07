// components/form/ZonaFotoMascota.jsx
// Zona de foto de los formularios de mascota: circulo punteado con icono
// de camara y "Subir foto" cuando esta vacio, o la foto recortada al
// circulo cuando ya hay una; debajo va el formato permitido o "Cambiar
// foto". Compartida por el admin y el medico (MascotasPaciente) y el
// cliente (FormularioMascotaPanel) para que el campo se vea igual en
// todos. Circular (pedido de Oriana): asi la foto se ve como en el resto
// del sistema (AvatarMascota).
//
// Es solo la zona: que pasa al hacer clic lo decide quien la usa (el
// admin abre el selector de archivos; el cliente abre su editor de
// foto). onSoltarArchivo (opcional) habilita arrastrar un archivo encima.
import { IconoCamara } from '../icons';

export function ZonaFotoMascota({ fotoUrl, onClick, onSoltarArchivo, className = '' }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        aria-label={fotoUrl ? 'Cambiar foto de la mascota' : 'Subir una foto de tu mascota'}
        onDragOver={onSoltarArchivo ? (e) => e.preventDefault() : undefined}
        onDrop={
          onSoltarArchivo
            ? (e) => {
                e.preventDefault();
                onSoltarArchivo(e.dataTransfer.files?.[0]);
              }
            : undefined
        }
        className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-full border-2 border-dashed border-blue-200 bg-blue-50/40 p-1.5 text-center transition hover:border-brand-blue"
      >
        {fotoUrl ? (
          <img src={fotoUrl} alt="Foto de la mascota" className="h-full w-full rounded-full object-cover" />
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-brand-blue">
              <IconoCamara className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold leading-tight text-slate-700">Subir foto</span>
          </>
        )}
      </button>
      {fotoUrl ? (
        <button type="button" onClick={onClick} className="text-center text-xs font-medium text-brand-blue hover:underline">
          Cambiar foto
        </button>
      ) : (
        // Fuera del circulo: adentro, a 130px de ancho, no cabia sin apretarse.
        <p className="text-center text-[11px] leading-tight text-slate-500">
          Sube una foto de tu mascota
          <br />
          JPG, PNG. Máx. 5 MB.
        </p>
      )}
    </div>
  );
}
