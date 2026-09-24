// components/landing/Hero.jsx
// Fondo = identidadmarca/fondoazullanding.png (degradado azul con la
// veterinaria, la mascota y los iconos 3D ya compuestos dentro de la
// imagen — no se recrean por separado). Se muestra la foto tal cual,
// sin scrim/degradado superpuesto.
import { useNavigate } from 'react-router-dom';
import heroFondo from '../../assets/hero-fondo.png';
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
    <section
      className="relative overflow-hidden bg-cover bg-[position:right_center] bg-no-repeat"
      style={{ backgroundImage: `url(${heroFondo})` }}
    >
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/90">
            <IconoPata className="h-4 w-4" />
            Clínica Veterinaria UDES
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Cuidamos de quienes hacen parte de <span style={{ color: '#F9C422' }}>tu familia</span>
          </h1>

          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-blue-50">
            Atención veterinaria integral, con profesionales comprometidos y tecnología al servicio de la salud de tu mascota.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={irAAgendar}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:brightness-95 active:scale-[0.98]"
              style={{ backgroundColor: '#FDCA18' }}
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
      </div>
    </section>
  );
}
