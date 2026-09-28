// components/cliente/AvatarMascota.jsx
// Foto circular de la mascota (foto_url real subida por el dueño) o,
// si no tiene, el icono de pata sobre fondo ambar de siempre.
import { IconoPata } from '../icons';

export function AvatarMascota({ mascota, fotoUrl, className = 'h-12 w-12', iconoClassName = 'h-6 w-6' }) {
  const src = fotoUrl ?? mascota?.foto_url;
  if (src) {
    return <img src={src} alt={mascota?.nombre || 'Foto de la mascota'} className={`${className} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span className={`${className} flex shrink-0 items-center justify-center rounded-full bg-amber-50 text-brand-amber`}>
      <IconoPata className={iconoClassName} />
    </span>
  );
}
