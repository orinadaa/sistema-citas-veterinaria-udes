// components/layout/Footer.jsx
// WhatsApp y las redes sociales los configura el superadministrador (RF-23,
// Pagina web > Informacion de la clinica): solo sale el icono de los canales
// que tienen numero o enlace.
import { Link } from 'react-router-dom';
import logoBlanco from '../../assets/logoblanco.webp';
import { useInfoClinica } from '../../hooks/useInfoClinica';
import { canalesDe } from '../landing/canales';

const ENLACES_RAPIDOS = [
  { href: '#servicios', etiqueta: 'Servicios' },
  { href: '#sedes', etiqueta: 'Sedes' },
  { href: '#horarios', etiqueta: 'Horarios' },
];

// Compacto a proposito (pedido de Oriana). Despues de Horarios viene directo
// el footer (la banda "¿Tu mascota necesita una cita?" se quito): es el
// ultimo punto del landing paginado (data-slide + snap), asi la rueda baja
// hasta el y no rebota de vuelta a Horarios.
export function Footer() {
  const canales = canalesDe(useInfoClinica());
  return (
    <footer data-slide className="text-slate-300 lg:snap-start lg:snap-always" style={{ backgroundColor: '#0E172C' }}>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 md:grid-cols-3 md:gap-10">
        <div>
          {/* Mismo archivo que el logo grande de la topbar (logoblanco.png). */}
          <img src={logoBlanco} alt="Clínica Veterinaria UDES" width="120" height="80" loading="lazy" className="h-20 w-auto" />
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Servicio de extensión de la Universidad de Santander para el
            cuidado de tu mascota, en Bucaramanga y Valledupar.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Enlaces rápidos</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-400">
            {ENLACES_RAPIDOS.map((enlace) => (
              <li key={enlace.href}>
                <a href={enlace.href} className="hover-texto-ilumina inline-block py-1 transition hover:text-white">
                  {enlace.etiqueta}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Universidad de Santander</h3>
          <p className="mt-2 text-sm text-slate-400">
            Clínica Veterinaria UDES, un servicio de la Vicerrectoría de Extensión.
          </p>
          {canales.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Contacto y redes sociales">
              {canales.map(({ clave, nombre, href, Icono }) => (
                <li key={clave}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${nombre} (se abre en una pestaña nueva)`}
                    title={nombre}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/20 hover:text-white"
                  >
                    <Icono className="h-5 w-5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* slate-400: el slate-500 anterior no llegaba a 4,5:1 sobre este fondo. */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-white/10 px-4 py-3 text-center text-xs text-slate-400 sm:px-6">
        <span>© {new Date().getFullYear()} Clínica Veterinaria UDES. Todos los derechos reservados.</span>
        <Link to="/privacidad" className="hover-texto-ilumina py-1.5 underline underline-offset-2 hover:text-white">
          Política de privacidad
        </Link>
        <Link to="/aviso-legal" className="hover-texto-ilumina py-1.5 underline underline-offset-2 hover:text-white">
          Aviso legal
        </Link>
      </div>
    </footer>
  );
}
