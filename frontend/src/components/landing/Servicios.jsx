// components/landing/Servicios.jsx
// Contenido de servicios: estatico por ahora. RF-11 (configuracion de
// servicios por parte del administrativo) es un modulo posterior
// (incremento 3); cuando exista, esta seccion debe leerlo de la API
// en vez de esta lista fija.
import {
  IconoJeringa,
  IconoCirugia,
  IconoLaboratorio,
  IconoEstetica,
  IconoHospitalizacion,
  IconoPata,
} from '../icons';
import { AccentBar } from '../AccentBar';

const SERVICIOS = [
  { icono: IconoPata, titulo: 'Consulta general', descripcion: 'Valoración y diagnóstico veterinario integral.', destacado: true },
  { icono: IconoJeringa, titulo: 'Vacunación', descripcion: 'Esquemas de vacunación para perros y gatos.' },
  { icono: IconoCirugia, titulo: 'Cirugía', descripcion: 'Procedimientos quirúrgicos con seguimiento post-operatorio.' },
  { icono: IconoLaboratorio, titulo: 'Laboratorio clínico', descripcion: 'Exámenes de sangre, orina y otras pruebas.' },
  { icono: IconoEstetica, titulo: 'Estética y baño', descripcion: 'Corte, baño y cuidado de la piel y el pelaje.' },
  { icono: IconoHospitalizacion, titulo: 'Hospitalización', descripcion: 'Cuidado y observación para casos que lo requieran.' },
];

export function Servicios() {
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

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICIOS.map(({ icono: Icono, titulo, descripcion, destacado }) => (
            <div
              key={titulo}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  destacado ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <Icono className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{titulo}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
