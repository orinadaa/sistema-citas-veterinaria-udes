// components/landing/BurbujaWhatsapp.jsx
// Burbuja flotante de WhatsApp de la pagina publica (RF-23, pedido de
// Oriana): circulo verde con el logo, fijo abajo a la derecha, que abre el
// chat con el numero de la clinica en una pestaña nueva.
// El numero y si se muestra o no los configura el superadministrador (Pagina
// web > Informacion de la clinica). Sin numero, o con la burbuja apagada, no
// se dibuja nada.
// - Verde #128C7E (no el #25D366 mas claro): con el logo blanco cumple
//   contraste para elementos graficos.
// - 56 px: area comoda para tocar en celular. Deja libre el borde derecho,
//   donde va la barra de desplazamiento del sistema.
import { useInfoClinica } from '../../hooks/useInfoClinica';
import { IconoWhatsapp } from '../icons';

export function BurbujaWhatsapp() {
  const clinica = useInfoClinica();
  if (!clinica?.whatsappNumero) return null;

  return (
    <a
      href={`https://wa.me/${clinica.whatsappNumero}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp (se abre en una pestaña nueva)"
      title="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-7 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#128C7E] text-white shadow-[0_10px_28px_-6px_rgb(18_140_126/0.75),inset_0_1px_0_rgb(255_255_255/0.35)] ring-2 ring-white/70 outline-none transition hover:scale-105 hover:bg-[#0f7a6e] focus-visible:ring-4 focus-visible:ring-white motion-reduce:hover:scale-100 sm:bottom-6"
    >
      <IconoWhatsapp className="h-8 w-8" peso="fill" />
    </a>
  );
}
