// tests/franjas.test.js
// Logica pura de generacion de franjas (RF-07/RF-13), sin depender de
// la base de datos ni del dia de la semana (eso ahora lo decide
// horario.model.js segun la configuracion de cada sede).
const { generarFranjasEntreHoras, DURACION_SLOT_MINUTOS } = require('../src/utils/franjas');

describe('generarFranjasEntreHoras', () => {
  test('genera franjas de 08:00 a 16:30 cada 30 minutos dentro de un horario de 08:00 a 17:00', () => {
    const fecha = new Date(2030, 0, 7); // cualquier fecha, solo importa el dia/mes/anio
    const franjas = generarFranjasEntreHoras(fecha, '08:00:00', '17:00:00');

    expect(franjas).toHaveLength(18);
    expect(franjas[0].getHours()).toBe(8);
    expect(franjas[0].getMinutes()).toBe(0);
    expect(franjas.at(-1).getHours()).toBe(16);
    expect(franjas.at(-1).getMinutes()).toBe(30);
  });

  test('genera franjas de 08:00 a 11:30 dentro de un horario de 08:00 a 12:00', () => {
    const fecha = new Date(2030, 0, 12);
    const franjas = generarFranjasEntreHoras(fecha, '08:00:00', '12:00:00');

    expect(franjas).toHaveLength(8);
    expect(franjas.at(-1).getHours()).toBe(11);
    expect(franjas.at(-1).getMinutes()).toBe(30);
  });

  test('las franjas estan separadas exactamente por la duracion configurada', () => {
    const fecha = new Date(2030, 0, 7);
    const franjas = generarFranjasEntreHoras(fecha, '08:00:00', '17:00:00');
    const diferenciaMinutos = (franjas[1] - franjas[0]) / (1000 * 60);
    expect(diferenciaMinutos).toBe(DURACION_SLOT_MINUTOS);
  });
});
