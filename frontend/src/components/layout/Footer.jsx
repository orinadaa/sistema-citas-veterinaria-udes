// components/layout/Footer.jsx
import logoBlanco from '../../assets/logo-blanco.png';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <img src={logoBlanco} alt="Clínica Veterinaria UDES" className="h-10 w-auto" />
          <p className="mt-4 max-w-xs text-sm text-slate-400">
            Servicio de extensión de la Universidad de Santander para el
            cuidado de tu mascota, en Bucaramanga y Valledupar.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Sedes</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li>Bucaramanga, Santander</li>
            <li>Valledupar, Cesar</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Universidad de Santander</h3>
          <p className="mt-4 text-sm text-slate-400">
            Clínica Veterinaria UDES, un servicio de la Vicerrectoría de Extensión.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-500 sm:px-6">
        © {new Date().getFullYear()} Clínica Veterinaria UDES. Todos los derechos reservados.
      </div>
    </footer>
  );
}
