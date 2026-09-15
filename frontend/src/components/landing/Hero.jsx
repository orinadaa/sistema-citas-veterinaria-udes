// components/landing/Hero.jsx
import { useNavigate } from 'react-router-dom';
import logoBlanco from '../../assets/logo-blanco.png';
import { IconoUbicacion, IconoReloj, IconoFlechaDerecha } from '../icons';
import { useAuth } from '../../context/AuthContext';

export function Hero() {
  const navegar = useNavigate();
  const { estaAutenticado } = useAuth();

  function irAAgendar() {
    navegar(estaAutenticado ? '/panel' : '/iniciar-sesion?next=/panel');
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-20">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Agenda la cita de tu mascota en minutos
        </h1>
        <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-slate-600">
          Consulta horarios, elige tu sede y agenda en línea, sin llamadas ni
          filas. Bucaramanga y Valledupar.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={irAAgendar}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
          >
            Agendar cita
            <IconoFlechaDerecha className="h-4 w-4" />
          </button>
          <a
            href="#servicios"
            className="rounded-lg px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Ver servicios
          </a>
        </div>
      </div>

      <div className="relative">
        <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-blue-900 p-10 shadow-xl">
          <img src={logoBlanco} alt="" className="w-3/4 max-w-xs" />
        </div>

        <div className="absolute -right-4 -top-4 hidden items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-lg ring-1 ring-slate-200 sm:flex">
          <IconoUbicacion className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-slate-700">2 sedes disponibles</span>
        </div>

        <div className="absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-lg ring-1 ring-slate-200 sm:flex">
          <IconoReloj className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-slate-700">Confirmación automática</span>
        </div>
      </div>
    </section>
  );
}
