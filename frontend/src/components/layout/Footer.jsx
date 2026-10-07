// components/layout/Footer.jsx
import logoBlanco from '../../assets/logoblanco.png';

const ENLACES_RAPIDOS = [
  { href: '#servicios', etiqueta: 'Servicios' },
  { href: '#sedes', etiqueta: 'Sedes' },
  { href: '#horarios', etiqueta: 'Horarios' },
];

export function Footer() {
  return (
    <footer className="text-slate-300" style={{ backgroundColor: '#0E172C' }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          {/* Mismo archivo que el logo grande de la topbar (logoblanco.png). */}
          <img src={logoBlanco} alt="Clínica Veterinaria UDES" className="h-20 w-auto" />
          <p className="mt-4 max-w-xs text-sm text-slate-400">
            Servicio de extensión de la Universidad de Santander para el
            cuidado de tu mascota, en Bucaramanga y Valledupar.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Enlaces rápidos</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            {ENLACES_RAPIDOS.map((enlace) => (
              <li key={enlace.href}>
                <a href={enlace.href} className="hover-texto-ilumina transition hover:text-white">
                  {enlace.etiqueta}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Universidad de Santander</h3>
          <p className="mt-4 text-sm text-slate-400">
            Clínica Veterinaria UDES, un servicio de la Vicerrectoría de Extensión.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-6 text-center text-xs text-slate-500 sm:px-6">
        © {new Date().getFullYear()} Clínica Veterinaria UDES. Todos los derechos reservados.
      </div>
    </footer>
  );
}
