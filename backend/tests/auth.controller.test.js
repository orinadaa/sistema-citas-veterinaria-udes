// tests/auth.controller.test.js
// RF-01 (registro), RF-02 (login). El modelo de usuario se mockea para que
// estas sean pruebas unitarias reales (no dependen de PostgreSQL).

jest.mock('../src/models/usuario.model');
jest.mock('../src/models/recuperacion.model');
jest.mock('../src/services/correo.service');

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const usuarioModel = require('../src/models/usuario.model');
const recuperacionModel = require('../src/models/recuperacion.model');
const correoService = require('../src/services/correo.service');

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
    expect(correoService.enviarBienvenidaCliente).toHaveBeenCalledWith(
      expect.objectContaining({ correo: 'juan@correo.com' })
    );
  });

  test('registra al cliente aunque falle el envio del correo de bienvenida (best-effort)', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    usuarioModel.crearCliente.mockResolvedValue({
      id: 'u2',
      nombre_completo: 'Juan Perez',
      correo: 'juan@correo.com',
      rol: 'cliente',
      telefono: null,
      creado_en: new Date().toISOString(),
    });
    correoService.enviarBienvenidaCliente.mockRejectedValue(new Error('SMTP caído'));

    const respuesta = await request(app).post('/api/auth/registro').send({
      nombreCompleto: 'Juan Perez',
      correo: 'juan@correo.com',
      contrasena: 'password123',
    });

    expect(respuesta.status).toBe(201);
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

  test('correo inexistente y contraseña incorrecta responden el mismo mensaje (no revela que correos existen)', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    const sinCuenta = await request(app).post('/api/auth/login').send({ correo: 'nadie@correo.com', contrasena: 'password123' });

    usuarioModel.buscarPorCorreo.mockResolvedValue({
      id: 'u1',
      correo: 'juan@correo.com',
      contrasena_hash: await bcrypt.hash('claveCorrecta', 10),
      rol: 'cliente',
      activo: true,
    });
    const claveMala = await request(app).post('/api/auth/login').send({ correo: 'juan@correo.com', contrasena: 'claveIncorrecta' });

    expect(sinCuenta.status).toBe(401);
    expect(claveMala.status).toBe(401);
    expect(sinCuenta.body).toEqual(claveMala.body);
  });

  test('cuenta inactiva con la contraseña correcta: avisa que esta inactiva y no entrega token', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({
      id: 'u1',
      correo: 'juan@correo.com',
      contrasena_hash: await bcrypt.hash('claveCorrecta', 10),
      rol: 'cliente',
      activo: false,
    });

    const respuesta = await request(app).post('/api/auth/login').send({ correo: 'juan@correo.com', contrasena: 'claveCorrecta' });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.mensaje).toMatch(/inactiva/);
    expect(respuesta.body.token).toBeUndefined();
  });

  test('cuenta inactiva con contraseña incorrecta: mensaje generico, no revela el estado de la cuenta', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({
      id: 'u1',
      correo: 'juan@correo.com',
      contrasena_hash: await bcrypt.hash('claveCorrecta', 10),
      rol: 'cliente',
      activo: false,
    });

    const respuesta = await request(app).post('/api/auth/login').send({ correo: 'juan@correo.com', contrasena: 'otraClave' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.mensaje).not.toMatch(/inactiva/);
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

describe('POST /api/auth/olvide-clave', () => {
  beforeEach(() => jest.clearAllMocks());

  test('responde el mensaje generico aunque el correo no exista (no revela si esta registrado)', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);

    const respuesta = await request(app).post('/api/auth/olvide-clave').send({ correo: 'nadie@correo.com' });

    expect(respuesta.status).toBe(200);
    expect(recuperacionModel.guardarCodigo).not.toHaveBeenCalled();
    expect(correoService.enviarCodigoRecuperacion).not.toHaveBeenCalled();
  });

  test('genera y envia un codigo si el correo existe', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({ id: 'u1', correo: 'juan@correo.com', nombre_completo: 'Juan Perez' });
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue(null);
    correoService.enviarCodigoRecuperacion.mockResolvedValue();

    const respuesta = await request(app).post('/api/auth/olvide-clave').send({ correo: 'juan@correo.com' });

    expect(respuesta.status).toBe(200);
    expect(recuperacionModel.guardarCodigo).toHaveBeenCalledWith('u1', expect.any(String), expect.any(Date));
    expect(correoService.enviarCodigoRecuperacion).toHaveBeenCalledWith(
      expect.objectContaining({ correo: 'juan@correo.com' })
    );
  });

  test('no genera un codigo nuevo si ya se pidio uno hace menos de un minuto', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({ id: 'u1', correo: 'juan@correo.com', nombre_completo: 'Juan Perez' });
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue({ creado_en: new Date().toISOString() });

    const respuesta = await request(app).post('/api/auth/olvide-clave').send({ correo: 'juan@correo.com' });

    expect(respuesta.status).toBe(200);
    expect(recuperacionModel.guardarCodigo).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/restablecer-clave', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza una contraseña de menos de 8 caracteres', async () => {
    const respuesta = await request(app)
      .post('/api/auth/restablecer-clave')
      .send({ correo: 'juan@correo.com', codigo: '123456', contrasenaNueva: '123' });

    expect(respuesta.status).toBe(400);
  });

  test('rechaza si el correo no existe', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);

    const respuesta = await request(app)
      .post('/api/auth/restablecer-clave')
      .send({ correo: 'nadie@correo.com', codigo: '123456', contrasenaNueva: 'nuevaClave123' });

    expect(respuesta.status).toBe(400);
  });

  test('rechaza si el codigo expiro', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({ id: 'u1', correo: 'juan@correo.com' });
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue({
      codigo_hash: await bcrypt.hash('123456', 10),
      intentos: 0,
      expira_en: new Date(Date.now() - 1000).toISOString(),
    });

    const respuesta = await request(app)
      .post('/api/auth/restablecer-clave')
      .send({ correo: 'juan@correo.com', codigo: '123456', contrasenaNueva: 'nuevaClave123' });

    expect(respuesta.status).toBe(400);
  });

  test('rechaza si el codigo ya agoto los intentos', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({ id: 'u1', correo: 'juan@correo.com' });
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue({
      codigo_hash: await bcrypt.hash('123456', 10),
      intentos: 5,
      expira_en: new Date(Date.now() + 60000).toISOString(),
    });

    const respuesta = await request(app)
      .post('/api/auth/restablecer-clave')
      .send({ correo: 'juan@correo.com', codigo: '123456', contrasenaNueva: 'nuevaClave123' });

    expect(respuesta.status).toBe(400);
  });

  test('rechaza un codigo incorrecto e incrementa los intentos', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({ id: 'u1', correo: 'juan@correo.com' });
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue({
      codigo_hash: await bcrypt.hash('123456', 10),
      intentos: 0,
      expira_en: new Date(Date.now() + 60000).toISOString(),
    });

    const respuesta = await request(app)
      .post('/api/auth/restablecer-clave')
      .send({ correo: 'juan@correo.com', codigo: '999999', contrasenaNueva: 'nuevaClave123' });

    expect(respuesta.status).toBe(400);
    expect(recuperacionModel.incrementarIntentos).toHaveBeenCalledWith('u1');
  });

  test('restablece la contraseña con un codigo correcto', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({ id: 'u1', correo: 'juan@correo.com' });
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue({
      codigo_hash: await bcrypt.hash('123456', 10),
      intentos: 0,
      expira_en: new Date(Date.now() + 60000).toISOString(),
    });

    const respuesta = await request(app)
      .post('/api/auth/restablecer-clave')
      .send({ correo: 'juan@correo.com', codigo: '123456', contrasenaNueva: 'nuevaClave123' });

    expect(respuesta.status).toBe(200);
    expect(usuarioModel.actualizarContrasena).toHaveBeenCalledWith('u1', expect.any(String));
    expect(recuperacionModel.eliminarPorUsuarioId).toHaveBeenCalledWith('u1');
  });
});
