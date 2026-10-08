// utils/razas.js
// RESPALDO: desde el incremento 8b las especies y razas viven en la base de
// datos y las gestiona el superadministrador (Catalogos). Esta lista es la
// semilla de esas tablas y lo que se muestra si el servidor no responde
// (ver hooks/useCatalogoEspecies.js). Lo que sigue describe el origen:
// Catalogo de especies y razas para el perfil de mascota (decision de
// la usuaria: especie y raza obligatorias, raza como lista desplegable
// que depende de la especie). Es un catalogo estatico del frontend, no
// una tabla: se guarda el mismo texto de siempre en mascota.especie /
// mascota.raza, asi las mascotas ya registradas no se rompen.
// Cada lista incluye "Criollo / mestizo" y "No sé la raza". "Otro"
// (conejo, hamster...) no tiene lista: se escribe a mano.

export const RAZA_CRIOLLA = 'Criollo / mestizo';
export const RAZA_DESCONOCIDA = 'No sé la raza';

export const ESPECIES = ['Canino', 'Felino', 'Ave', 'Otro'];

const ordenar = (lista) => [...lista].sort((a, b) => a.localeCompare(b, 'es'));

export const RAZAS_POR_ESPECIE = {
  Canino: [
    RAZA_CRIOLLA,
    RAZA_DESCONOCIDA,
    ...ordenar([
      'Akita',
      'American bully',
      'Basset hound',
      'Beagle',
      'Bichón frisé',
      'Border collie',
      'Bóxer',
      'Bull terrier',
      'Bulldog francés',
      'Bulldog inglés',
      'Cane corso',
      'Caniche (poodle)',
      'Chihuahua',
      'Chow chow',
      'Cocker spaniel',
      'Corgi',
      'Dachshund (salchicha)',
      'Dálmata',
      'Doberman',
      'Golden retriever',
      'Gran danés',
      'Husky siberiano',
      'Jack Russell terrier',
      'Labrador retriever',
      'Maltés',
      'Mastín',
      'Pastor alemán',
      'Pastor belga',
      'Pinscher miniatura',
      'Pitbull',
      'Pomerania',
      'Pug',
      'Rottweiler',
      'Samoyedo',
      'San Bernardo',
      'Schnauzer',
      'Shar pei',
      'Shih tzu',
      'Weimaraner',
      'Yorkshire terrier',
    ]),
  ],
  Felino: [
    RAZA_CRIOLLA,
    RAZA_DESCONOCIDA,
    ...ordenar([
      'Abisinio',
      'Angora turco',
      'Azul ruso',
      'Bengalí',
      'Bombay',
      'British shorthair',
      'Esfinge (sphynx)',
      'Exótico de pelo corto',
      'Himalayo',
      'Maine coon',
      'Persa',
      'Ragdoll',
      'Sagrado de Birmania',
      'Scottish fold',
      'Siamés',
    ]),
  ],
  Ave: [
    RAZA_DESCONOCIDA,
    ...ordenar([
      'Agapornis',
      'Cacatúa',
      'Canario',
      'Gallina',
      'Guacamaya',
      'Loro',
      'Ninfa (cocotilla)',
      'Paloma',
      'Periquito australiano',
      'Pinzón',
    ]),
  ],
};

// true si la especie usa texto libre en vez de lista.
export function razaEsTextoLibre(especie) {
  return Boolean(especie) && !RAZAS_POR_ESPECIE[especie];
}
