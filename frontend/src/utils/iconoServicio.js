// utils/iconoServicio.js
// Icono de linea para cada servicio del catalogo (tarjetas del flujo de
// agendamiento).
import {
  IconoCintaOncologia,
  IconoCirugia,
  IconoDesparasitacion,
  IconoDienteDental,
  IconoEndoscopia,
  IconoEstetoscopio,
  IconoJeringa,
  IconoLaboratorio,
  IconoRadiografia,
} from '../components/icons';

const REGLAS = [
  { claves: ['vacun'], icono: IconoJeringa },
  { claves: ['cirug'], icono: IconoCirugia },
  { claves: ['desparasit'], icono: IconoDesparasitacion },
  { claves: ['dental', 'profilaxis'], icono: IconoDienteDental },
  { claves: ['laborat'], icono: IconoLaboratorio },
  { claves: ['radiolog', 'radiograf', 'rayos'], icono: IconoRadiografia },
  { claves: ['oncolog'], icono: IconoCintaOncologia },
  { claves: ['endoscop'], icono: IconoEndoscopia },
];

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function iconoDeServicio(nombre = '') {
  const texto = normalizar(nombre);
  return REGLAS.find((regla) => regla.claves.some((clave) => texto.includes(clave)))?.icono ?? IconoEstetoscopio;
}
