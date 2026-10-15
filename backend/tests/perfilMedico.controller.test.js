// tests/perfilMedico.controller.test.js
// "Mi perfil" del medico: edicion parcial, contraseña y cambio de correo
// verificado con codigo enviado al correo nuevo.
jest.mock('../src/models/usuario.model');
jest.mock('../src/models/perfilMedico.model');
jest.mock('../src/services/correo.service');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const usuarioModel = require('../src/models/usuario.model');
const perfilModel = require('../src/models/perfilMedico.model');
const correoService = require('../src/services/correo.service');

const TOKEN_VET = jwt.sign({ id: 'vet-1', rol: 'veterinario', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const TOKEN_CLIENTE = jwt.sign({ id: 'c1', rol: 'cliente' }, process.env.JWT_SECRET);

beforeEach(() => jest.clearAllMocks());

describe('PUT /api/medico/perfil', () => {
  test('es exclusivo del veterinario', async () => {
    const r = await request(app).put('/api/medico/perfil').set('Authorization', `Bearer ${TOKEN_CLIENTE}`).send({ telefono: '1' });
    expect(r.status).toBe(403);
  });

  test('no deja vaciar el nombre ni el telefono', async () => {
    for (const cuerpo of [{ nombreCompleto: '  ' }, { telefono: '' }, { telefono: '300 111 2233' }, { telefono: '123' }]) {
      const r = await request(app).put('/api/medico/perfil').set('Authorization', `Bearer ${TOKEN_VET}`).send(cuerpo);
      expect(r.status).toBe(400);
    }
    expect(perfilModel.actualizar).not.toHaveBeenCalled();
  });

  test('rechaza años de experiencia fuera de la lista', async () => {
    const r = await request(app).put('/api/medico/perfil').set('Authorization', `Bearer ${TOKEN_VET}`).send({ aniosExperiencia: '50' });
    expect(r.status).toBe(400);
  });

  test('ignora correo, sede, especialidades y servicios (solo lectura)', async () => {
    perfilModel.actualizar.mockResolvedValue({ id: 'vet-1' });
    const r = await request(app)
      .put('/api/medico/perfil')
      .set('Authorization', `Bearer ${TOKEN_VET}`)
      .send({ biografia: 'Hola', correo: 'otro@x.com', sedeId: 's2', servicioIds: ['a'] });
    expect(r.status).toBe(200);
    expect(perfilModel.actualizar).toHaveBeenCalledWith('vet-1', { biografia: 'Hola' });
  });
});

describe('PUT /api/medico/perfil/contrasena', () => {
  test('rechaza si la contraseña actual no coincide', async () => {
    perfilModel.obtenerHashContrasena.mockResolvedValue(await bcrypt.hash('correcta123', 4));
    const r = await request(app)
      .put('/api/medico/perfil/contrasena')
      .set('Authorization', `Bearer ${TOKEN_VET}`)
      .send({ actual: 'otra12345', nueva: 'nueva12345' });
    expect(r.status).toBe(400);
    expect(usuarioModel.actualizarContrasena).not.toHaveBeenCalled();
  });

  test('actualiza la contraseña con la actual correcta', async () => {
    perfilModel.obtenerHashContrasena.mockResolvedValue(await bcrypt.hash('correcta123', 4));
    const r = await request(app)
      .put('/api/medico/perfil/contrasena')
      .set('Authorization', `Bearer ${TOKEN_VET}`)
      .send({ actual: 'correcta123', nueva: 'nueva12345' });
    expect(r.status).toBe(200);
    expect(usuarioModel.actualizarContrasena).toHaveBeenCalled();
  });
});

describe('Cambio de correo verificado', () => {
  test('rechaza un correo que ya usa otra cuenta', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-1', correo: 'yo@x.com', nombre_completo: 'Yo' });
    usuarioModel.buscarPorCorreo.mockResolvedValue({ id: 'otro' });
    const r = await request(app).post('/api/medico/perfil/correo').set('Authorization', `Bearer ${TOKEN_VET}`).send({ correoNuevo: 'ocupado@x.com' });
    expect(r.status).toBe(409);
    expect(correoService.enviarCodigoCambioCorreo).not.toHaveBeenCalled();
  });

  test('envia el codigo AL CORREO NUEVO sin cambiar todavia el de la cuenta', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-1', correo: 'yo@x.com', nombre_completo: 'Yo' });
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    correoService.enviarCodigoCambioCorreo.mockResolvedValue();
    const r = await request(app).post('/api/medico/perfil/correo').set('Authorization', `Bearer ${TOKEN_VET}`).send({ correoNuevo: 'Nuevo@X.com' });
    expect(r.status).toBe(200);
    expect(correoService.enviarCodigoCambioCorreo).toHaveBeenCalledWith(expect.objectContaining({ correo: 'nuevo@x.com' }));
    expect(perfilModel.confirmarCambioCorreo).not.toHaveBeenCalled();
  });

  test('con codigo incorrecto no cambia el correo y suma un intento', async () => {
    perfilModel.buscarVerificacionCorreo.mockResolvedValue({
      correo_nuevo: 'nuevo@x.com',
      codigo_hash: await bcrypt.hash('123456', 4),
      intentos: 0,
      expira_en: new Date(Date.now() + 60000),
    });
    const r = await request(app).post('/api/medico/perfil/correo/confirmar').set('Authorization', `Bearer ${TOKEN_VET}`).send({ codigo: '000000' });
    expect(r.status).toBe(400);
    expect(perfilModel.incrementarIntentosCorreo).toHaveBeenCalledWith('vet-1');
    expect(perfilModel.confirmarCambioCorreo).not.toHaveBeenCalled();
  });

  test('con codigo vencido no cambia el correo', async () => {
    perfilModel.buscarVerificacionCorreo.mockResolvedValue({
      correo_nuevo: 'nuevo@x.com',
      codigo_hash: await bcrypt.hash('123456', 4),
      intentos: 0,
      expira_en: new Date(Date.now() - 1000),
    });
    const r = await request(app).post('/api/medico/perfil/correo/confirmar').set('Authorization', `Bearer ${TOKEN_VET}`).send({ codigo: '123456' });
    expect(r.status).toBe(400);
    expect(perfilModel.confirmarCambioCorreo).not.toHaveBeenCalled();
  });

  test('con el codigo correcto aplica el correo nuevo', async () => {
    perfilModel.buscarVerificacionCorreo.mockResolvedValue({
      correo_nuevo: 'nuevo@x.com',
      codigo_hash: await bcrypt.hash('123456', 4),
      intentos: 0,
      expira_en: new Date(Date.now() + 60000),
    });
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    const r = await request(app).post('/api/medico/perfil/correo/confirmar').set('Authorization', `Bearer ${TOKEN_VET}`).send({ codigo: '123456' });
    expect(r.status).toBe(200);
    expect(perfilModel.confirmarCambioCorreo).toHaveBeenCalledWith('vet-1', 'nuevo@x.com');
  });
});
