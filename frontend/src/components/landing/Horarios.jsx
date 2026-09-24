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
import { detalleHorarioPorDia } from '../../utils/horarioTexto';
import horariosMascotas from '../../assets/horarios-mascotas.png';

const ESTADOS = { CARGANDO: 'cargando', LISTO: 'listo', ERROR: 'error' };
const TINTES = [
  { tarjeta: 'bg-[#E8F1FD]', icono: 'text-brand-blue' },
  { tarjeta: 'bg-[#FEFAF1]', icono: 'text-amber-500' },
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
    <section id="horarios" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading titulo="Horarios de atención" subtitulo="Conoce nuestros horarios en cada sede." />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          {estado === ESTADOS.CARGANDO && (
            <div className="grid gap-6 sm:grid-cols-2">
              {[0, 1].map((clave) => (
                <div key={clave} className="h-56 animate-pulse rounded-2xl bg-slate-100" />
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
                  <div key={sede.id} className={`rounded-2xl p-6 ${tinte.tarjeta}`}>
                    <div className="flex items-center gap-2">
                      <IconoReloj className={`h-5 w-5 shrink-0 ${tinte.icono}`} />
                      <h3 className="font-semibold text-slate-900">Sede {sede.nombre.replace(/^Cl[ií]nica Veterinaria UDES\s*/i, '') || sede.ciudad}</h3>
                    </div>
                    <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                      {dias.map((d) => (
                        <li key={d.dia} className="flex justify-between gap-4">
                          <span>{d.dia}</span>
                          <span className={d.texto === 'Cerrado' ? 'text-slate-400' : 'font-medium text-slate-700'}>{d.texto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          <img
            src={horariosMascotas}
            alt=""
            className="mx-auto hidden w-full max-w-sm object-contain lg:block"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
