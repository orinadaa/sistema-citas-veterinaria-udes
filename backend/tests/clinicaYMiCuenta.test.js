// tests/clinicaYMiCuenta.test.js
// RF-23 (informacion de la clinica: WhatsApp y redes) y "Mi cuenta" del
// administrador y del superadministrador (contraseña actual + codigo).

jest.mock('../src/config/db', () => ({ pool: { query: jest.fn() } }));
jest.mock('../src/models/usuario.model');
jest.mock('../src/models/perfilMedico.model');
jest.mock('../src/models/recuperacion.model');
jest.mock('../src/services/correo.service');

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const usuarioModel = require('../src/models/usuario.model');
const perfilModel = require('../src/models/perfilMedico.model');
const recuperacionModel = require('../src/models/recuperacion.model');
const correoService = require('../src/services/correo.service');
const { normalizarWhatsapp, normalizarRed } = require('../src/controllers/clinica.controller');

const firmar = (datos) => jwt.sign(datos, process.env.JWT_SECRET);
const SUPER = firmar({ id: 'su', rol: 'superadministrador' });
const ADMIN = firmar({ id: 'a1', rol: 'administrador', sedeId: 's1' });
const CLIENTE = firmar({ id: 'c1', rol: 'cliente' });
const con = (peticion, token) => peticion.set('Authorization', 'Bearer ' + token);
const FILA = { whatsapp_numero: '573227621383', whatsapp_activo: true, instagram_url: 'https://instagram.com/clinica', facebook_url: null, tiktok_url: null, youtube_url: null };

beforeEach(() => {
  jest.clearAllMocks();
  pool.query.mockResolvedValue({ rows: [FILA] });
});

describe('Normalizacion de los datos de la clinica', () => {
  test('WhatsApp: deja solo digitos y agrega el indicativo a un celular colombiano', () => {
    expect(normalizarWhatsapp('+57 322 762 1383')).toBe('573227621383');
    expect(normalizarWhatsapp('322-762-1383')).toBe('573227621383');
    expect(normalizarWhatsapp('12345')).toBeNull();
    expect(normalizarWhatsapp('no es un numero')).toBeNull();
  });

  test('redes: solo enlaces de su propio sitio, siempre https', () => {
    expect(normalizarRed('instagram.com/clinica', ['instagram.com'])).toBe('https://instagram.com/clinica');
    expect(normalizarRed('http://www.instagram.com/clinica', ['instagram.com'])).toBe('https://www.instagram.com/clinica');
    expect(normalizarRed('  ', ['instagram.com'])).toBe('');
    expect(normalizarRed('https://sitio-falso.com/instagram.com', ['instagram.com'])).toBeNull();
    expect(normalizarRed('javascript:alert(1)', ['instagram.com'])).toBeNull();
    expect(normalizarRed('https://instagram.com.malo.net/x', ['instagram.com'])).toBeNull();
  });
});

describe('/api/clinica (RF-23)', () => {
  test('cualquier visitante lee el WhatsApp y las redes', async () => {
    const respuesta = await request(app).get('/api/clinica');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.clinica).toMatchObject({ whatsappNumero: '573227621383', instagramUrl: 'https://instagram.com/clinica' });
  });

  test('con la burbuja apagada el numero no se publica', async () => {
    pool.query.mockResolvedValue({ rows: [{ ...FILA, whatsapp_activo: false }] });
    expect((await request(app).get('/api/clinica')).body.clinica.whatsappNumero).toBeNull();
    // ...pero el superadministrador si lo ve para poder editarlo.
    const admin = await con(request(app).get('/api/clinica/admin'), SUPER);
    expect(admin.body.clinica).toMatchObject({ whatsappNumero: '573227621383', whatsappActivo: false });
  });

  test('solo el superadministrador la cambia', async () => {
    expect((await con(request(app).put('/api/clinica'), ADMIN).send({ whatsappActivo: false })).status).toBe(403);
    expect((await con(request(app).put('/api/clinica'), CLIENTE).send({ whatsappActivo: false })).status).toBe(403);
    expect((await request(app).put('/api/clinica').send({ whatsappActivo: false })).status).toBe(401);
    expect((await con(request(app).get('/api/clinica/admin'), ADMIN)).status).toBe(403);
  });

  test('guarda el numero normalizado y las redes', async () => {
    const respuesta = await con(request(app).put('/api/clinica'), SUPER).send({ whatsappNumero: '+57 322 762 1383', facebookUrl: 'facebook.com/clinicaudes' });
    expect(respuesta.status).toBe(200);
    const guardado = pool.query.mock.calls.find(([sql]) => /INSERT INTO informacion_clinica/.test(sql));
    expect(guardado[1]).toEqual(['573227621383', 'https://facebook.com/clinicaudes']);
    expect(guardado[0]).toMatch(/whatsapp_numero, facebook_url/);
  });

  test('rechaza numero invalido, enlace de otro sitio, estado no booleano y peticion vacia', async () => {
    const enviar = (cuerpo) => con(request(app).put('/api/clinica'), SUPER).send(cuerpo);
    expect((await enviar({ whatsappNumero: '123' })).status).toBe(400);
    expect((await enviar({ instagramUrl: 'https://otro-sitio.com/perfil' })).status).toBe(400);
    expect((await enviar({ whatsappActivo: 'si' })).status).toBe(400);
    expect((await enviar({})).status).toBe(400);
    expect(pool.query.mock.calls.some(([sql]) => /INSERT INTO/.test(sql))).toBe(false);
  });

  test('no deja la burbuja encendida sin numero', async () => {
    const respuesta = await con(request(app).put('/api/clinica'), SUPER).send({ whatsappNumero: '' });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toMatch(/hace falta un número/);
  });
});

describe('/api/mi-cuenta (administrador y superadministrador)', () => {
  test('no es para clientes ni medicos', async () => {
    expect((await con(request(app).get('/api/mi-cuenta'), CLIENTE)).status).toBe(403);
    expect((await con(request(app).get('/api/mi-cuenta'), firmar({ id: 'm1', rol: 'veterinario' }))).status).toBe(403);
  });

  test('devuelve los datos basicos de la propia cuenta', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'a1', nombre_completo: 'Admin Uno', correo: 'admin@udes.edu.co', rol: 'administrador' });
    const respuesta = await con(request(app).get('/api/mi-cuenta'), ADMIN);
    expect(respuesta.body.cuenta).toMatchObject({ nombreCompleto: 'Admin Uno', correo: 'admin@udes.edu.co' });
  });

  test('solo envia el codigo si la contraseña actual es correcta', async () => {
    usuarioModel.buscarConHashPorId.mockResolvedValue({ id: 'a1', contrasena_hash: await bcrypt.hash('ClaveActual1', 4) });
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'a1', nombre_completo: 'Admin Uno', correo: 'admin@udes.edu.co' });
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue(null);
    correoService.enviarCodigoRecuperacion.mockResolvedValue();

    const mala = await con(request(app).post('/api/mi-cuenta/contrasena/codigo'), ADMIN).send({ contrasenaActual: 'OtraClave' });
    expect(mala.status).toBe(400);
    expect(correoService.enviarCodigoRecuperacion).not.toHaveBeenCalled();
    expect((await con(request(app).post('/api/mi-cuenta/contrasena/codigo'), ADMIN).send({})).status).toBe(400);

    const buena = await con(request(app).post('/api/mi-cuenta/contrasena/codigo'), ADMIN).send({ contrasenaActual: 'ClaveActual1' });
    expect(buena.status).toBe(200);
    expect(correoService.enviarCodigoRecuperacion).toHaveBeenCalledWith(expect.objectContaining({ correo: 'admin@udes.edu.co' }));
  });

  test('con el codigo correcto guarda la contraseña nueva; con uno incorrecto, no', async () => {
    const registro = { codigo_hash: await bcrypt.hash('123456', 4), intentos: 0, expira_en: new Date(Date.now() + 60000) };
    recuperacionModel.buscarPorUsuarioId.mockResolvedValue(registro);
    perfilModel.obtenerHashContrasena.mockResolvedValue(await bcrypt.hash('ClaveActual1', 4));
    expect((await con(request(app).put('/api/mi-cuenta/contrasena'), SUPER).send({ codigo: '000000', contrasenaNueva: 'ClaveNueva12' })).status).toBe(400);
    expect(usuarioModel.actualizarContrasena).not.toHaveBeenCalled();
    expect((await con(request(app).put('/api/mi-cuenta/contrasena'), SUPER).send({ codigo: '123456', contrasenaNueva: 'ClaveNueva12' })).status).toBe(200);
    expect(usuarioModel.actualizarContrasena).toHaveBeenCalledWith('su', expect.any(String));
  });
});
