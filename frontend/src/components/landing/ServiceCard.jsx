// components/landing/ServiceCard.jsx
// Tarjeta de servicio con foto (identidadmarca/card{servicio}.png). La
// imagen es la tarjeta: sin contenedor rectangular que la recorte, sin
// overflow-hidden ni object-cover -- se ve la forma real de la "nube"
// recortada (fondo transparente) "flotando" con drop-shadow (que sigue
// la silueta real de los pixeles opacos, a diferencia de box-shadow,
// que dibujaria un rectangulo invisible detras).
//
// El texto se superpone sobre la franja blanca que la propia imagen ya
// trae integrada en su ~35% inferior -- nunca un <div> blanco aparte
// (crearia una linea de union visible, el blanco de la imagen no es
// exactamente el mismo tono que cualquier blanco que se intente igualar
// por CSS).
import { Link } from 'react-router-dom';
import { IconoFlechaDerecha } from '../icons';

export function ServiceCard({ image, title, description, accentColor = 'blue', href }) {
  const Envoltura = href ? Link : 'div';
  const propsEnvoltura = href ? { to: href } : {};

  return (
    <Envoltura
      {...propsEnvoltura}
      className={`group relative mx-auto block w-full max-w-[240px] transition-all duration-200 ease-out hover:-translate-y-2 hover:scale-[1.03] ${
        href ? 'cursor-pointer' : ''
      }`}
    >
      <img
        src={image}
        alt=""
        className="w-full drop-shadow-md transition-[filter] duration-200 ease-out group-hover:drop-shadow-xl"
      />

      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-8">
        <h3 className="pr-9 text-sm font-bold text-brand-navy">{title}</h3>
        {description && <p className="mt-0.5 pr-9 text-xs leading-snug text-slate-500 line-clamp-2">{description}</p>}

        <span
          className={`absolute bottom-3 right-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm transition group-hover:scale-110 ${
            accentColor === 'amber' ? 'bg-brand-amber text-brand-navy' : 'bg-brand-blue text-white'
          }`}
        >
          <IconoFlechaDerecha className="h-3.5 w-3.5" />
        </span>
      </div>
    </Envoltura>
  );
}
