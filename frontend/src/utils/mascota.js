// utils/mascota.js
// Textos derivados del perfil de una mascota (tarjetas del flujo de
// agendamiento y resumen de la cita).

// "3 años", "1 año", "5 meses", "Menos de 1 mes" a partir de la fecha
// de nacimiento (DATE de PostgreSQL, "YYYY-MM-DD..."). null si no hay.
function edadDeMascota(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const [anio, mes, dia] = String(fechaNacimiento).slice(0, 10).split('-').map(Number);
  const nacimiento = new Date(anio, mes - 1, dia);
  if (Number.isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let meses = (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + (hoy.getMonth() - nacimiento.getMonth());
  if (hoy.getDate() < nacimiento.getDate()) meses -= 1;
  if (meses < 1) return 'Menos de 1 mes';
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  const anios = Math.floor(meses / 12);
  return `${anios} ${anios === 1 ? 'año' : 'años'}`;
}

// "Canino · Labrador"
export function especieYRaza(mascota) {
  return [mascota.especie, mascota.raza].filter(Boolean).join(' · ');
}

// "3 años · 12 kg" (solo las partes que existan)
export function edadYPeso(mascota) {
  const edad = edadDeMascota(mascota.fecha_nacimiento);
  const peso = mascota.peso_kg ? `${Number(mascota.peso_kg)} kg` : null;
  return [edad, peso].filter(Boolean).join(' · ');
}
