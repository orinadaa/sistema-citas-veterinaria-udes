// tests/horarioAtencion.test.js
// RF-07: generacion de franjas de atencion.
const { generarFranjasDelDia, DURACION_SLOT_MINUTOS } = require('../src/config/horarioAtencion');

function fechaParaDiaSemana(diaSemana) {
  // Busca la proxima fecha (desde hoy) que caiga en el dia de la semana
  // solicitado (0 = domingo ... 6 = sabado).
  const fecha = new Date();
  while (fecha.getDay() !== diaSemana) {
    fecha.setDate(fecha.getDate() + 1);
  }
  return fecha;
}

describe('generarFranjasDelDia', () => {
  test('domingo no tiene franjas (clinica cerrada)', () => {
    const domingo = fechaParaDiaSemana(0);
    expect(generarFranjasDelDia(domingo)).toHaveLength(0);
  });

  test('un dia entre semana genera franjas de 08:00 a 16:30 cada 30 minutos', () => {
    const lunes = fechaParaDiaSemana(1);
    const franjas = generarFranjasDelDia(lunes);

    expect(franjas).toHaveLength(18);
    expect(franjas[0].getHours()).toBe(8);
    expect(franjas[0].getMinutes()).toBe(0);
    expect(franjas.at(-1).getHours()).toBe(16);
    expect(franjas.at(-1).getMinutes()).toBe(30);
  });

  test('el sabado genera franjas de 08:00 a 11:30 cada 30 minutos', () => {
    const sabado = fechaParaDiaSemana(6);
    const franjas = generarFranjasDelDia(sabado);

    expect(franjas).toHaveLength(8);
    expect(franjas.at(-1).getHours()).toBe(11);
    expect(franjas.at(-1).getMinutes()).toBe(30);
  });

  test('las franjas estan separadas exactamente por la duracion configurada', () => {
    const lunes = fechaParaDiaSemana(1);
    const franjas = generarFranjasDelDia(lunes);
    const diferenciaMinutos = (franjas[1] - franjas[0]) / (1000 * 60);
    expect(diferenciaMinutos).toBe(DURACION_SLOT_MINUTOS);
  });
});
