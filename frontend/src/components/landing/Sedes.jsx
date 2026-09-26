// components/landing/Sedes.jsx
// RF-03: informacion publica de sedes, obtenida del endpoint real
// GET /api/sedes. La foto de cada sede es la que el admin configuro
// (sede.foto_url, ver panel de Sedes) — no existe un banco de fotos
// reales de los edificios en identidad de marca, asi que se usa un
// placeholder con el icono de ubicacion mientras el admin no cargue una.
import { useEffect, useState } from 'react';
import { obtenerSedes, obtenerHorarios } from '../../api/client';
import { IconoUbicacion, IconoReloj, IconoAlerta, IconoSede } from '../icons';
import { SectionHeading } from './SectionHeading';
import { agruparHorario } from '../../utils/horarioTexto';

const ESTADOS = { CARGANDO: 'cargando', LISTO: 'listo', ERROR: 'error' };

export function Sedes() {
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
    <section id="sedes" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          titulo="Nuestras sedes"
          subtitulo="Atendemos en dos ciudades. Elige la que te quede más cerca al agendar tu cita."
        />

        {estado === ESTADOS.CARGANDO && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[0, 1].map((clave) => (
              <div key={clave} className="h-[26rem] animate-pulse rounded-2xl bg-slate-100" />
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
            {sedes.map((sede) => {
              const lineas = agruparHorario(horariosPorSede[sede.id] || []).slice(0, 3);
              return (
                <div key={sede.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                  {sede.foto_url ? (
                    <img src={sede.foto_url} alt={sede.nombre} className="h-72 w-full object-cover sm:h-80" />
                  ) : (
                    <div className="flex h-72 w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 sm:h-80">
                      <IconoSede className="h-12 w-12 text-brand-blue/40" />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start gap-3">
                      <IconoUbicacion className="mt-0.5 h-6 w-6 shrink-0 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{sede.nombre}</h3>
                        <p className="text-sm text-slate-500">{sede.direccion || sede.ciudad}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-start gap-3 border-t border-slate-100 pt-5">
                      <IconoReloj className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                      <div className="text-sm text-slate-600">
                        {lineas.length > 0 ? lineas.map((linea) => <p key={linea}>{linea}</p>) : <p>Horario no configurado.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
