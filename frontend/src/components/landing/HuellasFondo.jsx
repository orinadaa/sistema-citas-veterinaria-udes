// components/landing/HuellasFondo.jsx
// Huellas grandes y muy tenues repartidas por todo el fondo del landing.
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

// Huellas de las pantallas de sesion (una sola pantalla de alto): mas
// chicas y mas numerosas que las del landing, repartidas por los bordes y
// las esquinas para no competir con el formulario del centro.
const HUELLAS_SESION = [
  { arriba: '4%', lado: { left: '5%' }, tamano: 'h-28 w-28', giro: '-rotate-[18deg]', opacidad: 'opacity-[0.08]', movil: true },
  { arriba: '2%', lado: { left: '30%' }, tamano: 'h-16 w-16', giro: 'rotate-[24deg]', opacidad: 'opacity-[0.07]', movil: false },
  { arriba: '6%', lado: { right: '28%' }, tamano: 'h-20 w-20', giro: '-rotate-[8deg]', opacidad: 'opacity-[0.07]', movil: false },
  { arriba: '3%', lado: { right: '6%' }, tamano: 'h-32 w-32', giro: 'rotate-[20deg]', opacidad: 'opacity-[0.08]', movil: true },
  { arriba: '24%', lado: { left: '16%' }, tamano: 'h-20 w-20', giro: 'rotate-[34deg]', opacidad: 'opacity-[0.07]', movil: false },
  { arriba: '28%', lado: { right: '14%' }, tamano: 'h-24 w-24', giro: '-rotate-[28deg]', opacidad: 'opacity-[0.07]', movil: false },
  { arriba: '40%', lado: { left: '-1%' }, tamano: 'h-36 w-36', giro: 'rotate-[12deg]', opacidad: 'opacity-[0.08]', movil: false },
  { arriba: '46%', lado: { right: '0%' }, tamano: 'h-40 w-40', giro: '-rotate-[14deg]', opacidad: 'opacity-[0.08]', movil: true },
  { arriba: '52%', lado: { left: '20%' }, tamano: 'h-16 w-16', giro: '-rotate-[30deg]', opacidad: 'opacity-[0.07]', movil: false },
  { arriba: '58%', lado: { right: '22%' }, tamano: 'h-16 w-16', giro: 'rotate-[16deg]', opacidad: 'opacity-[0.07]', movil: false },
  { arriba: '70%', lado: { left: '8%' }, tamano: 'h-28 w-28', giro: 'rotate-[26deg]', opacidad: 'opacity-[0.08]', movil: false },
  { arriba: '74%', lado: { right: '10%' }, tamano: 'h-28 w-28', giro: 'rotate-[10deg]', opacidad: 'opacity-[0.08]', movil: false },
  { arriba: '84%', lado: { left: '28%' }, tamano: 'h-20 w-20', giro: '-rotate-[20deg]', opacidad: 'opacity-[0.07]', movil: true },
  { arriba: '86%', lado: { right: '30%' }, tamano: 'h-24 w-24', giro: 'rotate-[30deg]', opacidad: 'opacity-[0.07]', movil: false },
  { arriba: '88%', lado: { left: '-2%' }, tamano: 'h-32 w-32', giro: '-rotate-[10deg]', opacidad: 'opacity-[0.08]', movil: false },
  { arriba: '90%', lado: { right: '-1%' }, tamano: 'h-36 w-36', giro: '-rotate-[24deg]', opacidad: 'opacity-[0.08]', movil: true },
];

// denso: la lista de las pantallas de sesion en vez de la del landing.
export function HuellasFondo({ denso = false }) {
  const huellas = denso ? HUELLAS_SESION : HUELLAS;
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
