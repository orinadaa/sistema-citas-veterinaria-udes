// tests/sede.controller.test.js
// RF-03: listado publico de sedes; creacion/edicion exclusiva del
// administrador, sin restriccion de "mi propia sede" (ver
// database/incremento_3d_sedes_perfil.sql).

jest.mock('../src/models/sede.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const sedeModel = require('../src/models/sede.model');

const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const TOKEN_CLIENTE = jwt.sign({ id: 'cliente-1', rol: 'cliente' }, process.env.JWT_SECRET);

describe('GET /api/sedes', () => {
  test('es publico y solo devuelve sedes activas', async () => {
    sedeModel.listarTodas.mockResolvedValue([{ id: 's1', nombre: 'Sede Bucaramanga', activo: true }]);

    const respuesta = await request(app).get('/api/sedes');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.sedes).toHaveLength(1);
    expect(sedeModel.listarTodasAdmin).not.toHaveBeenCalled();
  });
});

describe('GET /api/sedes/admin', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza a un cliente', async () => {
    const respuesta = await request(app)
      .get('/api/sedes/admin')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(403);
  });

  test('devuelve todas las sedes, incluidas las inactivas', async () => {
    sedeModel.listarTodasAdmin.mockResolvedValue([
      { id: 's1', nombre: 'Sede Bucaramanga', activo: true },
      { id: 's2', nombre: 'Sede Valledupar', activo: false },
    ]);

    const respuesta = await request(app)
      .get('/api/sedes/admin')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.sedes).toHaveLength(2);
  });
});

describe('POST /api/sedes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza a un cliente', async () => {
    const respuesta = await request(app)
      .post('/api/sedes')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nombre: 'Sede nueva', ciudad: 'Cúcuta' });
    expect(respuesta.status).toBe(403);
  });

  test('rechaza sin nombre o ciudad', async () => {
    const respuesta = await request(app)
      .post('/api/sedes')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombre: 'Sede nueva' });
    expect(respuesta.status).toBe(400);
  });

  test('crea la sede correctamente', async () => {
    sedeModel.crear.mockResolvedValue({ id: 's2', nombre: 'Sede nueva', ciudad: 'Cúcuta', activo: true });

    const respuesta = await request(app)
      .post('/api/sedes')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombre: 'Sede nueva', ciudad: 'Cúcuta' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.sede.nombre).toBe('Sede nueva');
  });
});

describe('PUT /api/sedes/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('responde 404 si la sede no existe', async () => {
    sedeModel.actualizar.mockResolvedValue(null);

    const respuesta = await request(app)
      .put('/api/sedes/no-existe')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ activo: false });

    expect(respuesta.status).toBe(404);
  });

  test('un administrador puede editar una sede que no es la suya', async () => {
    sedeModel.actualizar.mockResolvedValue({ id: 'sede-2', nombre: 'Sede Valledupar', activo: false });

    const respuesta = await request(app)
      .put('/api/sedes/sede-2')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ activo: false });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.sede.activo).toBe(false);
  });
});
