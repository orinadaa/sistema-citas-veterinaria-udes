// tests/claveTemporalYCuenta.test.js
// 1. Clave temporal: una cuenta creada por otra persona debe establecer su
//    propia contraseña antes de usar el sistema (lo impone el servidor).
// 2. "Mi perfil" del cliente (/api/cuenta): datos personales y cambio de
//    contraseña confirmado con un codigo enviado a su correo.

jest.mock('../src/models/usuario.model');
jest.mock('../src/models/cuenta.model');
jest.mock('../src/models/perfilMedico.model');
jest.mock('../src/models/recuperacion.model');
jest.mock('../src/services/correo.service');

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const usuarioModel = require('../src/models/usuario.model');
const cuentaModel = require('../src/models/cuenta.model');
const perfilModel = require('../src/models/perfilMedico.model');
const recuperacionModel = require('../src/models/recuperacion.model');
const correoService = require('../src/services/correo.service');

const firmar = (datos) => jwt.sign(datos, process.env.JWT_SECRET);
const con = (peticion, token) => peticion.set('Authorization', 'Bearer ' + token);

beforeEach(() => jest.clearAllMocks());

describe('Clave temporal: obliga a establecer una contraseña propia', () => {
  const TOKEN_TEMPORAL = firmar({ id: 'm1', rol: 'veterinario', sedeId: 's1', cambiarClave: true });

  test('el inicio de sesion avisa que debe cambiarla y entrega un token marcado', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({
      id: 'm1', nombre_completo: 'Ana', correo: 'ana@udes.edu.co', rol: 'veterinario', sede_id: 's1', activo: true,
      contrasena_hash: await bcrypt.hash('Temporal123', 4), debe_cambiar_contrasena: true,
    });
    const respuesta = await request(app).post('/api/auth/login').send({ correo: 'ana@udes.edu.co', contrasena: 'Temporal123' });
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario.debeCambiarContrasena).toBe(true);
    expect(jwt.decode(respuesta.body.token).cambiarClave).toBe(true);
  });

  test('una cuenta normal entra sin la marca', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({
      id: 'c1', nombre_completo: 'Luis', correo: 'luis@correo.com', rol: 'cliente', activo: true,
      contrasena_hash: await bcrypt.hash('MiClave123', 4), debe_cambiar_contrasena: false,
    });
    const respuesta = await request(app).post('/api/auth/login').send({ correo: 'luis@correo.com', contrasena: 'MiClave123' });
    expect(respuesta.body.usuario.debeCambiarContrasena).toBe(false);
    expect(jwt.decode(respuesta.body.token).cambiarClave).toBeUndefined();
  });

  test.each([
    ['su perfil', () => request(app).get('/api/medico/perfil')],
    ['sus citas', () => request(app).get('/api/administracion/citas')],
    ['su sesion', () => request(app).get('/api/auth/perfil')],
  ])('con el token marcado no puede consultar %s (403)', async (_nombre, peticion) => {
    const respuesta = await con(peticion(), TOKEN_TEMPORAL);
    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('CAMBIO_CLAVE_OBLIGATORIO');
  });

  test('establece su contraseña: apaga la marca y recibe una sesion normal', async () => {
    usuarioModel.buscarConHashPorId.mockResolvedValue({
      id: 'm1', nombre_completo: 'Ana', correo: 'ana@udes.edu.co', rol: 'veterinario', sede_id: 's1', activo: true,
      contrasena_hash: await bcrypt.hash('Temporal123', 4), debe_cambiar_contrasena: true,
    });
    const respuesta = await con(request(app).post('/api/auth/primera-clave'), TOKEN_TEMPORAL).send({ contrasenaNueva: 'MiClavePropia1!' });
    expect(respuesta.status).toBe(200);
    expect(usuarioModel.actualizarContrasena).toHaveBeenCalledWith('m1', expect.any(String));
    expect(await bcrypt.compare('MiClavePropia1!', usuarioModel.actualizarContrasena.mock.calls[0][1])).toBe(true);
    expect(respuesta.body.usuario.debeCambiarContrasena).toBe(false);
    expect(jwt.decode(respuesta.body.token).cambiarClave).toBeUndefined();
  });

  test('rechaza una clave corta, la misma temporal, y una cuenta que ya tiene clave propia', async () => {
    const cuenta = {
      id: 'm1', rol: 'veterinario', activo: true, contrasena_hash: await bcrypt.hash('Temporal123', 4), debe_cambiar_contrasena: true,
    };
    usuarioModel.buscarConHashPorId.mockResolvedValue(cuenta);
    const enviar = (contrasenaNueva) => con(request(app).post('/api/auth/primera-clave'), TOKEN_TEMPORAL).send({ contrasenaNueva });
    expect((await enviar('corta')).status).toBe(400);
    expect((await enviar('Temporal123')).status).toBe(400);
    usuarioModel.buscarConHashPorId.mockResolvedValue({ ...cuenta, debe_cambiar_contrasena: false });
    expect((await enviar('MiClavePropia1!')).status).toBe(400);
    expect(usuarioModel.actualizarContrasena).not.toHaveBeenCalled();
  });

  test('sin token no se puede establecer la contraseña de nadie', async () => {
    expect((await request(app).post('/api/auth/primera-clave').send({ contrasenaNueva: 'MiClavePropia1!' })).status).toBe(401);
  });

  test('el personal que crea el superadministrador nace con clave temporal', async () => {
    usuarioModel.crearPersonal.mockResolvedValue({ id: 'n1' });
    correoService.enviarCredenciales.mockResolvedValue();
    const respuesta = await con(request(app).post('/api/usuarios'), firmar({ id: 'su', rol: 'superadministrador' })).send({
      nombreCompleto: 'Nuevo Admin', correo: 'nuevo@udes.edu.co', rol: 'administrador', sedeId: 's1', telefono: '3001112233',
    });
    expect(respuesta.status).toBe(201);
    expect(usuarioModel.crearPersonal).toHaveBeenCalledWith(expect.objectContaining({ claveTemporal: true }));
  });
});

describe('Mi perfil del cliente (/api/cuenta)', () => {
  const TOKEN_CLIENTE = firmar({ id: 'c1', rol: 'cliente' });
  const TOKEN_MEDICO = firmar({ id: 'm1', rol: 'veterinario', sedeId: 's1' });

  test('solo es para clientes', async () => {
    expect((await con(request(app).get('/api/cuenta/perfil'), TOKEN_MEDICO)).status).toBe(403);
    expect((await request(app).get('/api/cuenta/perfil')).status).toBe(401);
  });

  test('devuelve el perfil del cliente que inicio sesion', async () => {
    cuentaModel.obtener.mockResolvedValue({ id: 'c1', nombre_completo: 'Luis', resumen: { mascotas: 2 } });
    const respuesta = await con(request(app).get('/api/cuenta/perfil'), TOKEN_CLIENTE);
    expect(respuesta.status).toBe(200);
    expect(cuentaModel.obtener).toHaveBeenCalledWith('c1');
  });

  test('actualiza solo los datos personales enviados, limpiando espacios', async () => {
    cuentaModel.actualizar.mockResolvedValue({ id: 'c1' });
    const respuesta = await con(request(app).put('/api/cuenta/perfil'), TOKEN_CLIENTE).send({ nombreCompleto: ' Luis Gómez ', telefono: '3001112233', rol: 'administrador', activo: false });
    expect(respuesta.status).toBe(200);
    expect(cuentaModel.actualizar).toHaveBeenCalledWith('c1', { nombreCompleto: 'Luis Gómez', telefono: '3001112233' });
  });

  test('valida nombre, telefono, documento y peticion vacia', async () => {
    const enviar = (cuerpo) => con(request(app).put('/api/cuenta/perfil'), TOKEN_CLIENTE).send(cuerpo);
    expect((await enviar({ nombreCompleto: '  ' })).status).toBe(400);
    expect((await enviar({ telefono: 'abc' })).status).toBe(400);
    expect((await enviar({ telefono: '300 111 2233' })).status).toBe(400);
    expect((await enviar({ telefono: '300111223' })).status).toBe(400);
    expect((await enviar({ documento: '<script>' })).status).toBe(400);
    expect((await enviar({})).status).toBe(400);
    expect(cuentaModel.actualizar).not.toHaveBeenCalled();
  });

  test('pedir el codigo lo envia al correo de la cuenta', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'c1', nombre_completo: 'Luis', correo: 'luis@correo.com' });
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue(null);
    correoService.enviarCodigoRecuperacion.mockResolvedValue();
    const respuesta = await con(request(app).post('/api/cuenta/contrasena/codigo'), TOKEN_CLIENTE);
    expect(respuesta.status).toBe(200);
    expect(recuperacionModel.guardarCodigo).toHaveBeenCalledWith('c1', expect.any(String), expect.any(Date));
    const enviado = correoService.enviarCodigoRecuperacion.mock.calls[0][0];
    expect(enviado.correo).toBe('luis@correo.com');
    expect(enviado.codigo).toMatch(/^\d{6}$/);
    // En la base solo queda el hash del codigo.
    expect(recuperacionModel.guardarCodigo.mock.calls[0][1]).not.toBe(enviado.codigo);
  });

  test('no reenvia otro codigo antes de un minuto', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'c1', correo: 'luis@correo.com' });
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue({ creado_en: new Date(Date.now() - 10000) });
    const respuesta = await con(request(app).post('/api/cuenta/contrasena/codigo'), TOKEN_CLIENTE);
    expect(respuesta.status).toBe(429);
    expect(correoService.enviarCodigoRecuperacion).not.toHaveBeenCalled();
  });

  test('cambia la contraseña con el codigo correcto y lo consume', async () => {
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue({ codigo_hash: await bcrypt.hash('123456', 4), intentos: 0, expira_en: new Date(Date.now() + 60000) });
    perfilModel.obtenerHashContrasena.mockResolvedValue(await bcrypt.hash('ClaveVieja1', 4));
    const respuesta = await con(request(app).put('/api/cuenta/contrasena'), TOKEN_CLIENTE).send({ codigo: '123456', contrasenaNueva: 'ClaveNueva12!' });
    expect(respuesta.status).toBe(200);
    expect(usuarioModel.actualizarContrasena).toHaveBeenCalledWith('c1', expect.any(String));
    expect(recuperacionModel.eliminarPorUsuarioId).toHaveBeenCalledWith('c1');
  });

  test('codigo incorrecto: cuenta el intento y no cambia nada', async () => {
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue({ codigo_hash: await bcrypt.hash('123456', 4), intentos: 0, expira_en: new Date(Date.now() + 60000) });
    const respuesta = await con(request(app).put('/api/cuenta/contrasena'), TOKEN_CLIENTE).send({ codigo: '000000', contrasenaNueva: 'ClaveNueva12!' });
    expect(respuesta.status).toBe(400);
    expect(recuperacionModel.incrementarIntentos).toHaveBeenCalledWith('c1');
    expect(usuarioModel.actualizarContrasena).not.toHaveBeenCalled();
  });

  test('rechaza codigo vencido, demasiados intentos, clave corta y la misma clave', async () => {
    const hash = await bcrypt.hash('123456', 4);
    const enviar = (contrasenaNueva = 'ClaveNueva12!') => con(request(app).put('/api/cuenta/contrasena'), TOKEN_CLIENTE).send({ codigo: '123456', contrasenaNueva });
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue({ codigo_hash: hash, intentos: 0, expira_en: new Date(Date.now() - 1000) });
    expect((await enviar()).status).toBe(400);
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue({ codigo_hash: hash, intentos: 5, expira_en: new Date(Date.now() + 60000) });
    expect((await enviar()).status).toBe(400);
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue({ codigo_hash: hash, intentos: 0, expira_en: new Date(Date.now() + 60000) });
    expect((await enviar('corta')).status).toBe(400);
    perfilModel.obtenerHashContrasena.mockResolvedValue(await bcrypt.hash('ClaveNueva12!', 4));
    expect((await enviar()).status).toBe(400);
    expect(usuarioModel.actualizarContrasena).not.toHaveBeenCalled();
  });
});
