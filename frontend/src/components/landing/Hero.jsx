// components/landing/Hero.jsx
// Sin fondo propio: el degradado base es continuo con Servicios y vive en el
// contenedor que envuelve a ambos (LandingPage.jsx).
import { useNavigate } from 'react-router-dom';
import { HeroGaleria } from './HeroGaleria';
import { FondoAmbientalHero } from './FondoAmbientalHero';
import { IconoFlechaDerecha, IconoPata, IconoEscudo } from '../icons';
import { useAuth } from '../../context/AuthContext';
import { rutaAgendarCita } from '../../utils/rutas';
import { useTextosSitio } from '../../hooks/useTextosSitio';

export function Hero() {
  const navegar = useNavigate();
  const { estaAutenticado } = useAuth();
  // Textos editables por el superadministrador (Pagina web > Textos).
  const textos = useTextosSitio();
  const vinetas = [
    { icono: IconoPata, texto: textos.hero_vineta_1 },
    { icono: IconoEscudo, texto: textos.hero_vineta_2 },
  ].filter((v) => v.texto);

  function irAAgendar() {
    navegar(rutaAgendarCita(estaAutenticado));
  }

  // pt-24: el contenedor del fondo sube por detras de la topbar (96px,
  // -mt-24 en LandingPage.jsx); el contenido del Hero empieza debajo.
  return (
    <section data-slide className="relative pt-24 lg:flex lg:min-h-svh lg:snap-start lg:snap-always lg:flex-col lg:justify-center">
      <FondoAmbientalHero />
      <div className="slide-sale relative mx-auto grid grid-cols-[minmax(0,1fr)] w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-10">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            {textos.hero_titulo}
            {textos.hero_destacado && <> <span className="text-brand-amber">{textos.hero_destacado}</span></>}
          </h1>

          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-blue-50">
            {textos.hero_descripcion}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={irAAgendar}
              className="boton-glass-ambar inline-flex items-center gap-2 rounded-boton px-6 py-3 text-base font-semibold text-slate-900 transition active:scale-[0.98]"
            >
              Agendar cita
              <IconoFlechaDerecha className="h-4 w-4" />
            </button>
            <a
              href="#servicios"
              className="boton-glass-claro rounded-boton px-6 py-3 text-base font-semibold text-white transition active:scale-[0.98]"
            >
              Conoce nuestros servicios
            </a>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
            {vinetas.map(({ icono: Icono, texto }) => (
              <div key={texto} className="flex items-center gap-2 text-sm font-medium text-white/90">
                <Icono className="h-4 w-4 shrink-0" />
                {texto}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <HeroGaleria />
        </div>
      </div>
    </section>
  );
}
