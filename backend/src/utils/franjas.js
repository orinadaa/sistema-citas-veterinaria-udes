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

module.exports = { DURACION_SLOT_MINUTOS, generarFranjasEntreHoras };
