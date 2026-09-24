// components/landing/Hero.jsx
// Fondo = degradado de marca (brand.blue.500 -> brand.blue.800, ver
// index.css) en vez de una imagen de fondo fija: permite compartir el
// mismo degradado con el navbar (topbar integrado, ver Navbar.jsx) sin
// depender de donde caiga el recorte de una imagen de fondo en cada
// ancho de pantalla. Degradado vertical (to-b), no diagonal: con
// diagonal el borde superior derecho ya sale mas oscuro que el navbar
// (flat brand.blue) y se nota una linea de union; vertical hace que
// TODO el borde superior, de punta a punta, arranque exactamente en
// brand.blue.500 -- igual al navbar solido de arriba, sin costura.
// La veterinaria + mascota + iconos flotantes son una sola imagen con
// transparencia (identidadmarca/fotomain.png), ya compuesta -- se
// ubica como <img> normal en la columna derecha, no como
// background-image, asi que no hay riesgo de recorte responsivo.
import { useNavigate } from 'react-router-dom';
import fotoMain from '../../assets/foto-main.png';
import { IconoFlechaDerecha, IconoPata, IconoEscudo, IconoReloj } from '../icons';
import { useAuth } from '../../context/AuthContext';
import { rutaAgendarCita } from '../../utils/rutas';

const BULLETS = [
  { icono: IconoPata, texto: '2 sedes en Bucaramanga y Valledupar' },
  { icono: IconoEscudo, texto: 'Atención veterinaria integral' },
  { icono: IconoReloj, texto: 'Agendamiento en línea sin llamadas ni filas' },
];

export function Hero() {
  const navegar = useNavigate();
  const { estaAutenticado } = useAuth();

  function irAAgendar() {
    navegar(rutaAgendarCita(estaAutenticado));
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-blue-500 to-brand-blue-800">
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/90">
            <IconoPata className="h-4 w-4" />
            Clínica Veterinaria UDES
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Cuidamos de quienes hacen parte de <span className="text-brand-amber">tu familia</span>
          </h1>

          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-blue-50">
            Atención veterinaria integral, con profesionales comprometidos y tecnología al servicio de la salud de tu mascota.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={irAAgendar}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-amber px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:brightness-95 active:scale-[0.98]"
            >
              Agendar cita
              <IconoFlechaDerecha className="h-4 w-4" />
            </button>
            <a
              href="#servicios"
              className="rounded-lg border border-white/70 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Conoce nuestros servicios
            </a>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
            {BULLETS.map(({ icono: Icono, texto }) => (
              <div key={texto} className="flex items-center gap-2 text-sm font-medium text-white/90">
                <Icono className="h-4 w-4 shrink-0" />
                {texto}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <img src={fotoMain} alt="" className="mx-auto w-full max-w-[670px] drop-shadow-2xl lg:max-w-[770px]" />
        </div>
      </div>
    </section>
  );
}
