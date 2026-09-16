// tests/horario.controller.test.js
// RF-13: horario de atencion por sede. Lectura publica, escritura solo
// administrador.

jest.mock('../src/models/horario.model');
jest.mock('../src/models/sede.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const horarioModel = require('../src/models/horario.model');
const sedeModel = require('../src/models/sede.model');

const ID_SEDE = 'sede-1';
const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador' }, process.env.JWT_SECRET);
const TOKEN_CLIENTE = jwt.sign({ id: 'cliente-1', rol: 'cliente' }, process.env.JWT_SECRET);

describe('GET /api/horarios', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza sin sedeId', async () => {
    const respuesta = await request(app).get('/api/horarios');
    expect(respuesta.status).toBe(400);
  });

  test('responde 404 si la sede no existe', async () => {
    sedeModel.buscarPorId.mockResolvedValue(null);

    const respuesta = await request(app).get('/api/horarios').query({ sedeId: 'no-existe' });
    expect(respuesta.status).toBe(404);
  });

  test('es publico (no requiere token) y devuelve el horario', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    horarioModel.listarPorSede.mockResolvedValue([
      { dia_semana: 1, hora_inicio: '08:00:00', hora_fin: '17:00:00' },
    ]);

    const respuesta = await request(app).get('/api/horarios').query({ sedeId: ID_SEDE });
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.horario).toHaveLength(1);
  });
});

describe('PUT /api/horarios', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza sin token', async () => {
    const respuesta = await request(app)
      .put('/api/horarios')
      .send({ sedeId: ID_SEDE, diaSemana: 1, horaInicio: '08:00', horaFin: '17:00' });
    expect(respuesta.status).toBe(401);
  });

  test('rechaza a un cliente (no es administrador)', async () => {
    const respuesta = await request(app)
      .put('/api/horarios')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ sedeId: ID_SEDE, diaSemana: 1, horaInicio: '08:00', horaFin: '17:00' });
    expect(respuesta.status).toBe(403);
  });

  test('rechaza un diaSemana fuera de rango', async () => {
    const respuesta = await request(app)
      .put('/api/horarios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ sedeId: ID_SEDE, diaSemana: 9, horaInicio: '08:00', horaFin: '17:00' });
    expect(respuesta.status).toBe(400);
  });

  test('rechaza si la hora de inicio no es anterior a la de fin', async () => {
    const respuesta = await request(app)
      .put('/api/horarios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ sedeId: ID_SEDE, diaSemana: 1, horaInicio: '17:00', horaFin: '08:00' });
    expect(respuesta.status).toBe(400);
  });

  test('actualiza el horario correctamente', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    horarioModel.upsertDia.mockResolvedValue({ dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '18:00:00' });

    const respuesta = await request(app)
      .put('/api/horarios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ sedeId: ID_SEDE, diaSemana: 1, horaInicio: '09:00', horaFin: '18:00' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.dia.hora_inicio).toBe('09:00:00');
  });
});

describe('DELETE /api/horarios/:sedeId/:diaSemana', () => {
  test('rechaza a un veterinario (no es administrador)', async () => {
    const tokenVet = jwt.sign({ id: 'vet-1', rol: 'veterinario' }, process.env.JWT_SECRET);

    const respuesta = await request(app)
      .delete(`/api/horarios/${ID_SEDE}/0`)
      .set('Authorization', `Bearer ${tokenVet}`);

    expect(respuesta.status).toBe(403);
  });

  test('cierra el dia correctamente', async () => {
    horarioModel.cerrarDia.mockResolvedValue();

    const respuesta = await request(app)
      .delete(`/api/horarios/${ID_SEDE}/0`)
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(204);
  });
});
