// tests/auth.controller.test.js
// RF-01 (registro en dos pasos, con codigo al correo), RF-02 (login). El modelo de usuario se mockea para que
// estas sean pruebas unitarias reales (no dependen de PostgreSQL).

jest.mock('../src/models/usuario.model');
jest.mock('../src/models/recuperacion.model');
jest.mock('../src/models/registroPendiente.model');
jest.mock('../src/services/correo.service');

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const usuarioModel = require('../src/models/usuario.model');
const recuperacionModel = require('../src/models/recuperacion.model');
const registroPendienteModel = require('../src/models/registroPendiente.model');
const correoService = require('../src/services/correo.service');

const DATOS_REGISTRO = { nombreCompleto: 'Juan Perez', correo: 'juan@correo.com', contrasena: 'password123', autorizaTratamiento: true };

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
      autorizaTratamiento: true,
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
      autorizaTratamiento: true,
    });

    expect(respuesta.status).toBe(409);
  });

  test('con datos validos no crea la cuenta todavia: guarda la solicitud y envia el codigo al correo', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    registroPendienteModel.buscarPorCorreo.mockResolvedValue(null);
    registroPendienteModel.guardar.mockResolvedValue('sol-1');

    const respuesta = await request(app).post('/api/auth/registro').send(DATOS_REGISTRO);

    expect(respuesta.status).toBe(202);
    expect(respuesta.body).toEqual(expect.objectContaining({ verificacionPendiente: true, solicitudId: 'sol-1', correo: 'juan@correo.com' }));
    expect(respuesta.body.token).toBeUndefined();
    expect(usuarioModel.crearCliente).not.toHaveBeenCalled();
    // El codigo va al correo en claro y a la base hasheado.
    const { codigo } = correoService.enviarCodigoRegistro.mock.calls[0][0];
    expect(codigo).toMatch(/^\d{6}$/);
    const guardado = registroPendienteModel.guardar.mock.calls[0][0];
    expect(guardado.codigoHash).not.toBe(codigo);
    expect(await bcrypt.compare(codigo, guardado.codigoHash)).toBe(true);
    expect(guardado.contrasenaHash).not.toBe(DATOS_REGISTRO.contrasena);
  });

  test('si el correo del codigo no se puede enviar responde 502 y descarta la solicitud', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    registroPendienteModel.buscarPorCorreo.mockResolvedValue(null);
    registroPendienteModel.guardar.mockResolvedValue('sol-1');
    correoService.enviarCodigoRegistro.mockRejectedValueOnce(new Error('SMTP caído'));

    const respuesta = await request(app).post('/api/auth/registro').send(DATOS_REGISTRO);

    expect(respuesta.status).toBe(502);
    expect(registroPendienteModel.eliminarPorCorreo).toHaveBeenCalledWith('juan@correo.com');
  });

  test('con un codigo enviado hace menos de un minuto: otra persona espera (429); la misma corrige sus datos sin codigo nuevo', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    registroPendienteModel.buscarPorCorreo.mockResolvedValue({ id: 'sol-1', correo: 'juan@correo.com', codigo_enviado_en: new Date() });

    const ajena = await request(app).post('/api/auth/registro').send(DATOS_REGISTRO);
    expect(ajena.status).toBe(429);
    expect(registroPendienteModel.actualizarDatos).not.toHaveBeenCalled();

    const propia = await request(app).post('/api/auth/registro').send({ ...DATOS_REGISTRO, nombreCompleto: 'Juan Pablo Perez', solicitudId: 'sol-1' });
    expect(propia.status).toBe(202);
    expect(propia.body.solicitudId).toBe('sol-1');
    expect(registroPendienteModel.actualizarDatos).toHaveBeenCalledWith('juan@correo.com', expect.objectContaining({ nombreCompleto: 'Juan Pablo Perez' }));
    expect(registroPendienteModel.guardar).not.toHaveBeenCalled();
    expect(correoService.enviarCodigoRegistro).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/registro/verificar', () => {
  let pendiente;
  beforeEach(async () => {
    jest.clearAllMocks();
    pendiente = {
      id: 'sol-1',
      correo: 'juan@correo.com',
      nombre_completo: 'Juan Perez',
      contrasena_hash: 'hash-de-la-clave',
      telefono: '3001234567',
      codigo_hash: await bcrypt.hash('123456', 4),
      intentos: 0,
      expira_en: new Date(Date.now() + 10 * 60 * 1000),
      codigo_enviado_en: new Date(Date.now() - 5 * 60 * 1000),
    };
    registroPendienteModel.buscarPorCorreo.mockResolvedValue(pendiente);
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    usuarioModel.crearCliente.mockResolvedValue({
      id: 'u2',
      nombre_completo: 'Juan Perez',
      correo: 'juan@correo.com',
      rol: 'cliente',
      telefono: '3001234567',
      creado_en: new Date().toISOString(),
    });
  });

  const verificar = (datos) =>
    request(app)
      .post('/api/auth/registro/verificar')
      .send({ correo: 'juan@correo.com', solicitudId: 'sol-1', codigo: '123456', ...datos });

  test('con el codigo correcto crea la cuenta con los datos guardados y responde con usuario y token', async () => {
    const respuesta = await verificar({});

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.usuario.rol).toBe('cliente');
    expect(respuesta.body.usuario.sedeId).toBeNull();
    expect(typeof respuesta.body.token).toBe('string');
    expect(usuarioModel.crearCliente).toHaveBeenCalledWith({
      nombreCompleto: 'Juan Perez',
      correo: 'juan@correo.com',
      contrasenaHash: 'hash-de-la-clave',
      telefono: '3001234567',
      autorizaTratamiento: true,
    });
    expect(registroPendienteModel.eliminarPorCorreo).toHaveBeenCalledWith('juan@correo.com');
    expect(correoService.enviarBienvenidaCliente).toHaveBeenCalledWith(expect.objectContaining({ correo: 'juan@correo.com' }));
  });

  test('crea la cuenta aunque falle el correo de bienvenida (best-effort)', async () => {
    correoService.enviarBienvenidaCliente.mockRejectedValueOnce(new Error('SMTP caído'));
    expect((await verificar({})).status).toBe(201);
  });

  test('un codigo incorrecto no crea la cuenta y suma un intento', async () => {
    const respuesta = await verificar({ codigo: '000000' });

    expect(respuesta.status).toBe(400);
    expect(registroPendienteModel.incrementarIntentos).toHaveBeenCalledWith('juan@correo.com');
    expect(usuarioModel.crearCliente).not.toHaveBeenCalled();
  });

  test('rechaza el codigo vencido, el que ya agoto los intentos y el correo sin solicitud', async () => {
    pendiente.expira_en = new Date(Date.now() - 1000);
    expect((await verificar({})).status).toBe(400);

    pendiente.expira_en = new Date(Date.now() + 60000);
    pendiente.intentos = 5;
    expect((await verificar({})).status).toBe(400);

    registroPendienteModel.buscarPorCorreo.mockResolvedValue(null);
    expect((await verificar({})).status).toBe(400);
    expect(usuarioModel.crearCliente).not.toHaveBeenCalled();
  });

  test('el codigo correcto no sirve desde otro navegador (identificador de solicitud distinto o ausente)', async () => {
    expect((await verificar({ solicitudId: 'otra' })).status).toBe(400);
    expect((await verificar({ solicitudId: undefined })).status).toBe(400);
    expect(usuarioModel.crearCliente).not.toHaveBeenCalled();
    // No gasta intentos del dueño de la solicitud.
    expect(registroPendienteModel.incrementarIntentos).not.toHaveBeenCalled();
  });

  test('responde 409 si entre tanto se creo una cuenta con ese correo', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({ id: 'u9', correo: 'juan@correo.com' });

    const respuesta = await verificar({});

    expect(respuesta.status).toBe(409);
    expect(usuarioModel.crearCliente).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/registro/reenviar', () => {
  beforeEach(() => jest.clearAllMocks());
  const reenviar = (datos) => request(app).post('/api/auth/registro/reenviar').send({ correo: 'juan@correo.com', solicitudId: 'sol-1', ...datos });
  const pendienteDeHace = (segundos) => ({ id: 'sol-1', correo: 'juan@correo.com', nombre_completo: 'Juan Perez', codigo_enviado_en: new Date(Date.now() - segundos * 1000) });

  test('pasado un minuto envia un codigo nuevo y reemplaza el anterior', async () => {
    registroPendienteModel.buscarPorCorreo.mockResolvedValue(pendienteDeHace(90));

    const respuesta = await reenviar({});

    expect(respuesta.status).toBe(200);
    expect(registroPendienteModel.renovarCodigo).toHaveBeenCalledWith('juan@correo.com', expect.any(String), expect.any(Date));
    expect(correoService.enviarCodigoRegistro).toHaveBeenCalledTimes(1);
  });

  test('no envia nada antes de un minuto, sin solicitud o desde otro navegador, y responde igual', async () => {
    registroPendienteModel.buscarPorCorreo.mockResolvedValue(pendienteDeHace(10));
    const pronto = await reenviar({});

    registroPendienteModel.buscarPorCorreo.mockResolvedValue(null);
    const sinSolicitud = await reenviar({});

    registroPendienteModel.buscarPorCorreo.mockResolvedValue(pendienteDeHace(90));
    const ajena = await reenviar({ solicitudId: 'otra' });

    for (const respuesta of [pronto, sinSolicitud, ajena]) {
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.mensaje).toBe(pronto.body.mensaje);
    }
    expect(registroPendienteModel.renovarCodigo).not.toHaveBeenCalled();
    expect(correoService.enviarCodigoRegistro).not.toHaveBeenCalled();
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
