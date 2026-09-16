// components/landing/Servicios.jsx
// RF-11/RF-16: catalogo real de servicios, obtenido de GET /api/servicios
// (sembrado a partir de las publicaciones oficiales de la clinica).
import { useEffect, useState } from 'react';
import { obtenerServicios } from '../../api/client';
import { AccentBar } from '../AccentBar';
import { IconoAlerta } from '../icons';
import {
  IconoEstetoscopio,
  IconoJeringa,
  IconoDesparasitacion,
  IconoDienteDental,
  IconoLaboratorio,
  IconoRadiografia,
  IconoCirugia,
  IconoCintaOncologia,
  IconoEndoscopia,
} from '../icons';

const ICONO_POR_SERVICIO = {
  'Consulta médica': IconoEstetoscopio,
  Vacunación: IconoJeringa,
  Desparasitación: IconoDesparasitacion,
  'Profilaxis dental': IconoDienteDental,
  'Laboratorio clínico': IconoLaboratorio,
  Radiología: IconoRadiografia,
  Cirugía: IconoCirugia,
  Oncología: IconoCintaOncologia,
  Endoscopia: IconoEndoscopia,
};

const ESTADOS = { CARGANDO: 'cargando', LISTO: 'listo', ERROR: 'error' };

export function Servicios() {
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

  return (
    <section id="servicios" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Servicios veterinarios
        </h2>
        <AccentBar />
        <p className="mt-4 max-w-[60ch] text-slate-600">
          Atención integral para tu mascota en nuestras dos sedes.
        </p>

        {estado === ESTADOS.CARGANDO && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, indice) => (
              <div key={indice} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        )}

        {estado === ESTADOS.ERROR && (
          <div className="mt-10 flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-800 ring-1 ring-amber-200">
            <IconoAlerta className="h-5 w-5 shrink-0" />
            <p className="text-sm">No pudimos cargar los servicios en este momento.</p>
          </div>
        )}

        {estado === ESTADOS.LISTO && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {servicios.map(({ id, nombre, descripcion }, indice) => {
              const Icono = ICONO_POR_SERVICIO[nombre] ?? IconoEstetoscopio;
              const destacado = indice === 0;
              return (
                <div
                  key={id}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      destacado ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    <Icono className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{nombre}</h3>
                  {descripcion && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{descripcion}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
