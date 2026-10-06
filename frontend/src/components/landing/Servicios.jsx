// components/landing/Servicios.jsx
// RF-11/RF-16: catalogo real de servicios, obtenido de GET /api/servicios.
// Se muestra como slider fotografico (ServicioSlider.jsx): una foto real
// por servicio (identidadmarca/servicios/, copiadas a
// assets/servicios-foto/), con el nombre y la descripcion de la base de
// datos. El boton "Agendar cita" de cada slide lleva a agendar con ese
// servicio preseleccionado.
import { useEffect, useState } from 'react';
import { obtenerServicios } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { rutaAgendarCita } from '../../utils/rutas';
import { IconoAlerta } from '../icons';
import { Revelar } from './Revelar';
import { SectionHeading } from './SectionHeading';
import { FondoAmbientalServicios } from './FondoAmbientalServicios';
import { ServicioSlider } from './ServicioSlider';
import imgConsulta from '../../assets/servicios-foto/consulta.png';
import imgCirugia from '../../assets/servicios-foto/cirugia.webp';
import imgDesparasitacion from '../../assets/servicios-foto/desparasitacion.jpg';
import imgLaboratorio from '../../assets/servicios-foto/laboratorio.webp';
import imgEndoscopia from '../../assets/servicios-foto/endoscopia.webp';
import imgOncologia from '../../assets/servicios-foto/oncologia.png';
import imgRadiologia from '../../assets/servicios-foto/radiologia.jpg';
import imgProfilaxis from '../../assets/servicios-foto/profilaxis.jpg';
import imgVacunacion from '../../assets/servicios-foto/vacunacion.jpg';

// Por foto: `enfoque` = object-position para que el recorte (vertical en
// movil, horizontal en desktop) no corte al paciente; `oscuridad` = 'alta'
// para las fotos con fondo claro donde el overlay normal no alcanza el
// contraste del texto blanco.
// "Profilaxis dental" se muestra en el landing con el nombre comercial
// "Odontología" — es solo una etiqueta de presentacion publica, el
// nombre real del servicio en la base de datos no cambia.
const CONFIG_POR_SERVICIO = {
  'Consulta médica': {
    imagen: imgConsulta,
    alt: 'Veterinario auscultando a un perro sobre la mesa de consulta mientras una auxiliar lo sostiene',
    enfoque: 'object-[52%_55%]',
    oscuridad: 'alta',
  },
  Cirugía: {
    imagen: imgCirugia,
    alt: 'Cirujano veterinario revisando a un perro blanco con collar isabelino',
    enfoque: 'object-[48%_45%]',
    oscuridad: 'normal',
  },
  Desparasitación: {
    imagen: imgDesparasitacion,
    alt: 'Veterinaria aplicando tratamiento antiparasitario a un perro blanco con manchas',
    enfoque: 'object-[42%_50%]',
    oscuridad: 'alta',
  },
  'Laboratorio clínico': {
    imagen: imgLaboratorio,
    alt: 'Toma de muestra de sangre de la pata de un perro para examen de laboratorio',
    enfoque: 'object-[55%_50%]',
    oscuridad: 'alta',
  },
  Endoscopia: {
    imagen: imgEndoscopia,
    alt: 'Dos veterinarios realizando una endoscopia mientras observan el monitor',
    enfoque: 'object-[40%_40%]',
    oscuridad: 'normal',
  },
  Oncología: {
    imagen: imgOncologia,
    alt: 'Dos veterinarios examinando a un perro pequeño sobre la mesa de tratamiento',
    enfoque: 'object-[55%_65%]',
    oscuridad: 'normal',
  },
  Radiología: {
    imagen: imgRadiologia,
    alt: 'Personal veterinario con chalecos de protección posicionando a un perro en el equipo de rayos X',
    enfoque: 'object-[58%_50%]',
    oscuridad: 'alta',
  },
  'Profilaxis dental': {
    imagen: imgProfilaxis,
    alt: 'Veterinaria revisando los dientes de un perro blanco mientras un colega lo sostiene',
    enfoque: 'object-[45%_35%]',
    oscuridad: 'alta',
    etiquetaPublica: 'Odontología',
  },
  Vacunación: {
    imagen: imgVacunacion,
    alt: 'Veterinaria vacunando a un perro blanco mientras un colega lo sostiene',
    enfoque: 'object-[40%_35%]',
    oscuridad: 'alta',
  },
};

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

  const slides = servicios
    .filter((servicio) => CONFIG_POR_SERVICIO[servicio.nombre])
    .map((servicio) => {
      const config = CONFIG_POR_SERVICIO[servicio.nombre];
      return {
        id: servicio.id,
        titulo: config.etiquetaPublica ?? servicio.nombre,
        descripcion: servicio.descripcion,
        imagen: config.imagen,
        alt: config.alt,
        enfoque: config.enfoque,
        oscuridad: config.oscuridad,
        href: rutaAgendarCita(estaAutenticado, servicio.id),
      };
    });

  return (
    // isolate: el fondo (-z-10) queda detras del contenido pero dentro de
    // la seccion, sin irse detras de la pagina.
    <section id="servicios" className="relative isolate overflow-hidden bg-brand-blue-800 py-20">
      <FondoAmbientalServicios />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Revelar>
          <SectionHeading
            titulo="Servicios veterinarios"
            subtitulo="Contamos con una amplia gama de servicios para el cuidado integral de tu mascota."
            sobreFondoOscuro
          />
        </Revelar>

        {estado === ESTADOS.CARGANDO && (
          <div className="mt-10 aspect-[4/5] w-full animate-pulse rounded-2xl bg-white/10 sm:aspect-[16/10] lg:aspect-[2/1] lg:rounded-3xl" />
        )}

        {estado === ESTADOS.ERROR && (
          <div className="mt-10 flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-800 ring-1 ring-amber-200">
            <IconoAlerta className="h-5 w-5 shrink-0" />
            <p className="text-sm">No pudimos cargar los servicios en este momento.</p>
          </div>
        )}

        {estado === ESTADOS.LISTO && slides.length > 0 && (
          <Revelar retraso={120} className="mt-10">
            <ServicioSlider slides={slides} />
          </Revelar>
        )}
      </div>
    </section>
  );
}
