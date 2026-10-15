// Fechas nacionales de Colombia conforme a la Ley 51 de 1983 (Ley Emiliani).
// Los festivos trasladables se mueven al lunes siguiente; Semana Santa y sus
// festivos móviles se calculan a partir de la fecha de Pascua.
function pascuaUTC(anio) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function sumarDias(fecha, dias) {
  const resultado = new Date(fecha);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

function lunesFestivo(fecha) {
  const dia = fecha.getUTCDay();
  return dia === 1 ? new Date(fecha) : sumarDias(fecha, (8 - dia) % 7);
}

function iso(fecha) {
  return fecha.toISOString().slice(0, 10);
}

function fechaUTC(anio, mes, dia) {
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function festivosColombia(anio) {
  const year = Number(anio);
  if (!Number.isInteger(year) || year < 1900 || year > 2200) return [];

  const fijos = [
    ['Año Nuevo', 1, 1, false],
    ['Día de los Reyes Magos', 1, 6, true],
    ['Día de San José', 3, 19, true],
    ['Día del Trabajo', 5, 1, false],
    ['Día de San Pedro y San Pablo', 6, 29, true],
    ['Día de la Independencia', 7, 20, false],
    ['Batalla de Boyacá', 8, 7, false],
    ['Asunción de la Virgen', 8, 15, true],
    ['Día de la Raza', 10, 12, true],
    ['Día de Todos los Santos', 11, 1, true],
    ['Independencia de Cartagena', 11, 11, true],
    ['Inmaculada Concepción', 12, 8, false],
    ['Navidad', 12, 25, false],
  ];
  const resultados = fijos.map(([nombre, mes, dia, trasladable]) => ({
    fecha: iso(trasladable ? lunesFestivo(fechaUTC(year, mes, dia)) : fechaUTC(year, mes, dia)),
    nombre,
  }));

  const pascua = pascuaUTC(year);
  resultados.push(
    { fecha: iso(sumarDias(pascua, -3)), nombre: 'Jueves Santo' },
    { fecha: iso(sumarDias(pascua, -2)), nombre: 'Viernes Santo' },
    { fecha: iso(lunesFestivo(sumarDias(pascua, 39))), nombre: 'Ascensión del Señor' },
    { fecha: iso(lunesFestivo(sumarDias(pascua, 60))), nombre: 'Corpus Christi' },
    { fecha: iso(lunesFestivo(sumarDias(pascua, 68))), nombre: 'Sagrado Corazón de Jesús' },
  );
  return resultados.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function esFestivoColombiano(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) return false;
  const anio = Number(String(fecha).slice(0, 4));
  return festivosColombia(anio).some((festivo) => festivo.fecha === fecha);
}

module.exports = { festivosColombia, esFestivoColombiano, pascuaUTC, lunesFestivo };
