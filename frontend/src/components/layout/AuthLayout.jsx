// components/layout/AuthLayout.jsx
// Envoltorio compartido por las pantallas de login, registro y recuperacion de
// clave.
import { Link } from 'react-router-dom';
import { FondoVetui } from '../vetui';
import { HuellasFondo } from '../landing/HuellasFondo';
import { useLogos } from '../../hooks/useLogos';

export function AuthLayout({ titulo, subtitulo, children, pieDePagina }) {
  const logos = useLogos();
  return (
    <FondoVetui variante="sesion" textoDirecto className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
      <HuellasFondo denso />
      <header className="mb-8">
      <Link to="/">
        <img src={logos.principal_blanco} alt="Clínica Veterinaria UDES, ir al inicio" width="93" height="62" className="h-[62px] w-auto" />
      </Link>
      </header>

      <main className="vidrio-blanco w-full max-w-sm rounded-superficie p-8">
        <h1 className="text-xl font-semibold text-brand-navy">{titulo}</h1>
        {subtitulo && <p className="mt-1.5 text-sm text-slate-700">{subtitulo}</p>}

        <div className="mt-6">{children}</div>
      </main>

      {pieDePagina && <footer className="mt-6 text-sm text-white/90">{pieDePagina}</footer>}
    </FondoVetui>
  );
}
