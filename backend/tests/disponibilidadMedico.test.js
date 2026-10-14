// tests/disponibilidadMedico.test.js
// Logica pura de disponibilidad propia del medico.
const { medicoAtiende } = require('../src/utils/disponibilidadMedico');

const SEDE = 'sede-1';
// Lunes 5 de octubre de 2026 (hora local).
const a = (h, m = 0) => new Date(2026, 9, 5, h, m);

function contexto({ horario, bloqueos = [], conHorario = true } = {}) {
  return {
    sedeId: SEDE,
    conHorarioPropio: new Set(conHorario ? ['m1'] : []),
    horarioDelDia: new Map(horario ? [['m1', horario]] : []),
    bloqueos,
  };
}
const HORARIO = { sede_id: SEDE, hora_inicio: '08:00', hora_fin: '12:00', pausa_inicio: '10:00', pausa_fin: '10:30' };

describe('medicoAtiende', () => {
  test('sin horario propio atiende siempre (usa el horario de la sede)', () => {
    expect(medicoAtiende('m1', a(15), contexto({ conHorario: false }))).toBe(true);
  });

  test('con horario propio: dentro del rango si, fuera no', () => {
    const ctx = contexto({ horario: HORARIO });
    expect(medicoAtiende('m1', a(8), ctx)).toBe(true);
    expect(medicoAtiende('m1', a(11, 30), ctx)).toBe(true);
    expect(medicoAtiende('m1', a(12), ctx)).toBe(false);
    expect(medicoAtiende('m1', a(7, 30), ctx)).toBe(false);
  });

  test('no atiende durante la pausa', () => {
    const ctx = contexto({ horario: HORARIO });
    expect(medicoAtiende('m1', a(10), ctx)).toBe(false);
    expect(medicoAtiende('m1', a(10, 30), ctx)).toBe(true);
  });

  test('con horario propio no atiende un dia sin fila, ni en otra sede', () => {
    expect(medicoAtiende('m1', a(9), contexto({ horario: null }))).toBe(false);
    expect(medicoAtiende('m1', a(9), contexto({ horario: { ...HORARIO, sede_id: 'otra' } }))).toBe(false);
  });

  test('un bloqueo de dia completo lo saca, aunque no tenga horario propio', () => {
    const ctx = contexto({ conHorario: false, bloqueos: [{ medico_id: 'm1', fecha_inicio: '2026-10-01', fecha_fin: '2026-10-09' }] });
    expect(medicoAtiende('m1', a(9), ctx)).toBe(false);
  });

  test('un bloqueo por horas solo saca las franjas que se cruzan', () => {
    const ctx = contexto({
      horario: HORARIO,
      bloqueos: [{ medico_id: 'm1', fecha_inicio: '2026-10-05', fecha_fin: '2026-10-05', hora_inicio: '08:30', hora_fin: '09:30' }],
    });
    expect(medicoAtiende('m1', a(8), ctx)).toBe(true);
    expect(medicoAtiende('m1', a(8, 30), ctx)).toBe(false);
    expect(medicoAtiende('m1', a(9), ctx)).toBe(false);
    expect(medicoAtiende('m1', a(9, 30), ctx)).toBe(true);
  });

  test('un bloqueo de otro medico o de otras fechas no afecta', () => {
    const ctx = contexto({
      conHorario: false,
      bloqueos: [
        { medico_id: 'm2', fecha_inicio: '2026-10-05', fecha_fin: '2026-10-05' },
        { medico_id: 'm1', fecha_inicio: '2026-10-06', fecha_fin: '2026-10-07' },
      ],
    });
    expect(medicoAtiende('m1', a(9), ctx)).toBe(true);
  });
});
