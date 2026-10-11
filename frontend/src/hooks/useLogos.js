// hooks/useLogos.js
// Logotipos de la clinica en toda la pagina (barra superior y su animacion,
// pantallas de sesion, pie de pagina, menu del panel e icono de la pestaña).
// El superadministrador puede reemplazar cada uno desde Pagina web >
// Logotipos; el que no se ha reemplazado usa el archivo original que viene
// con el sistema (assets/).
//
// useLogos() devuelve { principal_blanco, principal_color, corto_color,
// corto_blanco, icono } con la direccion de la imagen que toca mostrar.
// Se piden al servidor una vez por visita y se comparten entre todos los
// componentes. Lo ultimo que respondio el servidor se guarda en el
// navegador: asi, al volver, el logotipo propio sale desde el primer
// instante y no se ve primero el original.
import { useEffect, useSyncExternalStore } from 'react';
import { obtenerLogos } from '../api/client';
import logoBlanco from '../assets/logoblanco.webp';
import logoColor from '../assets/logocolor.webp';
import logoCorto from '../assets/logocorto.webp';
import logoCortoBlanco from '../assets/logocortoblanco.webp';

export const LOGOS_ORIGINALES = {
  principal_blanco: logoBlanco,
  principal_color: logoColor,
  corto_color: logoCorto,
  corto_blanco: logoCortoBlanco,
  icono: `${import.meta.env.BASE_URL}favicon.png`,
};
const CLAVES = Object.keys(LOGOS_ORIGINALES);
const CLAVE_GUARDADO = 'udes_veterinaria_logos';
const CARPETA = '/uploads/logos/';

// Solo se aceptan rutas de la carpeta de logotipos del servidor.
function limpiar(logos) {
  return Object.fromEntries(CLAVES.map((clave) => [clave, typeof logos?.[clave] === 'string' && logos[clave].startsWith(CARPETA) ? logos[clave] : null]));
}

function leerGuardados() {
  try {
    return limpiar(JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '{}'));
  } catch {
    return limpiar({});
  }
}

const combinar = (subidos) => Object.fromEntries(CLAVES.map((clave) => [clave, subidos[clave] ?? LOGOS_ORIGINALES[clave]]));

// propios: lo que subio el superadministrador (null = usa el original).
let propios = leerGuardados();
let actuales = combinar(propios);
let pedido = false;
const oyentes = new Set();

function aplicarIcono() {
  const enlace = document.querySelector('link[rel="icon"]');
  if (enlace && enlace.getAttribute('href') !== actuales.icono) {
    enlace.removeAttribute('type');
    enlace.setAttribute('href', actuales.icono);
  }
}

function establecer(logos) {
  const nuevos = limpiar(logos);
  if (CLAVES.every((clave) => nuevos[clave] === propios[clave])) return;
  propios = nuevos;
  actuales = combinar(propios);
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(propios));
  } catch {
    /* sin almacenamiento: solo se pierde el arranque sin parpadeo */
  }
  aplicarIcono();
  oyentes.forEach((avisar) => avisar());
}

function pedirUnaVez() {
  if (pedido) return;
  pedido = true;
  obtenerLogos()
    .then((datos) => establecer(datos.logos))
    .catch(() => {
      pedido = false;
    });
}

function suscribir(avisar) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

aplicarIcono();

// Lo llama el panel del superadministrador con la respuesta del servidor
// despues de subir o restaurar: toda la pagina cambia al instante.
export function publicarLogos(logos) {
  establecer(logos);
}

export function useLogos() {
  useEffect(pedirUnaVez, []);
  return useSyncExternalStore(suscribir, () => actuales);
}

// { clave: ruta del archivo subido, o null si usa el original }.
export function useLogosPropios() {
  useEffect(pedirUnaVez, []);
  return useSyncExternalStore(suscribir, () => propios);
}
