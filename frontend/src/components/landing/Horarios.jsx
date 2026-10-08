// components/landing/Horarios.jsx
// RF-03/RF-13: horario de atencion detallado por sede (dia por dia), con
// el mismo dato real que RF-13 configura (horario_atencion).
//
// Rediseño (referencia de Oriana): cada sede es una tarjeta con
// - la foto de la sede arriba (sede.foto_url, la misma del admin y de la
//   seccion Sedes), fundida hacia el color de la sede, con un circulo con
//   el icono de sede y el nombre y la ciudad en grande sobre la foto;
// - un dia por fila, en un bloque centrado dentro de la tarjeta: abreviatura
//   en una pildora del color de la sede y la hora pegada a su lado; los dias
//   sin atencion llevan "Cerrado" en rojo;
// - al final, "Agendar cita" como un boton de vidrio que se llena de ambar, de
//   izquierda a derecha, al pasar el cursor; lleva a agendar con esa sede
//   ya elegida (/agendar?sedeId=...).
// De fondo, motivos muy tenues (linea punteada, reloj).
//
// El color se asigna por orden (la primera azul, la segunda ambar, y se
// repite), no por nombre de ciudad: el sistema soporta sedes nuevas
// (RF-13 ampliado). Hoy eso deja Bucaramanga azul y Valledupar ambar.
//
// En computador la seccion ocupa una pantalla (landing paginado): en
// pantallas bajas la foto se achica y los dias pasan a dos columnas para
// que la tarjeta entre completa.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerSedes, obtenerHorarios } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { rutaAgendarCita } from '../../utils/rutas';
import { detalleHorarioPorDia } from '../../utils/horarioTexto';
import { IconoAlerta, IconoCalendario, IconoReloj, IconoSede, IconoUbicacion } from '../icons';
import { SectionHeading } from './SectionHeading';
import { HalosAmbientales } from './HalosAmbientales';
import { TarjetaSlide } from './TarjetaSlide';

const ESTADOS = { CARGANDO: 'cargando', LISTO: 'listo', ERROR: 'error' };
const ABREVIATURA = { Lunes: 'Lun', Martes: 'Mar', Miércoles: 'Mié', Jueves: 'Jue', Viernes: 'Vie', Sábado: 'Sáb', Domingo: 'Dom' };

// Acento de cada sede. Los tonos de texto y de fondo estan elegidos para
// cumplir contraste AA: texto oscuro sobre la pildora clara, y blanco sobre
// el degradado oscuro que cubre la foto.
const ACENTOS = [
  {
    // Azul de marca
    foto: 'from-brand-blue-800 via-brand-blue-800/75',
    sinFoto: 'bg-[linear-gradient(135deg,var(--color-brand-blue-600),var(--color-brand-blue-800))]',
    circulo: 'bg-brand-blue-600 text-white',
    dia: 'bg-blue-100 text-brand-blue-800',
  },
  {
    // Ambar de marca
    foto: 'from-amber-900 via-amber-900/75',
    sinFoto: 'bg-[linear-gradient(135deg,var(--color-brand-amber-600),var(--color-amber-900))]',
    circulo: 'bg-brand-amber text-slate-900',
    dia: 'bg-amber-100 text-amber-900',
  },
];

function nombreCorto(sede) {
  return sede.nombre.replace(/^Cl[ií]nica Veterinaria UDES\s*/i, '') || sede.ciudad;
}

function TarjetaSede({ sede, horario, acento }) {
  const { estaAutenticado } = useAuth();
  const dias = detalleHorarioPorDia(horario || []);
  const nombre = nombreCorto(sede);

  return (
    <article className="cristal flex flex-col overflow-hidden rounded-tarjeta">
      {/* Foto + degradado hacia el color de la sede + nombre encima. */}
      <div className={`relative h-36 shrink-0 lg:h-[clamp(5.5rem,calc(100svh-41rem),15rem)] ${sede.foto_url ? 'bg-slate-800' : acento.sinFoto}`}>
        {sede.foto_url && <img src={sede.foto_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
        <div aria-hidden="true" className={`absolute inset-0 bg-gradient-to-t to-transparent ${acento.foto}`} />
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-md ring-2 ring-white/70 ${acento.circulo}`}>
            <IconoSede className="h-6 w-6" peso="duotone" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold leading-tight text-white">Sede {nombre}</h3>
            <p className="flex items-center gap-1 truncate text-sm font-medium text-white">
              <IconoUbicacion className="h-4 w-4 shrink-0" />
              {sede.direccion ? `${sede.direccion}, ${sede.ciudad}` : sede.ciudad}
            </p>
          </div>
        </div>
      </div>

      {/* Un dia por fila; en pantallas bajas, dos columnas que se leen hacia
          abajo (lunes a jueves, viernes a domingo). */}
      <ul className="mx-auto grid w-fit flex-1 content-center gap-x-10 gap-y-2 px-5 py-4 text-base lg:[@media(max-height:860px)]:grid-flow-col lg:[@media(max-height:860px)]:grid-cols-2 lg:[@media(max-height:860px)]:grid-rows-4">
        {dias.map((d) => {
          const cerrado = d.texto === 'Cerrado';
          return (
            <li key={d.dia} className="flex items-center gap-4">
              <span className={`inline-flex w-14 justify-center rounded-full py-0.5 text-sm font-semibold ${acento.dia}`}>
                <abbr title={d.dia} className="no-underline">
                  {ABREVIATURA[d.dia] ?? d.dia}
                </abbr>
              </span>
              {cerrado ? (
                <span className="rounded-full bg-red-100 px-3 py-0.5 text-sm font-semibold text-red-800">Cerrado</span>
              ) : (
                <span className="font-semibold tabular-nums text-slate-800">{d.texto}</span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Accion: boton de vidrio flotante que se llena de "agua" ambar. En
          reposo es una capsula de vidrio transparente (se ve la tarjeta a
          traves de ella; solo la delatan el borde de luz y los reflejos); al pasar el cursor (o enfocarlo con el teclado) el liquido
          ambar entra por la izquierda y lo llena, con el frente curvo y un
          brillo arriba, y el resplandor crece. El texto es negro siempre
          (AA sobre el vidrio y sobre el ambar). Lleva a agendar con esta
          sede elegida. El liquido es mas ancho que el boton: el frente
          curvo sale por la derecha y queda recortado, asi termina lleno. */}
      <Link
        to={rutaAgendarCita(estaAutenticado, null, sede.id)}
        aria-label={`Agendar cita en la sede ${nombre}`}
        style={{ '--brillo': 'color-mix(in oklab, var(--color-brand-amber) 80%, transparent)' }}
        className="group relative mx-5 mb-5 flex items-center justify-center gap-2 overflow-hidden rounded-boton bg-[linear-gradient(to_bottom,rgb(255_255_255/0.28),rgb(255_255_255/0.04)_55%,rgb(255_255_255/0.14))] px-5 py-2.5 text-base font-bold text-slate-900 shadow-[inset_0_2px_1px_rgb(255_255_255/0.95),inset_0_-3px_6px_rgb(15_23_42/0.12),inset_0_0_0_1.5px_rgb(255_255_255/0.85),0_10px_24px_-12px_rgb(6_51_138/0.55)] outline-none backdrop-blur-[2px] transition-shadow duration-500 hover:shadow-[inset_0_2px_1px_rgb(255_255_255/0.95),inset_0_-3px_6px_rgb(15_23_42/0.12),inset_0_0_0_1.5px_rgb(255_255_255/0.85),0_12px_34px_-6px_rgb(247_167_28/0.95)] focus-visible:ring-2 focus-visible:ring-brand-amber-600"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[calc(100%+3rem)] -translate-x-full rounded-r-full bg-[linear-gradient(to_bottom,var(--color-brand-amber-400),var(--color-brand-amber))] transition-transform duration-700 ease-out group-hover:translate-x-0 group-focus-visible:translate-x-0 motion-reduce:transition-none"
        >
          {/* Reflejo del liquido. */}
          <span className="absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(to_bottom,rgb(255_255_255/0.45),rgb(255_255_255/0))]" />
        </span>
        <IconoCalendario className="relative h-5 w-5" peso="bold" />
        <span className="relative">Agendar cita</span>
      </Link>
    </article>
  );
}

// Motivos de fondo, muy tenues y estaticos (no compiten con los halos
// animados): linea punteada curva y reloj. Solo desde md. (Las huellas van
// en todo el fondo del landing: HuellasFondo.)
function Decoracion() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden text-white md:block">
      <IconoReloj className="absolute -right-10 top-24 h-64 w-64 rotate-12 opacity-[0.05]" />
      <svg viewBox="0 0 600 200" fill="none" className="absolute bottom-6 left-1/4 h-40 w-[36rem] opacity-[0.14]">
        <path d="M4 150C120 20 260 190 380 90s170-70 216-30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 12" />
      </svg>
    </div>
  );
}

export function Horarios() {
  const [estado, setEstado] = useState(ESTADOS.CARGANDO);
  const [sedes, setSedes] = useState([]);
  const [horariosPorSede, setHorariosPorSede] = useState({});

  useEffect(() => {
    obtenerSedes()
      .then(async (datos) => {
        setSedes(datos.sedes);
        const entradas = await Promise.all(
          datos.sedes.map((sede) => obtenerHorarios(sede.id).then((h) => [sede.id, h.horario]))
        );
        setHorariosPorSede(Object.fromEntries(entradas));
        setEstado(ESTADOS.LISTO);
      })
      .catch(() => setEstado(ESTADOS.ERROR));
  }, []);

  return (
    // Sin fondo propio: va sobre el degradado continuo del landing.
    <section id="horarios" data-slide className="relative py-20 lg:flex lg:min-h-svh lg:snap-start lg:snap-always lg:flex-col lg:pb-0 lg:pt-28">
      <HalosAmbientales variante="horarios" />
      <Decoracion />
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:flex lg:flex-1 lg:flex-col">
        <TarjetaSlide>
          <SectionHeading
            titulo="Horarios de atención"
            subtitulo="Conoce nuestros horarios en cada sede y agenda tu cita fácilmente."
            sobreFondoOscuro
          />

          <div className="mx-auto mt-8 w-full max-w-5xl lg:mt-6">
            {estado === ESTADOS.CARGANDO && (
              <div className="grid gap-6 md:grid-cols-2">
                {[0, 1].map((clave) => (
                  <div key={clave} className="h-80 animate-pulse rounded-tarjeta bg-white/10" />
                ))}
              </div>
            )}

            {estado === ESTADOS.ERROR && (
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-800 ring-1 ring-amber-200">
                <IconoAlerta className="h-5 w-5 shrink-0" />
                <p className="text-sm">No pudimos cargar los horarios en este momento.</p>
              </div>
            )}

            {estado === ESTADOS.LISTO && (
              // En celular y tableta chica las tarjetas se apilan.
              <div className="grid gap-6 md:grid-cols-2">
                {sedes.map((sede, indice) => (
                  <TarjetaSede key={sede.id} sede={sede} horario={horariosPorSede[sede.id]} acento={ACENTOS[indice % ACENTOS.length]} />
                ))}
              </div>
            )}
          </div>
        </TarjetaSlide>
      </div>
    </section>
  );
}
