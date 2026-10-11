// utils/franjas.js
// Logica pura de calculo de franjas horarias, separada del origen de
// los datos (antes era una constante fija, ahora viene de la tabla
// horario_atencion via horario.model.js).

const DURACION_SLOT_MINUTOS = 30;

// Genera las franjas de un dia (objetos Date, hora local) entre
// horaInicio y horaFin (strings "HH:MM" o "HH:MM:SS", como los devuelve
// PostgreSQL para columnas TIME).
function generarFranjasEntreHoras(fecha, horaInicio, horaFin) {
  const [horaIni, minIni] = horaInicio.split(':').map(Number);
  const [horaFinNum, minFin] = horaFin.split(':').map(Number);

  const cursor = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), horaIni, minIni, 0, 0);
  const limite = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), horaFinNum, minFin, 0, 0);

  const franjas = [];
  while (cursor < limite) {
    franjas.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + DURACION_SLOT_MINUTOS);
  }
  return franjas;
}

// Franjas (de 30 minutos) que ocupa una cita que empieza en `inicio` y
// dura `duracionMinutos`: una consulta de 30 ocupa una; una cirugia de 90,
// tres. Antes toda cita ocupaba una sola franja, durara lo que durara.
function franjasQueOcupa(inicio, duracionMinutos) {
  const cantidad = Math.max(1, Math.ceil((Number(duracionMinutos) || DURACION_SLOT_MINUTOS) / DURACION_SLOT_MINUTOS));
  return Array.from({ length: cantidad }, (_, i) => new Date(new Date(inicio).getTime() + i * DURACION_SLOT_MINUTOS * 60000));
}

module.exports = { DURACION_SLOT_MINUTOS, generarFranjasEntreHoras, franjasQueOcupa };
