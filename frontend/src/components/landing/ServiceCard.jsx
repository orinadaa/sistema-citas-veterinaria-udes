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
// por CSS). La tarjeta completa es el enlace (sin boton de flecha
// aparte): toda la imagen es clickeable.
import { Link } from 'react-router-dom';

export function ServiceCard({ image, title, href }) {
  const Envoltura = href ? Link : 'div';
  const propsEnvoltura = href ? { to: href } : {};

  return (
    <Envoltura
      {...propsEnvoltura}
      className={`group relative mx-auto block w-full max-w-[390px] transition-all duration-200 ease-out hover:-translate-y-2 hover:scale-[1.03] ${
        href ? 'cursor-pointer' : ''
      }`}
    >
      <img
        src={image}
        alt=""
        className="w-full drop-shadow-md transition-[filter] duration-200 ease-out group-hover:drop-shadow-xl"
      />

      <div className="absolute inset-x-0 bottom-0 px-6 pb-6 pt-10 text-center">
        <h3 className="text-2xl font-bold text-brand-navy">{title}</h3>
      </div>
    </Envoltura>
  );
}
