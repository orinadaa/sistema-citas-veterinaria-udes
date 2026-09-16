// tests/auth.controller.test.js
// RF-01 (registro), RF-02 (login). El modelo de usuario se mockea para que
// estas sean pruebas unitarias reales (no dependen de PostgreSQL).

jest.mock('../src/models/usuario.model');

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const usuarioModel = require('../src/models/usuario.model');

describe('POST /api/auth/registro', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza si faltan campos obligatorios', async () => {
    const respuesta = await request(app).post('/api/auth/registro').send({ correo: 'a@a.com' });

    expect(respuesta.status).toBe(400);
  });

  test('rechaza un correo con formato invalido', async () => {
    const respuesta = await request(app).post('/api/auth/registro').send({
      nombreCompleto: 'Juan Perez',
      correo: 'correo-sin-arroba',
      contrasena: 'password123',
    });

    expect(respuesta.status).toBe(400);
  });

  test('rechaza una contraseña de menos de 8 caracteres', async () => {
    const respuesta = await request(app).post('/api/auth/registro').send({
      nombreCompleto: 'Juan Perez',
      correo: 'juan@correo.com',
      contrasena: '1234',
    });

    expect(respuesta.status).toBe(400);
  });

  test('rechaza con 409 si el correo ya esta registrado', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({ id: 'u1', correo: 'juan@correo.com' });

    const respuesta = await request(app).post('/api/auth/registro').send({
      nombreCompleto: 'Juan Perez',
      correo: 'juan@correo.com',
      contrasena: 'password123',
    });

    expect(respuesta.status).toBe(409);
  });

  test('registra un cliente nuevo y responde con usuario y token', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    usuarioModel.crearCliente.mockResolvedValue({
      id: 'u2',
      nombre_completo: 'Juan Perez',
      correo: 'juan@correo.com',
      rol: 'cliente',
      telefono: null,
      creado_en: new Date().toISOString(),
    });

    const respuesta = await request(app).post('/api/auth/registro').send({
      nombreCompleto: 'Juan Perez',
      correo: 'juan@correo.com',
      contrasena: 'password123',
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.usuario.rol).toBe('cliente');
    expect(respuesta.body.usuario.sedeId).toBeNull();
    expect(typeof respuesta.body.token).toBe('string');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza con 401 si el correo no existe', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);

    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'nadie@correo.com', contrasena: 'password123' });

    expect(respuesta.status).toBe(401);
  });

  test('rechaza con 401 si la contraseña no coincide', async () => {
    const hashReal = await bcrypt.hash('claveCorrecta', 10);
    usuarioModel.buscarPorCorreo.mockResolvedValue({
      id: 'u1',
      correo: 'juan@correo.com',
      contrasena_hash: hashReal,
      rol: 'cliente',
      activo: true,
    });

    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'juan@correo.com', contrasena: 'claveIncorrecta' });

    expect(respuesta.status).toBe(401);
  });

  test('permite iniciar sesion con credenciales correctas', async () => {
    const hashReal = await bcrypt.hash('claveCorrecta', 10);
    usuarioModel.buscarPorCorreo.mockResolvedValue({
      id: 'u1',
      nombre_completo: 'Juan Perez',
      correo: 'juan@correo.com',
      contrasena_hash: hashReal,
      rol: 'cliente',
      sede_id: null,
      activo: true,
    });

    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'juan@correo.com', contrasena: 'claveCorrecta' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario.correo).toBe('juan@correo.com');
    expect(typeof respuesta.body.token).toBe('string');
  });

  test('rechaza el inicio de sesion de una cuenta inactiva', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({
      id: 'u1',
      correo: 'juan@correo.com',
      contrasena_hash: 'hash-cualquiera',
      rol: 'cliente',
      activo: false,
    });

    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'juan@correo.com', contrasena: 'cualquier-cosa' });

    expect(respuesta.status).toBe(401);
  });
});
