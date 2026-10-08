// components/layout/AuthLayout.jsx
// Envoltorio compartido por las pantallas de login, registro y
// recuperacion de clave. Fondo con el mismo degradado de marca que el
// Hero del landing (bg-gradient-to-b from-brand-blue-500 to
// brand-blue-800, ver Hero.jsx) en vez de un fondo blanco/gris plano;
// la tarjeta del formulario sigue blanca para que el texto interno no
// pierda contraste.
import { Link } from 'react-router-dom';
import logoBlanco from '../../assets/logoblanco.png';

export function AuthLayout({ titulo, subtitulo, children, pieDePagina }) {
  return (
    <div data-fondo-oscuro className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-brand-blue-500 to-brand-blue-800 px-4 py-12">
      <Link to="/" className="mb-8">
        <img src={logoBlanco} alt="Clínica Veterinaria UDES" className="h-[62px] w-auto" />
      </Link>

      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">{titulo}</h1>
        {subtitulo && <p className="mt-1.5 text-sm text-slate-500">{subtitulo}</p>}

        <div className="mt-6">{children}</div>
      </div>

      {pieDePagina && <div className="mt-6 text-sm text-white/90">{pieDePagina}</div>}
    </div>
  );
}
