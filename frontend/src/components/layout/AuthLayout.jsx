// components/layout/AuthLayout.jsx
// Envoltorio compartido por las pantallas de login, registro y
// recuperacion de clave. Mismo material que las pantallas del cliente
// (vetUI): fondo de marca con halos (FondoVetui) y el formulario en una
// tarjeta de vidrio blanco flotante (texto oscuro: AA sobre el vidrio).
import { Link } from 'react-router-dom';
import { FondoVetui } from '../vetui';
import logoBlanco from '../../assets/logoblanco.png';

export function AuthLayout({ titulo, subtitulo, children, pieDePagina }) {
  return (
    <FondoVetui className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8">
        <img src={logoBlanco} alt="Clínica Veterinaria UDES" className="h-[62px] w-auto" />
      </Link>

      <div className="vidrio-blanco w-full max-w-sm rounded-superficie p-8">
        <h1 className="text-xl font-semibold text-brand-navy">{titulo}</h1>
        {subtitulo && <p className="mt-1.5 text-sm text-slate-700">{subtitulo}</p>}

        <div className="mt-6">{children}</div>
      </div>

      {pieDePagina && <div className="mt-6 text-sm text-white/90">{pieDePagina}</div>}
    </FondoVetui>
  );
}
