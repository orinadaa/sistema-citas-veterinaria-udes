// components/layout/AuthLayout.jsx
// Envoltorio compartido por las pantallas de login y registro.
import { Link } from 'react-router-dom';
import logoAzul from '../../assets/logo-azul.png';

export function AuthLayout({ titulo, subtitulo, children, pieDePagina }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <Link to="/" className="mb-8">
        <img src={logoAzul} alt="Clínica Veterinaria UDES" className="h-10 w-auto" />
      </Link>

      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">{titulo}</h1>
        {subtitulo && <p className="mt-1.5 text-sm text-slate-500">{subtitulo}</p>}

        <div className="mt-6">{children}</div>
      </div>

      {pieDePagina && <div className="mt-6 text-sm text-slate-500">{pieDePagina}</div>}
    </div>
  );
}
