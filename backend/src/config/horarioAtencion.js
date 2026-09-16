// config/horarioAtencion.js
// Horario general de atencion, igual para las dos sedes por ahora (el
// mismo que se muestra en la landing publica). RF-13 (incremento 3) lo
// hara configurable por sede desde el panel administrativo; mientras
// tanto vive aqui como una unica fuente de verdad para calcular
// disponibilidad (RF-07).

const DURACION_SLOT_MINUTOS = 30;

// getDay(): 0 = domingo ... 6 = sabado
const HORARIO_POR_DIA = {
  0: null,
  1: { inicio: '08:00', fin: '17:00' },
  2: { inicio: '08:00', fin: '17:00' },
  3: { inicio: '08:00', fin: '17:00' },
  4: { inicio: '08:00', fin: '17:00' },
  5: { inicio: '08:00', fin: '17:00' },
  6: { inicio: '08:00', fin: '12:00' },
};

// Genera las franjas de atencion de un dia como objetos Date (hora local).
// Recibe un Date cuyo año/mes/dia se usan; la hora se ignora.
function generarFranjasDelDia(fecha) {
  const horario = HORARIO_POR_DIA[fecha.getDay()];
  if (!horario) return [];

  const [horaInicio, minInicio] = horario.inicio.split(':').map(Number);
  const [horaFin, minFin] = horario.fin.split(':').map(Number);

  const cursor = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), horaInicio, minInicio, 0, 0);
  const limite = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), horaFin, minFin, 0, 0);

  const franjas = [];
  while (cursor < limite) {
    franjas.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + DURACION_SLOT_MINUTOS);
  }
  return franjas;
}

module.exports = { DURACION_SLOT_MINUTOS, generarFranjasDelDia };
