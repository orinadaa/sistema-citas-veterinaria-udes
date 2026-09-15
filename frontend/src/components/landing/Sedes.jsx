// components/landing/Sedes.jsx
// RF-03: informacion publica de sedes, obtenida del endpoint real
// GET /api/sedes (sin autenticacion).
import { useEffect, useState } from 'react';
import { obtenerSedes } from '../../api/client';
import { IconoUbicacion, IconoReloj, IconoAlerta } from '../icons';

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
    <section id="sedes" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Nuestras sedes</h2>
        <p className="mt-3 max-w-[60ch] text-slate-600">
          Atendemos en dos ciudades. Elige la que te quede más cerca al agendar tu cita.
        </p>
        <span id="horarios" className="relative -top-20 block" aria-hidden="true" />

        {estado === ESTADOS.CARGANDO && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[0, 1].map((clave) => (
              <div key={clave} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
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
            {sedes.map((sede) => (
              <div key={sede.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start gap-3">
                  <IconoUbicacion className="mt-0.5 h-6 w-6 shrink-0 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{sede.nombre}</h3>
                    <p className="text-sm text-slate-500">{sede.ciudad}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-start gap-3 border-t border-slate-100 pt-5">
                  <IconoReloj className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <div className="text-sm text-slate-600">
                    <p>Lunes a viernes: 8:00 a.m. – 5:00 p.m.</p>
                    <p>Sábados: 8:00 a.m. – 12:00 m.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
