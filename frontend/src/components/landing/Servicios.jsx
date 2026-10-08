// components/landing/Servicios.jsx
// RF-11/RF-16: catalogo real de servicios, obtenido de GET /api/servicios.
// Se muestra como slider fotografico (ServicioSlider.jsx) con el nombre,
// la descripcion y la FOTO de cada servicio, todo de la base de datos: la
// foto la sube el administrador en Servicios > Editar (un servicio sin
// foto no aparece aca). El boton "Agendar cita" de cada slide lleva a
// agendar con ese servicio preseleccionado.
import { useEffect, useState } from 'react';
import { obtenerServicios } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { rutaAgendarCita } from '../../utils/rutas';
import { IconoAlerta } from '../icons';
import { Revelar } from './Revelar';
import { SectionHeading } from './SectionHeading';
import { FondoAmbientalServicios } from './FondoAmbientalServicios';
import { TarjetaSlide } from './TarjetaSlide';
import { ServicioSlider } from './ServicioSlider';

// "Profilaxis dental" se muestra en el landing con el nombre comercial
// "Odontología" — es solo una etiqueta de presentacion publica, el
// nombre real del servicio en la base de datos no cambia.
const ETIQUETA_PUBLICA = { 'Profilaxis dental': 'Odontología' };

const ESTADOS = { CARGANDO: 'cargando', LISTO: 'listo', ERROR: 'error' };

export function Servicios() {
  const { estaAutenticado } = useAuth();
  const [estado, setEstado] = useState(ESTADOS.CARGANDO);
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    obtenerServicios()
      .then((datos) => {
        setServicios(datos.servicios);
        setEstado(ESTADOS.LISTO);
      })
      .catch(() => setEstado(ESTADOS.ERROR));
  }, []);

  // Por foto: `enfoque` = object-position (el encuadre que eligio el
  // administrador) para que el recorte no corte al paciente; `oscuridad` =
  // 'alta' para las fotos de fondo claro, donde el overlay normal no
  // alcanza el contraste del texto blanco.
  const slides = servicios
    .filter((servicio) => servicio.foto_url)
    .map((servicio) => ({
      id: servicio.id,
      titulo: ETIQUETA_PUBLICA[servicio.nombre] ?? servicio.nombre,
      descripcion: servicio.descripcion,
      imagen: servicio.foto_url,
      alt: servicio.foto_descripcion || `Foto del servicio ${servicio.nombre}`,
      enfoque: `${servicio.foto_foco_x}% ${servicio.foto_foco_y}%`,
      oscuridad: servicio.foto_fondo_claro ? 'alta' : 'normal',
      href: rutaAgendarCita(estaAutenticado, servicio.id),
    }));

  return (
    // Sin fondo propio: la base es el degradado continuo Hero + Servicios
    // (LandingPage.jsx); aca solo van los halos.
    <section id="servicios" data-slide className="relative py-20 lg:flex lg:min-h-svh lg:snap-start lg:snap-always lg:flex-col lg:pb-0 lg:pt-28">
      <FondoAmbientalServicios />
      {/* Sombra azul oscura detras del encabezado: garantiza contraste AA del
          texto blanco sobre los halos. A todo el ancho de la pantalla y mas
          alta que el encabezado, con caida muy gradual, para que no se lea
          como una franja con bordes. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[30rem]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 75% 42% at 28% 50%, color-mix(in oklab, var(--color-brand-blue-800) 85%, transparent) 0%, color-mix(in oklab, var(--color-brand-blue-800) 55%, transparent) 40%, color-mix(in oklab, var(--color-brand-blue-800) 20%, transparent) 70%, transparent 100%)',
        }}
      />
      {/* Desde lg la seccion es una tarjeta translucida que llega hasta el
          borde inferior (TarjetaSlide.jsx). */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:flex lg:flex-1 lg:flex-col">
        <TarjetaSlide>
          <Revelar>
            <SectionHeading
              titulo="Servicios veterinarios"
              subtitulo="Contamos con una amplia gama de servicios para el cuidado integral de tu mascota."
              sobreFondoOscuro
            />
          </Revelar>

          {estado === ESTADOS.CARGANDO && (
            <div className="mt-10 aspect-[3/4] w-full animate-pulse rounded-2xl bg-white/10 sm:aspect-square lg:aspect-auto lg:h-[clamp(22rem,calc(100svh-20.5rem),46rem)] lg:rounded-3xl" />
          )}

          {estado === ESTADOS.ERROR && (
            <div className="mt-10 flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-800 ring-1 ring-amber-200">
              <IconoAlerta className="h-5 w-5 shrink-0" />
              <p className="text-sm">No pudimos cargar los servicios en este momento.</p>
            </div>
          )}

          {estado === ESTADOS.LISTO && slides.length > 0 && (
            <Revelar retraso={120} className="mt-10 lg:mt-6">
              <ServicioSlider slides={slides} />
            </Revelar>
          )}
        </TarjetaSlide>
      </div>
    </section>
  );
}
