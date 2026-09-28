// tests/disponibilidadMedico.controller.test.js
// Configuracion de la disponibilidad propia del medico.
jest.mock('../src/models/disponibilidadMedico.model');
jest.mock('../src/models/sede.model');
jest.mock('../src/models/horario.model');
jest.mock('../src/models/usuario.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const disponibilidadModel = require('../src/models/disponibilidadMedico.model');
const sedeModel = require('../src/models/sede.model');
const horarioModel = require('../src/models/horario.model');

const TOKEN_VET = jwt.sign({ id: 'vet-1', rol: 'veterinario', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const TOKEN_ADMIN = jwt.sign({ id: 'a1', rol: 'administrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const DIA = { diaSemana: 1, sedeId: 'sede-1', horaInicio: '08:00', horaFin: '12:00' };

beforeEach(() => {
  jest.clearAllMocks();
  sedeModel.buscarPorId.mockResolvedValue({ id: 'sede-1', nombre: 'Sede BGA', activo: true });
  horarioModel.buscarDia.mockResolvedValue({ hora_inicio: '08:00:00', hora_fin: '17:00:00' });
  disponibilidadModel.listarHorario.mockResolvedValue([]);
});

function guardar(dias, token = TOKEN_VET) {
  return request(app).put('/api/medico/disponibilidad/horario').set('Authorization', `Bearer ${token}`).send({ dias });
}

describe('PUT /api/medico/disponibilidad/horario', () => {
  test('es exclusivo del veterinario', async () => {
    expect((await guardar([DIA], TOKEN_ADMIN)).status).toBe(403);
  });

  test('guarda un horario valido dentro del horario de la sede', async () => {
    const r = await guardar([DIA, { ...DIA, diaSemana: 2, pausaInicio: '10:00', pausaFin: '10:30' }]);
    expect(r.status).toBe(200);
    expect(disponibilidadModel.reemplazarHorario).toHaveBeenCalledWith('vet-1', expect.any(Array));
  });

  test('lista vacia = volver al horario de la sede', async () => {
    expect((await guardar([])).status).toBe(200);
    expect(disponibilidadModel.reemplazarHorario).toHaveBeenCalledWith('vet-1', []);
  });

  test('rechaza un dia repetido', async () => {
    expect((await guardar([DIA, DIA])).status).toBe(400);
  });

  test('rechaza un horario fuera del horario de atencion de la sede', async () => {
    expect((await guardar([{ ...DIA, horaFin: '19:00' }])).status).toBe(400);
    expect(disponibilidadModel.reemplazarHorario).not.toHaveBeenCalled();
  });

  test('rechaza un dia en que la sede no atiende', async () => {
    horarioModel.buscarDia.mockResolvedValue(null);
    expect((await guardar([DIA])).status).toBe(400);
  });

  test('rechaza una pausa fuera del rango o incompleta', async () => {
    expect((await guardar([{ ...DIA, pausaInicio: '12:30', pausaFin: '13:00' }])).status).toBe(400);
    expect((await guardar([{ ...DIA, pausaInicio: '10:00' }])).status).toBe(400);
  });
});

describe('Bloqueos', () => {
  const futuro = new Date(Date.now() + 5 * 864e5).toLocaleDateString('en-CA');

  test('rechaza fechas invertidas o ya pasadas', async () => {
    const post = (b) => request(app).post('/api/medico/disponibilidad/bloqueos').set('Authorization', `Bearer ${TOKEN_VET}`).send(b);
    expect((await post({ fechaInicio: '2030-01-10', fechaFin: '2030-01-05' })).status).toBe(400);
    expect((await post({ fechaInicio: '2020-01-01', fechaFin: '2020-01-02' })).status).toBe(400);
  });

  test('crea el bloqueo y avisa cuantas citas quedan dentro', async () => {
    disponibilidadModel.crearBloqueo.mockResolvedValue({ id: 'b1' });
    disponibilidadModel.contarCitasEnRango.mockResolvedValue(2);
    const r = await request(app)
      .post('/api/medico/disponibilidad/bloqueos')
      .set('Authorization', `Bearer ${TOKEN_VET}`)
      .send({ fechaInicio: futuro, fechaFin: futuro, motivo: 'Vacaciones' });
    expect(r.status).toBe(201);
    expect(r.body.citasAfectadas).toBe(2);
  });

  test('solo elimina bloqueos propios', async () => {
    disponibilidadModel.eliminarBloqueo.mockResolvedValue(false);
    const r = await request(app)
      .delete('/api/medico/disponibilidad/bloqueos/11111111-1111-1111-1111-111111111111')
      .set('Authorization', `Bearer ${TOKEN_VET}`);
    expect(r.status).toBe(404);
  });
});
