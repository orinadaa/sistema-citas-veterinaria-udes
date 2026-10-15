const { festivosColombia, esFestivoColombiano, pascuaUTC } = require('../src/utils/festivosColombia');

describe('Calendario nacional de festivos colombianos', () => {
  test('calcula Pascua y festivos móviles de 2026', () => {
    expect(pascuaUTC(2026).toISOString().slice(0, 10)).toBe('2026-04-05');
    const fechas = festivosColombia(2026);
    expect(fechas).toEqual(expect.arrayContaining([
      { fecha: '2026-01-12', nombre: 'Día de los Reyes Magos' },
      { fecha: '2026-04-02', nombre: 'Jueves Santo' },
      { fecha: '2026-04-03', nombre: 'Viernes Santo' },
      { fecha: '2026-05-18', nombre: 'Ascensión del Señor' },
      { fecha: '2026-06-08', nombre: 'Corpus Christi' },
      { fecha: '2026-06-15', nombre: 'Sagrado Corazón de Jesús' },
    ]));
  });

  test('reconoce festivos fijos y rechaza fechas ordinarias o inválidas', () => {
    expect(esFestivoColombiano('2026-07-20')).toBe(true);
    expect(esFestivoColombiano('2026-07-21')).toBe(false);
    expect(esFestivoColombiano('2026-02-31')).toBe(false);
    expect(esFestivoColombiano('fecha')).toBe(false);
  });
});
