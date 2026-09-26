// utils/moneda.js
// Formato de pesos colombianos, consistente en toda la app (catalogo
// de precios, nunca facturacion -- ver el alcance del proyecto).
const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export function formatearCOP(valor) {
  return formatoCOP.format(valor);
}
