// components/landing/HeroGaleria.jsx
// Galeria de fotos reales de la clinica en el Hero (identidadmarca/galeria
// -> assets/galeria, redimensionadas a max. 1400px de ancho). Reemplaza a
// la ilustracion de la veterinaria con la perrita.
//
// - Una foto a la vez, con fundido cruzado; cambia sola cada 3s y tambien
//   al hacer clic sobre ella (el clic reinicia el conteo).
// - Sin borde ni rectangulo: una mascara radial lleva la foto de opaca en
//   el centro a transparente en las orillas, asi se funde con el fondo
//   azul del Hero. Todas las fotos se recortan al mismo marco
//   (object-cover); `foco` es el punto de la foto que queda al centro,
//   donde la mascara la deja ver mejor.
// - Con prefers-reduced-motion no hay fundido (cambia de golpe).
import { useEffect, useState } from 'react';
import fotoLaboratorio from '../../assets/galeria/laboratorio.jpg';
import fotoConsulta from '../../assets/galeria/consulta.jpg';
import fotoCirugia from '../../assets/galeria/cirugia.jpg';
import fotoFachada from '../../assets/galeria/fachada.jpg';
import fotoEquipo from '../../assets/galeria/equipo.jpg';

const INTERVALO_MS = 3000;

const FOTOS = [
  { src: fotoLaboratorio, alt: 'Docente y estudiantes revisando una muestra en el laboratorio', foco: '45% 40%' },
  { src: fotoConsulta, alt: 'Veterinaria de la UDES examinando a un perro en consulta', foco: '72% 50%' },
  { src: fotoCirugia, alt: 'Equipo de la clínica atendiendo a un gato en el quirófano', foco: '50% 45%' },
  { src: fotoFachada, alt: 'Equipo de la clínica en la entrada de Medicina Veterinaria UDES', foco: '50% 65%' },
  { src: fotoEquipo, alt: 'Estudiantes y docentes de Medicina Veterinaria UDES en el quirófano', foco: '55% 45%' },
];

export function HeroGaleria() {
  const [indice, setIndice] = useState(0);
  // Solo se montan las fotos ya mostradas y la siguiente: las demas no se
  // descargan hasta que les toca.
  const [cargadas, setCargadas] = useState(() => new Set([0, 1]));
  const [reinicio, setReinicio] = useState(0);

  function irA(nuevo) {
    const destino = (nuevo + FOTOS.length) % FOTOS.length;
    setIndice(destino);
    setCargadas((previas) => new Set([...previas, destino, (destino + 1) % FOTOS.length]));
  }

  // Un solo temporizador, recreado en cada cambio de foto o clic.
  useEffect(() => {
    const temporizador = setTimeout(() => irA(indice + 1), INTERVALO_MS);
    return () => clearTimeout(temporizador);
  }, [indice, reinicio]);

  return (
    <button
      type="button"
      onClick={() => {
        irA(indice + 1);
        setReinicio((n) => n + 1);
      }}
      aria-label={`Foto ${indice + 1} de ${FOTOS.length}: ${FOTOS[indice].alt}. Ver la siguiente`}
      // hover:[filter:none]: sin el resplandor general de hover, que
      // dibujaria un halo rectangular alrededor de la foto.
      className="relative mx-auto block aspect-[4/3] w-full max-w-[670px] cursor-pointer rounded-[3rem] outline-none [mask-image:radial-gradient(closest-side,black_45%,transparent_100%)] hover:[filter:none] focus-visible:ring-2 focus-visible:ring-white/70 lg:max-w-[770px]"
    >
      {FOTOS.map((foto, i) =>
        cargadas.has(i) ? (
          <img
            key={foto.src}
            src={foto.src}
            alt=""
            draggable={false}
            style={{ objectPosition: foto.foco }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
              i === indice ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : null
      )}
    </button>
  );
}
