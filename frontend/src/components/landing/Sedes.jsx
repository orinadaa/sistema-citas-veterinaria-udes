// components/landing/Sedes.jsx
// RF-03: informacion publica de sedes, obtenida del endpoint real
// GET /api/sedes. La foto de cada sede es la que el admin configuro
// (sede.foto_url, ver panel de Sedes) — no existe un banco de fotos
// reales de los edificios en identidad de marca, asi que se usa un
// placeholder con el icono de ubicacion mientras el admin no cargue una.
// La tarjeta muestra solo nombre y ciudad/direccion (el horario completo
// esta en la seccion Horarios, justo despues): la foto ocupa casi todo.
import { useEffect, useState } from 'react';
import { obtenerSedes } from '../../api/client';
import { IconoUbicacion, IconoAlerta, IconoSede, IconoFlechaDerecha } from '../icons';
import { urlVerEnMaps } from '../../utils/mapas';
import { Revelar } from './Revelar';
import { SectionHeading } from './SectionHeading';
import { HalosAmbientales } from './HalosAmbientales';
import { TarjetaSlide } from './TarjetaSlide';

const ESTADOS = { CARGANDO: 'cargando', LISTO: 'listo', ERROR: 'error' };

export function Sedes() {
  const [estado, setEstado] = useState(ESTADOS.CARGANDO);
  const [sedes, setSedes] = useState([]);

  useEffect(() => {
    obtenerSedes()
      .then((datos) => {
        setSedes(datos.sedes);
        setEstado(ESTADOS.LISTO);
      })
      .catch(() => setEstado(ESTADOS.ERROR));
  }, []);

  return (
    // Sin fondo propio: va sobre el degradado continuo del landing.
    <section id="sedes" data-slide className="relative py-20 lg:flex lg:min-h-svh lg:snap-start lg:snap-always lg:flex-col lg:pb-0 lg:pt-28">
      <HalosAmbientales variante="sedes" />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:flex lg:flex-1 lg:flex-col">
        <TarjetaSlide>
          <Revelar>
            <SectionHeading
              titulo="Nuestras sedes"
              subtitulo="Atendemos en dos ciudades. Elige la que te quede más cerca al agendar tu cita."
              sobreFondoOscuro
            />
          </Revelar>

          {estado === ESTADOS.CARGANDO && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {[0, 1].map((clave) => (
                <div key={clave} className="h-[26rem] animate-pulse rounded-2xl bg-white/10" />
              ))}
            </div>
          )}

          {estado === ESTADOS.ERROR && (
            <div className="mt-10 flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-800 ring-1 ring-amber-200">
              <IconoAlerta className="h-5 w-5 shrink-0" />
              <p className="text-sm">
                No pudimos cargar la información de las sedes en este momento. Intenta recargar la página.
              </p>
            </div>
          )}

          {estado === ESTADOS.LISTO && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {sedes.map((sede, posicion) => {
                return (
                  <Revelar key={sede.id} retraso={120 + posicion * 120}>
                    {/* Cristal blanco flotante (mismo tratamiento que las tarjetas
                        de Horarios): blanco al 60% con el backdrop aclarado para
                        que no se agrise sobre el azul, reflejo, borde de luz y
                        sombra. La foto es opaca; el cristal se ve en la franja
                        del nombre. Toda la tarjeta es un enlace a la sede en
                        Google Maps (pestaña nueva). */}
                    <a
                      href={urlVerEnMaps(sede)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Ver ${sede.nombre} en Google Maps (abre en una pestaña nueva)`}
                      className="hover-ilumina-claro block h-full overflow-hidden rounded-2xl bg-white/60 bg-[linear-gradient(to_bottom,rgb(255_255_255/0.45),rgb(255_255_255/0)_45%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.9),inset_0_0_0_1px_rgb(255_255_255/0.55),0_18px_40px_-16px_rgb(0_0_0/0.5)] backdrop-blur-[16px] backdrop-saturate-150 backdrop-brightness-[1.4]">
                      {sede.foto_url ? (
                        <img src={sede.foto_url} alt={sede.nombre} className="h-80 w-full object-cover sm:h-96 lg:h-[clamp(12rem,calc(100svh-28rem),34rem)]" />
                      ) : (
                        <div className="flex h-80 w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 sm:h-96 lg:h-[clamp(12rem,calc(100svh-28rem),34rem)]">
                          <IconoSede className="h-12 w-12 text-brand-blue/40" />
                        </div>
                      )}

                      <div className="flex items-start gap-3 px-5 py-4">
                        <IconoUbicacion className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900">{sede.nombre}</h3>
                          <p className="text-sm text-slate-700">{sede.direccion || sede.ciudad}</p>
                        </div>
                        <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-800">
                          Ver en Google Maps
                          <IconoFlechaDerecha className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </a>
                  </Revelar>
                );
              })}
            </div>
          )}
        </TarjetaSlide>
      </div>
    </section>
  );
}
