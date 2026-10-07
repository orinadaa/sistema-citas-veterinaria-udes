// components/landing/Horarios.jsx
// RF-03/RF-13: horario de atencion detallado por sede (dia por dia),
// con el mismo dato real que RF-13 configura (horario_atencion). Los
// colores de las tarjetas se alternan por indice (no por nombre de
// ciudad fijo): el mockup usa Bucaramanga=azul/Valledupar=ambar, pero
// el sistema soporta sedes nuevas (RF-13 ampliado), asi que el color
// se asigna por orden, no por nombre.
import { useEffect, useState } from 'react';
import { obtenerSedes, obtenerHorarios } from '../../api/client';
import { IconoReloj, IconoAlerta } from '../icons';
import { SectionHeading } from './SectionHeading';
import { HalosAmbientales } from './HalosAmbientales';
import { TarjetaSlide } from './TarjetaSlide';
import { detalleHorarioPorDia } from '../../utils/horarioTexto';

const ESTADOS = { CARGANDO: 'cargando', LISTO: 'listo', ERROR: 'error' };
// Cristal de vetUI (styles/vetui.css) en sus dos tintes: celeste y crema.
const TINTES = [
  { tarjeta: 'cristal-celeste', icono: 'text-brand-blue' },
  { tarjeta: 'cristal-crema', icono: 'text-amber-600' },
];

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
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:flex lg:flex-1 lg:flex-col">
        <TarjetaSlide>
          <SectionHeading titulo="Horarios de atención" subtitulo="Conoce nuestros horarios en cada sede." sobreFondoOscuro />

          {/* Solo las tarjetas de cada sede, centradas bajo el encabezado
              (sin ilustracion al lado). max-w-4xl: con dos sedes no se
              estiran a todo el ancho de la tarjeta. */}
          <div className="mx-auto mt-10 w-full max-w-4xl">
            {estado === ESTADOS.CARGANDO && (
              <div className="grid gap-6 sm:grid-cols-2">
                {[0, 1].map((clave) => (
                  <div key={clave} className="h-56 animate-pulse rounded-2xl bg-white/10" />
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
              <div className="grid gap-6 sm:grid-cols-2">
                {sedes.map((sede, indice) => {
                  const tinte = TINTES[indice % TINTES.length];
                  const dias = detalleHorarioPorDia(horariosPorSede[sede.id] || []);
                  return (
                    <div key={sede.id} className={`cristal rounded-tarjeta p-6 ${tinte.tarjeta}`}>
                      <div className="flex items-center gap-2">
                        <IconoReloj className={`h-5 w-5 shrink-0 ${tinte.icono}`} />
                        <h3 className="font-semibold text-slate-900">Sede {sede.nombre.replace(/^Cl[ií]nica Veterinaria UDES\s*/i, '') || sede.ciudad}</h3>
                      </div>
                      <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
                        {dias.map((d) => (
                          <li key={d.dia} className="flex justify-between gap-4">
                            <span>{d.dia}</span>
                            <span className={d.texto === 'Cerrado' ? 'text-slate-700' : 'font-medium text-slate-800'}>{d.texto}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TarjetaSlide>
      </div>
    </section>
  );
}
