// tests/fotosAdmin.test.js
// Fotos que el administrador sube como archivo (antes eran un enlace
// escrito a mano): foto de la sede y foto del medico.

jest.mock('../src/models/sede.model');
jest.mock('../src/models/usuario.model');
jest.mock('../src/models/perfilMedico.model');
jest.mock('../src/models/medico.model');

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const sedeModel = require('../src/models/sede.model');
const usuarioModel = require('../src/models/usuario.model');
const perfilMedicoModel = require('../src/models/perfilMedico.model');
const medicoModel = require('../src/models/medico.model');

const ID_SEDE = 'sede-1';
const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: ID_SEDE }, process.env.JWT_SECRET);
const TOKEN_SUPER = jwt.sign({ id: 'super-1', rol: 'superadministrador' }, process.env.JWT_SECRET);
const TOKEN_VET = jwt.sign({ id: 'vet-1', rol: 'veterinario', sedeId: ID_SEDE }, process.env.JWT_SECRET);

const UPLOADS = path.join(__dirname, '..', 'uploads');
const CARPETAS = [path.join(UPLOADS, 'sedes'), path.join(UPLOADS, 'usuarios')];
// PNG valido de 1x1 pixel
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

let archivosAntes;

function listar(carpeta) {
  return fs.existsSync(carpeta) ? fs.readdirSync(carpeta) : [];
}

function archivosNuevos() {
  return CARPETAS.flatMap((carpeta, i) => listar(carpeta).filter((f) => !archivosAntes[i].has(f)));
}

beforeEach(() => {
  jest.clearAllMocks();
  archivosAntes = CARPETAS.map((carpeta) => new Set(listar(carpeta)));
});

// Ninguna prueba debe dejar archivos en uploads/.
afterEach(() => {
  CARPETAS.forEach((carpeta, i) =>
    listar(carpeta)
      .filter((f) => !archivosAntes[i].has(f))
      .forEach((f) => fs.unlinkSync(path.join(carpeta, f)))
  );
});

function subir(ruta, token, contenido = PNG, tipo = 'image/png') {
  return request(app)
    .post(ruta)
    .set('Authorization', `Bearer ${token}`)
    .attach('foto', contenido, { filename: 'foto.png', contentType: tipo });
}

describe('POST /api/sedes/:id/foto', () => {
  test('rechaza a un veterinario', async () => {
    const respuesta = await subir('/api/sedes/s1/foto', TOKEN_VET);
    expect(respuesta.status).toBe(403);
    expect(sedeModel.actualizarFoto).not.toHaveBeenCalled();
  });

  test('rechaza un archivo que no es JPG/PNG', async () => {
    const respuesta = await subir('/api/sedes/s1/foto', TOKEN_SUPER, Buffer.from('hola'), 'text/plain');
    expect(respuesta.status).toBe(400);
    expect(sedeModel.actualizarFoto).not.toHaveBeenCalled();
  });

  test('rechaza si no se adjunta archivo', async () => {
    const respuesta = await request(app).post('/api/sedes/s1/foto').set('Authorization', `Bearer ${TOKEN_SUPER}`);
    expect(respuesta.status).toBe(400);
  });

  test('responde 404 si la sede no existe y no deja el archivo en disco', async () => {
    sedeModel.actualizarFoto.mockResolvedValue(undefined);
    const respuesta = await subir('/api/sedes/s1/foto', TOKEN_SUPER);
    expect(respuesta.status).toBe(404);
    expect(archivosNuevos()).toHaveLength(0);
  });

  test('guarda la ruta publica de la foto de la sede', async () => {
    sedeModel.actualizarFoto.mockResolvedValue(null);
    const respuesta = await subir('/api/sedes/s1/foto', TOKEN_SUPER);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.fotoUrl).toMatch(/^\/uploads\/sedes\/[0-9a-f-]+\.png$/);
    expect(sedeModel.actualizarFoto).toHaveBeenCalledWith('s1', respuesta.body.fotoUrl);
  });

  test('al cambiar la foto borra el archivo anterior', async () => {
    fs.mkdirSync(CARPETAS[0], { recursive: true });
    fs.writeFileSync(path.join(CARPETAS[0], 'anterior-prueba.png'), PNG);
    sedeModel.actualizarFoto.mockResolvedValue('/uploads/sedes/anterior-prueba.png');
    const respuesta = await subir('/api/sedes/s1/foto', TOKEN_SUPER);
    expect(respuesta.status).toBe(200);
    expect(fs.existsSync(path.join(CARPETAS[0], 'anterior-prueba.png'))).toBe(false);
  });

  test('una foto anterior que era un enlace externo no intenta borrarse', async () => {
    sedeModel.actualizarFoto.mockResolvedValue('https://ejemplo.com/sede.jpg');
    const respuesta = await subir('/api/sedes/s1/foto', TOKEN_SUPER);
    expect(respuesta.status).toBe(200);
  });
});

describe('PUT /api/sedes/:id', () => {
  test('ya no acepta un enlace de foto escrito a mano', async () => {
    sedeModel.actualizar.mockResolvedValue({ id: 's1', nombre: 'Sede' });
    const respuesta = await request(app)
      .put('/api/sedes/s1')
      .set('Authorization', `Bearer ${TOKEN_SUPER}`)
      .send({ nombre: 'Sede', fotoUrl: 'https://ejemplo.com/sede.jpg' });
    expect(respuesta.status).toBe(200);
    expect(sedeModel.actualizar.mock.calls[0][1]).not.toHaveProperty('fotoUrl');
  });
});

describe('POST /api/administracion/medicos/:id/foto', () => {
  const RUTA = '/api/administracion/medicos/vet-9/foto';

  test('rechaza a un veterinario', async () => {
    const respuesta = await subir(RUTA, TOKEN_VET);
    expect(respuesta.status).toBe(403);
    expect(perfilMedicoModel.actualizarFoto).not.toHaveBeenCalled();
  });

  test('responde 404 si el usuario no es un medico y no deja el archivo en disco', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-9', rol: 'cliente' });
    const respuesta = await subir(RUTA, TOKEN_ADMIN);
    expect(respuesta.status).toBe(404);
    expect(archivosNuevos()).toHaveLength(0);
  });

  test('responde 403 si el medico es de otra sede y no deja el archivo en disco', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-9', rol: 'veterinario', sede_id: 'otra-sede' });
    const respuesta = await subir(RUTA, TOKEN_ADMIN);
    expect(respuesta.status).toBe(403);
    expect(perfilMedicoModel.actualizarFoto).not.toHaveBeenCalled();
    expect(archivosNuevos()).toHaveLength(0);
  });

  test('guarda la ruta publica de la foto del medico', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-9', rol: 'veterinario', sede_id: ID_SEDE });
    perfilMedicoModel.actualizarFoto.mockResolvedValue(null);
    const respuesta = await subir(RUTA, TOKEN_ADMIN);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.fotoUrl).toMatch(/^\/uploads\/usuarios\/[0-9a-f-]+\.png$/);
    expect(perfilMedicoModel.actualizarFoto).toHaveBeenCalledWith('vet-9', respuesta.body.fotoUrl);
  });
});

describe('PUT /api/administracion/medicos/:id', () => {
  test('ya no acepta un enlace de foto escrito a mano', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-9', rol: 'veterinario', sede_id: ID_SEDE });
    medicoModel.listarConServicios.mockResolvedValue([{ id: 'vet-9' }]);
    const respuesta = await request(app)
      .put('/api/administracion/medicos/vet-9')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombreCompleto: 'Ana', fotoUrl: 'https://ejemplo.com/ana.jpg' });
    expect(respuesta.status).toBe(200);
    expect(medicoModel.actualizar.mock.calls[0][1]).not.toHaveProperty('fotoUrl');
  });
});
