// components/landing/Servicios.jsx
// RF-11/RF-16: catalogo real de servicios, obtenido de GET /api/servicios.
// Tarjetas con foto (identidadmarca/card{servicio}.png, ver ServiceCard.jsx),
// una por cada uno de los 9 servicios sembrados. El boton de cada
// tarjeta lleva a agendar cita con ese servicio preseleccionado.
import { useEffect, useState } from 'react';
import { obtenerServicios } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { rutaAgendarCita } from '../../utils/rutas';
import { IconoAlerta } from '../icons';
import { SectionHeading } from './SectionHeading';
import { ServiceCard } from './ServiceCard';
import imgConsulta from '../../assets/servicios-card/consulta.png';
import imgCirugia from '../../assets/servicios-card/cirugia.png';
import imgDesparasitacion from '../../assets/servicios-card/desparasitacion.png';
import imgLaboratorio from '../../assets/servicios-card/laboratorio.png';
import imgEndoscopia from '../../assets/servicios-card/endoscopia.png';
import imgOncologia from '../../assets/servicios-card/oncologia.png';
import imgRadiografia from '../../assets/servicios-card/radiografia.png';
import imgProfilaxis from '../../assets/servicios-card/profilaxis.png';
import imgVacunacion from '../../assets/servicios-card/vacunacion.png';

// El archivo se llama "radiografia"/"profilaxis" pero en el landing se
// muestran con el nombre comercial "Imagenología"/"Odontología" — es
// solo una etiqueta de presentacion publica, el nombre real del
// servicio en la base de datos no cambia.
const CONFIG_POR_SERVICIO = {
  'Consulta médica': { imagen: imgConsulta, color: 'blue' },
  Cirugía: { imagen: imgCirugia, color: 'amber' },
  Desparasitación: { imagen: imgDesparasitacion, color: 'blue' },
  'Laboratorio clínico': { imagen: imgLaboratorio, color: 'amber' },
  Endoscopia: { imagen: imgEndoscopia, color: 'amber' },
  Oncología: { imagen: imgOncologia, color: 'blue' },
  Radiología: { imagen: imgRadiografia, color: 'amber', etiquetaPublica: 'Imagenología' },
  'Profilaxis dental': { imagen: imgProfilaxis, color: 'blue', etiquetaPublica: 'Odontología' },
  Vacunación: { imagen: imgVacunacion, color: 'blue' },
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

  return (
    <section id="servicios" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          titulo="Servicios veterinarios"
          subtitulo="Contamos con una amplia gama de servicios para el cuidado integral de tu mascota."
        />

        {estado === ESTADOS.CARGANDO && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, indice) => (
              <div key={indice} className="aspect-square animate-pulse rounded-2xl bg-slate-100" />
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
            {servicios.map((servicio) => {
              const config = CONFIG_POR_SERVICIO[servicio.nombre];
              if (!config) return null;
              return (
                <ServiceCard
                  key={servicio.id}
                  image={config.imagen}
                  title={config.etiquetaPublica ?? servicio.nombre}
                  description={servicio.descripcion}
                  accentColor={config.color}
                  href={rutaAgendarCita(estaAutenticado, servicio.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
