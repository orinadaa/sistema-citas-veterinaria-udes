// tests/servicio.controller.test.js
// RF-11: catalogo publico de lectura; CRUD exclusivo del administrador.

jest.mock('../src/models/servicio.model');
jest.mock('../src/models/categoriaServicio.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const servicioModel = require('../src/models/servicio.model');
const categoriaServicioModel = require('../src/models/categoriaServicio.model');

const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador' }, process.env.JWT_SECRET);
const TOKEN_CLIENTE = jwt.sign({ id: 'cliente-1', rol: 'cliente' }, process.env.JWT_SECRET);
const CATEGORIA_ID = 'cat-1';

describe('GET /api/servicios', () => {
  test('es publico y devuelve solo los activos', async () => {
    servicioModel.listarTodos.mockResolvedValue([{ id: 's1', nombre: 'Consulta médica' }]);

    const respuesta = await request(app).get('/api/servicios');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.servicios).toHaveLength(1);
  });
});

describe('GET /api/servicios/categorias', () => {
  test('es publico', async () => {
    categoriaServicioModel.listarTodas.mockResolvedValue([{ id: CATEGORIA_ID, nombre: 'Consulta', color: 'blue' }]);

    const respuesta = await request(app).get('/api/servicios/categorias');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.categorias).toHaveLength(1);
  });
});

describe('GET /api/servicios/admin', () => {
  test('rechaza a un cliente', async () => {
    const respuesta = await request(app)
      .get('/api/servicios/admin')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(403);
  });

  test('devuelve todos los servicios (incluidos inactivos) al administrador', async () => {
    servicioModel.listarTodosAdmin.mockResolvedValue([
      { id: 's1', nombre: 'Consulta médica', activo: true },
      { id: 's2', nombre: 'Servicio viejo', activo: false },
    ]);

    const respuesta = await request(app)
      .get('/api/servicios/admin')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.servicios).toHaveLength(2);
  });
});

describe('POST /api/servicios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    categoriaServicioModel.existe.mockResolvedValue(true);
  });

  test('rechaza a un cliente', async () => {
    const respuesta = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nombre: 'Nuevo servicio', categoriaId: CATEGORIA_ID });
    expect(respuesta.status).toBe(403);
  });

  test('rechaza sin nombre', async () => {
    const respuesta = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ categoriaId: CATEGORIA_ID });
    expect(respuesta.status).toBe(400);
  });

  test('rechaza sin categoria', async () => {
    const respuesta = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombre: 'Nuevo servicio' });
    expect(respuesta.status).toBe(400);
  });

  test('rechaza precio negativo o no entero', async () => {
    const respuesta = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombre: 'Nuevo servicio', categoriaId: CATEGORIA_ID, precio: -5 });
    expect(respuesta.status).toBe(400);
  });

  test('rechaza si la categoria no existe', async () => {
    categoriaServicioModel.existe.mockResolvedValue(false);

    const respuesta = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombre: 'Nuevo servicio', categoriaId: 'no-existe' });
    expect(respuesta.status).toBe(400);
  });

  test('responde 409 si el nombre ya existe', async () => {
    servicioModel.crear.mockRejectedValue({ code: '23505' });

    const respuesta = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombre: 'Consulta médica', categoriaId: CATEGORIA_ID });

    expect(respuesta.status).toBe(409);
  });

  test('crea el servicio correctamente', async () => {
    servicioModel.crear.mockResolvedValue({ id: 's1', nombre: 'Nuevo servicio', precio: 50000, activo: true });

    const respuesta = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombre: 'Nuevo servicio', categoriaId: CATEGORIA_ID, precio: 50000 });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.servicio.nombre).toBe('Nuevo servicio');
  });
});

describe('PUT /api/servicios/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    categoriaServicioModel.existe.mockResolvedValue(true);
  });

  test('responde 404 si el servicio no existe', async () => {
    servicioModel.actualizar.mockResolvedValue(null);

    const respuesta = await request(app)
      .put('/api/servicios/no-existe')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ activo: false });

    expect(respuesta.status).toBe(404);
  });

  test('desactiva el servicio correctamente', async () => {
    servicioModel.actualizar.mockResolvedValue({ id: 's1', nombre: 'Consulta médica', activo: false });

    const respuesta = await request(app)
      .put('/api/servicios/s1')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ activo: false });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.servicio.activo).toBe(false);
  });
});
