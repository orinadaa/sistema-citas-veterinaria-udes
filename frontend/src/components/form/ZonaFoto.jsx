// components/form/ZonaFoto.jsx
// Zona de foto estandar del sistema: circulo punteado con icono de camara
// y "Subir foto" cuando esta vacio, o la foto recortada al circulo cuando
// ya hay una; debajo va la ayuda (que subir y formato) o "Cambiar foto".
// La usan todos los campos donde se sube una foto: mascota (cliente,
// admin y medico) y foto de perfil del medico. Circular (pedido de
// Oriana): asi la foto se ve como en el resto del sistema.
//
// Es solo la zona: el clic abre el editor de foto (FotoMascotaModal:
// elegir archivo, encuadrar, vista previa), que es quien valida formato
// y tamaño y entrega la imagen final.
import { IconoCamara } from '../icons';

export function ZonaFoto({
  fotoUrl,
  onClick,
  ayuda = 'Sube una foto de tu mascota',
  alt = 'Foto de la mascota',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        aria-label={fotoUrl ? 'Cambiar foto' : ayuda}
        className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-full border-2 border-dashed border-blue-200 bg-blue-50/40 p-1.5 text-center transition hover:border-brand-blue"
      >
        {fotoUrl ? (
          <img src={fotoUrl} alt={alt} className="h-full w-full rounded-full object-cover" />
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
        <button type="button" onClick={onClick} className="text-center text-xs font-medium text-brand-blue-600 hover:underline">
          Cambiar foto
        </button>
      ) : (
        // Fuera del circulo: adentro, a 130px de ancho, no cabia sin apretarse.
        <p className="text-center text-xs leading-tight text-slate-500">
          {ayuda}
          <br />
          JPG, PNG. Máx. 5 MB.
        </p>
      )}
    </div>
  );
}
