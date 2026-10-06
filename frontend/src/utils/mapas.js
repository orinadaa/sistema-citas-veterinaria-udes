// utils/mapas.js
// Enlaces a Google Maps para una sede (sin API key ni integracion: son
// URLs publicas de Google Maps que abren en una pestaña nueva). La
// consulta usa nombre, direccion y ciudad para ubicar el lugar exacto.
function consultaMaps(sede) {
  return encodeURIComponent([sede.nombre, sede.direccion, sede.ciudad, 'Colombia'].filter(Boolean).join(', '));
}

// Ficha del lugar en Google Maps.
export function urlVerEnMaps(sede) {
  return `https://www.google.com/maps/search/?api=1&query=${consultaMaps(sede)}`;
}

// Indicaciones para llegar desde la ubicacion actual.
export function urlComoLlegar(sede) {
  return `https://www.google.com/maps/dir/?api=1&destination=${consultaMaps(sede)}`;
}
