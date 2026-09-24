// components/landing/Servicios.jsx
// RF-11/RF-16: catalogo real de servicios, obtenido de GET /api/servicios.
// Los iconos son los renders 3D de identidad de marca (identidadmarca/),
// no los iconos de linea genericos del resto de la app. La cuadricula
// destacada muestra 8 servicios (todos menos Vacunación, que queda
// para el modulo de gestion de servicios del admin, ver decision de
// alcance) en el orden del mockup; "Ver todos los servicios" expande
// para mostrar el resto del catalogo real (incluida Vacunación, y
// cualquier servicio nuevo que agregue el admin).
import { useEffect, useState } from 'react';
import { obtenerServicios } from '../../api/client';
import { IconoAlerta, IconoEstetoscopio, IconoFlechaDerecha } from '../icons';
import { SectionHeading } from './SectionHeading';
import iconoConsulta from '../../assets/servicios/consulta.png';
import iconoCirugia from '../../assets/servicios/cirugia.png';
import iconoDesparasitacion from '../../assets/servicios/desparasitacion.png';
import iconoLaboratorio from '../../assets/servicios/laboratorio.png';
import iconoEndoscopia from '../../assets/servicios/endoscopia.png';
import iconoOncologia from '../../assets/servicios/oncologia.png';
import iconoRadiologia from '../../assets/servicios/radiologia.png';
import iconoProfilaxis from '../../assets/servicios/profilaxis.png';
import iconoVacunacion from '../../assets/servicios/vacunacion.png';

// El archivo se llama "radiologia"/"profilaxis" pero en el landing se
// muestran con el nombre comercial "Imagenología"/"Odontología" (ver
// prompt de diseno) — es solo una etiqueta de presentacion publica, el
// nombre real del servicio en la base de datos no cambia.
const ICONO_POR_SERVICIO = {
  'Consulta médica': iconoConsulta,
  Cirugía: iconoCirugia,
  Desparasitación: iconoDesparasitacion,
  'Laboratorio clínico': iconoLaboratorio,
  Endoscopia: iconoEndoscopia,
  Oncología: iconoOncologia,
  Radiología: iconoRadiologia,
  'Profilaxis dental': iconoProfilaxis,
  Vacunación: iconoVacunacion,
};

const ETIQUETA_PUBLICA = {
  Radiología: 'Imagenología',
  'Profilaxis dental': 'Odontología',
};

const CHIPS_PASTEL = ['bg-[#C7E4FC]', 'bg-[#FEECC2]'];

const ORDEN_DESTACADO = [
  'Consulta médica',
  'Cirugía',
  'Desparasitación',
  'Laboratorio clínico',
  'Endoscopia',
  'Oncología',
  'Radiología',
  'Profilaxis dental',
];

const ESTADOS = { CARGANDO: 'cargando', LISTO: 'listo', ERROR: 'error' };

export function Servicios() {
  const [estado, setEstado] = useState(ESTADOS.CARGANDO);
  const [servicios, setServicios] = useState([]);
  const [verTodos, setVerTodos] = useState(false);

  useEffect(() => {
    obtenerServicios()
      .then((datos) => {
        setServicios(datos.servicios);
        setEstado(ESTADOS.LISTO);
      })
      .catch(() => setEstado(ESTADOS.ERROR));
  }, []);

  const destacados = ORDEN_DESTACADO.map((nombre) => servicios.find((s) => s.nombre === nombre)).filter(Boolean);
  const resto = servicios.filter((s) => !ORDEN_DESTACADO.includes(s.nombre));
  const visibles = verTodos ? [...destacados, ...resto] : destacados;
  const hayMasParaMostrar = resto.length > 0;

  return (
    <section id="servicios" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          titulo="Servicios veterinarios"
          subtitulo="Contamos con una amplia gama de servicios para el cuidado integral de tu mascota."
          accion={
            hayMasParaMostrar && (
              <button
                type="button"
                onClick={() => setVerTodos((v) => !v)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-blue px-4 py-2 text-sm font-semibold text-brand-blue transition hover:bg-blue-50"
              >
                {verTodos ? 'Ver menos' : 'Ver todos los servicios'}
                <IconoFlechaDerecha className={`h-4 w-4 transition-transform ${verTodos ? '-rotate-90' : ''}`} />
              </button>
            )
          }
        />

        {estado === ESTADOS.CARGANDO && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, indice) => (
              <div key={indice} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
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
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibles.map(({ id, nombre, descripcion }, indice) => {
              const iconoImagen = ICONO_POR_SERVICIO[nombre];
              return (
                <div
                  key={id}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
                >
                  <div className={`flex h-16 w-16 items-center justify-center rounded-xl p-2 ${CHIPS_PASTEL[indice % 2]}`}>
                    {iconoImagen ? (
                      <img src={iconoImagen} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <IconoEstetoscopio className="h-8 w-8 text-brand-blue" />
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{ETIQUETA_PUBLICA[nombre] ?? nombre}</h3>
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
