// components/landing/Hero.jsx
// Sin fondo propio: el degradado base es continuo con Servicios y vive en
// el contenedor que envuelve a ambos (LandingPage.jsx). Aca solo van los
// halos del Hero (FondoAmbientalHero.jsx).
// La veterinaria + mascota + iconos flotantes son una sola imagen con
// transparencia (identidadmarca/fotomain.png), ya compuesta -- se
// ubica como <img> normal en la columna derecha, no como
// background-image, asi que no hay riesgo de recorte responsivo.
import { useNavigate } from 'react-router-dom';
import fotoMain from '../../assets/foto-main.png';
import { FondoAmbientalHero } from './FondoAmbientalHero';
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

  // pt-24: el contenedor del fondo sube por detras de la topbar (96px,
  // -mt-24 en LandingPage.jsx); el contenido del Hero empieza debajo.
  return (
    <section data-slide className="relative pt-24 lg:flex lg:min-h-svh lg:snap-start lg:snap-always lg:flex-col lg:justify-center">
      <FondoAmbientalHero />
      <div className="slide-sale relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-10">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Cuidamos de quienes hacen parte de <span className="text-brand-amber">tu familia</span>
          </h1>

          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-blue-50">
            Atención veterinaria integral, con profesionales comprometidos y tecnología al servicio de la salud de tu mascota.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={irAAgendar}
              className="inline-flex items-center gap-2 rounded-boton bg-brand-amber px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:brightness-95 active:scale-[0.98]"
            >
              Agendar cita
              <IconoFlechaDerecha className="h-4 w-4" />
            </button>
            <a
              href="#servicios"
              className="rounded-boton border border-white/70 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
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
