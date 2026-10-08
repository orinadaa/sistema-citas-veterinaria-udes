// tests/servicioFoto.test.js
// Foto de cada servicio (la que se muestra en la seccion Servicios de la
// pagina publica): la sube, encuadra, describe y quita el administrador.

jest.mock('../src/models/servicio.model');
jest.mock('../src/models/categoriaServicio.model');

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const servicioModel = require('../src/models/servicio.model');

const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const TOKEN_VET = jwt.sign({ id: 'vet-1', rol: 'veterinario', sedeId: 'sede-1' }, process.env.JWT_SECRET);

const ID_SERVICIO = '33333333-3333-4333-8333-333333333333';
const CARPETA = path.join(__dirname, '..', 'uploads', 'servicios');
// PNG valido de 1x1 pixel
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

let archivosAntes;

function listar() {
  return fs.existsSync(CARPETA) ? fs.readdirSync(CARPETA) : [];
}

function archivosNuevos() {
  return listar().filter((f) => !archivosAntes.has(f));
}

beforeEach(() => {
  jest.clearAllMocks();
  archivosAntes = new Set(listar());
});

// Ninguna prueba debe dejar archivos en uploads/.
afterEach(() => {
  archivosNuevos().forEach((f) => fs.unlinkSync(path.join(CARPETA, f)));
});

function subir(token, { id = ID_SERVICIO, contenido = PNG, tipo = 'image/png', fondoClaro } = {}) {
  const peticion = request(app).post(`/api/servicios/${id}/foto`).set('Authorization', `Bearer ${token}`);
  if (fondoClaro !== undefined) peticion.field('fondoClaro', fondoClaro);
  return peticion.attach('foto', contenido, { filename: 'foto.png', contentType: tipo });
}

describe('GET /api/servicios', () => {
  test('el catalogo publico trae la foto, su descripcion y su encuadre', async () => {
    servicioModel.listarTodos.mockResolvedValue([
      { id: ID_SERVICIO, nombre: 'Vacunación', foto_url: '/uploads/servicios/a.jpg', foto_descripcion: 'Vacuna', foto_foco_x: 40, foto_foco_y: 35, foto_fondo_claro: true },
    ]);
    const respuesta = await request(app).get('/api/servicios');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.servicios[0]).toMatchObject({ foto_url: '/uploads/servicios/a.jpg', foto_foco_x: 40, foto_foco_y: 35 });
  });
});

describe('POST /api/servicios/:id/foto', () => {
  test('rechaza a un veterinario', async () => {
    const respuesta = await subir(TOKEN_VET);
    expect(respuesta.status).toBe(403);
    expect(servicioModel.actualizarFoto).not.toHaveBeenCalled();
  });

  test('rechaza un archivo que no es JPG/PNG', async () => {
    const respuesta = await subir(TOKEN_ADMIN, { contenido: Buffer.from('hola'), tipo: 'text/plain' });
    expect(respuesta.status).toBe(400);
    expect(servicioModel.actualizarFoto).not.toHaveBeenCalled();
  });

  test('rechaza si no se adjunta archivo', async () => {
    const respuesta = await request(app)
      .post(`/api/servicios/${ID_SERVICIO}/foto`)
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(respuesta.status).toBe(400);
  });

  test('responde 404 si el servicio no existe y no deja el archivo en disco', async () => {
    servicioModel.actualizarFoto.mockResolvedValue(undefined);
    const respuesta = await subir(TOKEN_ADMIN);
    expect(respuesta.status).toBe(404);
    expect(archivosNuevos()).toHaveLength(0);
  });

  test('responde 404 con un id que no es UUID, sin consultar la base', async () => {
    const respuesta = await subir(TOKEN_ADMIN, { id: 'no-es-un-id' });
    expect(respuesta.status).toBe(404);
    expect(servicioModel.actualizarFoto).not.toHaveBeenCalled();
    expect(archivosNuevos()).toHaveLength(0);
  });

  test('guarda la ruta publica de la foto y devuelve el servicio', async () => {
    servicioModel.actualizarFoto.mockResolvedValue(null);
    servicioModel.buscarPorId.mockImplementation((id) => ({ id, nombre: 'Vacunación' }));
    const respuesta = await subir(TOKEN_ADMIN, { fondoClaro: 'false' });
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.servicio.id).toBe(ID_SERVICIO);
    const [id, datos] = servicioModel.actualizarFoto.mock.calls[0];
    expect(id).toBe(ID_SERVICIO);
    expect(datos.fotoUrl).toMatch(/^\/uploads\/servicios\/[0-9a-f-]+\.png$/);
    expect(datos.fondoClaro).toBe(false);
    expect(archivosNuevos()).toHaveLength(1);
  });

  test('sin indicar el fondo, la foto se trata como clara (se oscurece mas)', async () => {
    servicioModel.actualizarFoto.mockResolvedValue(null);
    servicioModel.buscarPorId.mockResolvedValue({ id: ID_SERVICIO });
    await subir(TOKEN_ADMIN);
    expect(servicioModel.actualizarFoto.mock.calls[0][1].fondoClaro).toBe(true);
  });

  test('al cambiar la foto borra el archivo anterior', async () => {
    fs.mkdirSync(CARPETA, { recursive: true });
    fs.writeFileSync(path.join(CARPETA, 'anterior-prueba.png'), PNG);
    servicioModel.actualizarFoto.mockResolvedValue('/uploads/servicios/anterior-prueba.png');
    servicioModel.buscarPorId.mockResolvedValue({ id: ID_SERVICIO });
    const respuesta = await subir(TOKEN_ADMIN);
    expect(respuesta.status).toBe(200);
    expect(fs.existsSync(path.join(CARPETA, 'anterior-prueba.png'))).toBe(false);
  });
});

describe('DELETE /api/servicios/:id/foto', () => {
  function quitar(token, id = ID_SERVICIO) {
    return request(app).delete(`/api/servicios/${id}/foto`).set('Authorization', `Bearer ${token}`);
  }

  test('rechaza a un veterinario', async () => {
    const respuesta = await quitar(TOKEN_VET);
    expect(respuesta.status).toBe(403);
  });

  test('responde 404 si el servicio no existe', async () => {
    servicioModel.actualizarFoto.mockResolvedValue(undefined);
    const respuesta = await quitar(TOKEN_ADMIN);
    expect(respuesta.status).toBe(404);
  });

  test('quita la foto y borra su archivo', async () => {
    fs.mkdirSync(CARPETA, { recursive: true });
    fs.writeFileSync(path.join(CARPETA, 'quitar-prueba.png'), PNG);
    servicioModel.actualizarFoto.mockResolvedValue('/uploads/servicios/quitar-prueba.png');
    servicioModel.buscarPorId.mockResolvedValue({ id: ID_SERVICIO, foto_url: null });
    const respuesta = await quitar(TOKEN_ADMIN);
    expect(respuesta.status).toBe(200);
    expect(servicioModel.actualizarFoto).toHaveBeenCalledWith(ID_SERVICIO, { fotoUrl: null });
    expect(fs.existsSync(path.join(CARPETA, 'quitar-prueba.png'))).toBe(false);
  });
});

describe('PUT /api/servicios/:id (datos de la foto)', () => {
  function editar(cuerpo) {
    return request(app).put(`/api/servicios/${ID_SERVICIO}`).set('Authorization', `Bearer ${TOKEN_ADMIN}`).send(cuerpo);
  }

  test('rechaza un encuadre fuera de 0-100', async () => {
    const respuesta = await editar({ fotoFocoX: -5, fotoFocoY: 50 });
    expect(respuesta.status).toBe(400);
    expect(servicioModel.actualizar).not.toHaveBeenCalled();
  });

  test('rechaza una descripcion de foto de mas de 200 caracteres', async () => {
    const respuesta = await editar({ fotoDescripcion: 'a'.repeat(201) });
    expect(respuesta.status).toBe(400);
  });

  test('guarda descripcion y encuadre de la foto', async () => {
    servicioModel.actualizar.mockResolvedValue({ id: ID_SERVICIO });
    const respuesta = await editar({ fotoDescripcion: '  Perro en consulta ', fotoFocoX: 30.6, fotoFocoY: 70 });
    expect(respuesta.status).toBe(200);
    expect(servicioModel.actualizar).toHaveBeenCalledWith(
      ID_SERVICIO,
      expect.objectContaining({ fotoDescripcion: 'Perro en consulta', fotoFocoX: 31, fotoFocoY: 70 })
    );
  });
});
