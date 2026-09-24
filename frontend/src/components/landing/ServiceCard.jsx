// components/landing/ServiceCard.jsx
// Tarjeta de servicio con foto (identidadmarca/card{servicio}.png): la
// imagen ya trae integrada la franja blanca inferior para el texto, asi
// que el texto se superpone con position absolute sobre la propia
// imagen -- nunca un <div> blanco aparte (crearia una linea de union
// visible, el blanco de la imagen no es exactamente el mismo tono que
// cualquier blanco que se intente igualar por CSS).
//
// Las imagenes reales miden 1312x1199 (practicamente cuadradas, no
// 4:3): se usa aspect-square para no recortar la cabeza de la mascota
// arriba ni la franja de texto abajo.
import { Link } from 'react-router-dom';
import { IconoFlechaDerecha } from '../icons';

export function ServiceCard({ image, title, description, accentColor = 'blue', href }) {
  const Envoltura = href ? Link : 'div';
  const propsEnvoltura = href ? { to: href } : {};

  return (
    <Envoltura
      {...propsEnvoltura}
      className={`group relative block aspect-square overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-100 transition-all duration-200 ease-out hover:-translate-y-2 hover:scale-[1.03] hover:shadow-xl ${
        href ? 'cursor-pointer' : ''
      }`}
    >
      <img src={image} alt="" className="h-full w-full object-cover" />

      <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-10">
        <h3 className="pr-12 text-base font-bold text-brand-navy">{title}</h3>
        {description && <p className="mt-1 pr-12 text-sm leading-snug text-slate-500 line-clamp-2">{description}</p>}

        <span
          className={`absolute bottom-4 right-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm transition group-hover:scale-110 ${
            accentColor === 'amber' ? 'bg-brand-amber text-brand-navy' : 'bg-brand-blue text-white'
          }`}
        >
          <IconoFlechaDerecha className="h-4 w-4" />
        </span>
      </div>
    </Envoltura>
  );
}
