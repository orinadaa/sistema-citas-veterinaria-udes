// components/landing/canales.js
// Canales de contacto de la clinica (RF-23) que muestra la pagina publica: el
// boton flotante de contacto y el pie de pagina.
import { IconoFacebook, IconoInstagram, IconoTiktok, IconoWhatsapp, IconoYoutube } from '../icons';

const REDES = [
  { clave: 'instagramUrl', nombre: 'Instagram', Icono: IconoInstagram, color: '#C13584' },
  { clave: 'facebookUrl', nombre: 'Facebook', Icono: IconoFacebook, color: '#1877F2' },
  { clave: 'tiktokUrl', nombre: 'TikTok', Icono: IconoTiktok, color: '#111827' },
  { clave: 'youtubeUrl', nombre: 'YouTube', Icono: IconoYoutube, color: '#DC2626' },
];

// clinica: lo que devuelve useInfoClinica() (null mientras carga).
export function canalesDe(clinica) {
  if (!clinica) return [];
  const canales = [];
  if (clinica.whatsappNumero) {
    canales.push({ clave: 'whatsapp', nombre: 'WhatsApp', href: `https://wa.me/${clinica.whatsappNumero}`, Icono: IconoWhatsapp, color: '#128C7E' });
  }
  REDES.forEach(({ clave, ...red }) => {
    if (clinica[clave]) canales.push({ clave, href: clinica[clave], ...red });
  });
  return canales;
}
