// components/landing/HuellasFondo.jsx
// Huellas grandes y muy tenues repartidas por todo el fondo del landing
// (pedido de Oriana: la huella que estaba solo en Horarios, ahora en todo
// el fondo y en lugares que parezcan al azar). Son adorno: estaticas, no
// reciben el mouse y van detras de todas las secciones. Las posiciones son
// fijas (porcentajes del alto total del fondo, que abarca las cinco
// secciones), elegidas a mano para que no sigan un patron ni caigan dos
// juntas; al ser fijas no cambian entre visitas ni saltan al recargar.
// En celular se muestran solo algunas, para no ensuciar una pantalla chica.
// Tambien las usan las pantallas de sesion (AuthLayout), en modo compacto.
import { IconoPata } from '../icons';

const HUELLAS = [
  { arriba: '3%', lado: { right: '6%' }, tamano: 'h-40 w-40', giro: 'rotate-[18deg]', opacidad: 'opacity-[0.05]', movil: false },
  { arriba: '11%', lado: { left: '-2%' }, tamano: 'h-56 w-56', giro: '-rotate-[14deg]', opacidad: 'opacity-[0.06]', movil: true },
  { arriba: '21%', lado: { right: '-3%' }, tamano: 'h-64 w-64', giro: 'rotate-[28deg]', opacidad: 'opacity-[0.05]', movil: false },
  { arriba: '29%', lado: { left: '38%' }, tamano: 'h-32 w-32', giro: '-rotate-[32deg]', opacidad: 'opacity-[0.04]', movil: false },
  { arriba: '36%', lado: { left: '3%' }, tamano: 'h-48 w-48', giro: 'rotate-[10deg]', opacidad: 'opacity-[0.06]', movil: true },
  { arriba: '45%', lado: { right: '8%' }, tamano: 'h-44 w-44', giro: '-rotate-[22deg]', opacidad: 'opacity-[0.05]', movil: false },
  { arriba: '53%', lado: { left: '-3%' }, tamano: 'h-60 w-60', giro: 'rotate-[36deg]', opacidad: 'opacity-[0.05]', movil: false },
  { arriba: '61%', lado: { right: '30%' }, tamano: 'h-28 w-28', giro: 'rotate-[8deg]', opacidad: 'opacity-[0.04]', movil: false },
  { arriba: '68%', lado: { right: '-2%' }, tamano: 'h-56 w-56', giro: '-rotate-[12deg]', opacidad: 'opacity-[0.06]', movil: true },
  { arriba: '77%', lado: { left: '-2%' }, tamano: 'h-56 w-56', giro: '-rotate-12', opacidad: 'opacity-[0.06]', movil: false },
  { arriba: '86%', lado: { right: '12%' }, tamano: 'h-40 w-40', giro: 'rotate-[24deg]', opacidad: 'opacity-[0.05]', movil: true },
  { arriba: '93%', lado: { left: '22%' }, tamano: 'h-36 w-36', giro: '-rotate-[26deg]', opacidad: 'opacity-[0.05]', movil: false },
];

// compacto: para una pagina de una sola pantalla (inicio de sesion, registro,
// recuperar contraseña). La lista esta pensada para las cinco pantallas del
// landing; en una sola quedaria amontonada, asi que se usa una de cada dos.
export function HuellasFondo({ compacto = false }) {
  const huellas = compacto ? HUELLAS.filter((_, indice) => indice % 2 === 0) : HUELLAS;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden text-white">
      {huellas.map((h) => (
        <span key={h.arriba} className={`absolute ${h.movil ? 'block' : 'hidden md:block'}`} style={{ top: h.arriba, ...h.lado }}>
          <IconoPata peso="fill" className={`${h.tamano} ${h.giro} ${h.opacidad}`} />
        </span>
      ))}
    </div>
  );
}
