// components/landing/HeroGaleria.jsx
// Galeria de fotos reales de la clinica en el Hero. Reemplaza a la
// ilustracion de la veterinaria con la perrita.
//
// - Las fotos son las de la "Galeria" que el administrador configura en
//   Configuracion > Galeria (GET /api/galeria: archivo, descripcion,
//   encuadre y orden). Si no hay ninguna visible o el backend no
//   responde, se usan las de ejemplo que vienen con el sistema
//   (FOTOS_RESPALDO: identidadmarca/galeria -> assets/galeria, max.
//   1400px de ancho), asi el Hero nunca queda vacio.
// - Una foto a la vez, con fundido cruzado; cambia sola cada 3s y tambien
//   al hacer clic sobre ella (el clic reinicia el conteo).
// - Sin borde ni rectangulo: una mascara lleva la foto de opaca a
//   transparente en las orillas, asi se funde con el fondo azul del Hero
//   (ver MASCARA). Todas las fotos se recortan al mismo marco
//   (object-cover); `foco` es el punto de la foto que queda al centro.
// - Desde lg la foto es mas ancha que su columna (130%) y se extiende
//   hacia la derecha, hasta el borde de la pantalla en monitores comunes.
// - Con prefers-reduced-motion no hay fundido (cambia de golpe).
import { useEffect, useState } from 'react';
import { obtenerGaleria } from '../../api/client';
import fotoLaboratorio from '../../assets/galeria/laboratorio.jpg';
import fotoConsulta from '../../assets/galeria/consulta.jpg';
import fotoCirugia from '../../assets/galeria/cirugia.jpg';
import fotoFachada from '../../assets/galeria/fachada.jpg';
import fotoEquipo from '../../assets/galeria/equipo.jpg';

const INTERVALO_MS = 3000;

// Mascara = interseccion de dos degradados (pedido de Oriana: el lado
// derecho con menos desvanecido que el resto):
// - radial, con el centro corrido a la derecha (60%): desvanece arriba,
//   abajo y, largo, hacia la izquierda (donde esta el texto del Hero);
// - lineal horizontal: a la derecha la foto sigue opaca hasta el 86% del
//   ancho y recien ahi se apaga, para que no termine en un borde recto.
const MASCARA = {
  maskImage:
    'radial-gradient(ellipse 78% 50% at 60% 50%, black 55%, transparent 100%), linear-gradient(to right, transparent 0%, black 34%, black 86%, transparent 100%)',
  maskComposite: 'intersect',
  WebkitMaskComposite: 'source-in',
};

const FOTOS_RESPALDO = [
  { src: fotoLaboratorio, alt: 'Docente y estudiantes revisando una muestra en el laboratorio', foco: '45% 40%' },
  { src: fotoConsulta, alt: 'Veterinaria de la UDES examinando a un perro en consulta', foco: '72% 50%' },
  { src: fotoCirugia, alt: 'Equipo de la clínica atendiendo a un gato en el quirófano', foco: '50% 45%' },
  { src: fotoFachada, alt: 'Equipo de la clínica en la entrada de Medicina Veterinaria UDES', foco: '50% 65%' },
  { src: fotoEquipo, alt: 'Estudiantes y docentes de Medicina Veterinaria UDES en el quirófano', foco: '55% 45%' },
];

export function HeroGaleria() {
  // null mientras se consulta la galeria: el marco ya ocupa su lugar y la
  // primera foto aparece con el mismo fundido.
  const [fotos, setFotos] = useState(null);
  const [indice, setIndice] = useState(0);
  // Solo se montan las fotos ya mostradas y la siguiente: las demas no se
  // descargan hasta que les toca.
  const [cargadas, setCargadas] = useState(() => new Set([0, 1]));
  const [reinicio, setReinicio] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerGaleria()
      .then((datos) =>
        datos.fotos.map((foto) => ({
          src: foto.foto_url,
          alt: foto.descripcion,
          foco: `${foto.foco_x}% ${foto.foco_y}%`,
        }))
      )
      .catch(() => [])
      .then((configuradas) => {
        if (vigente) setFotos(configuradas.length > 0 ? configuradas : FOTOS_RESPALDO);
      });
    return () => {
      vigente = false;
    };
  }, []);

  const total = fotos?.length ?? 0;

  // Un solo temporizador, recreado en cada cambio de foto o clic. Con una
  // sola foto no hay nada que rotar.
  useEffect(() => {
    if (total < 2) return undefined;
    const temporizador = setTimeout(() => {
      const destino = (indice + 1) % total;
      setIndice(destino);
      setCargadas((previas) => new Set([...previas, destino, (destino + 1) % total]));
    }, INTERVALO_MS);
    return () => clearTimeout(temporizador);
  }, [indice, reinicio, total]);

  return (
    <button
      type="button"
      onClick={() => {
        if (total < 2) return;
        const destino = (indice + 1) % total;
        setIndice(destino);
        setCargadas((previas) => new Set([...previas, destino, (destino + 1) % total]));
        setReinicio((n) => n + 1);
      }}
      aria-label={
        total === 0
          ? 'Galería de fotos de la clínica'
          : total === 1
            ? fotos[0].alt
            : `Foto ${indice + 1} de ${total}: ${fotos[indice].alt}. Ver la siguiente`
      }
      // hover:[filter:none]: sin el resplandor general de hover, que
      // dibujaria un halo rectangular alrededor de la foto.
      style={MASCARA}
      className="relative mx-auto block aspect-[4/3] w-full max-w-[670px] cursor-pointer rounded-[3rem] outline-none hover:[filter:none] focus-visible:ring-2 focus-visible:ring-white/70 lg:-ml-[6%] lg:-mt-14 lg:w-[130%] lg:max-w-none"
    >
      {(fotos ?? []).map((foto, i) =>
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
