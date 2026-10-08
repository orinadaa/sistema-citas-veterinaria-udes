// tests/galeria.controller.test.js
// Galeria del inicio (fotos del Hero): lectura publica; subir, editar,
// ordenar y eliminar solo el administrador.

jest.mock('../src/models/galeria.model');

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const galeriaModel = require('../src/models/galeria.model');

const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'superadministrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const TOKEN_VET = jwt.sign({ id: 'vet-1', rol: 'veterinario', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const TOKEN_CLIENTE = jwt.sign({ id: 'cliente-1', rol: 'cliente' }, process.env.JWT_SECRET);

const ID_FOTO = '11111111-1111-4111-8111-111111111111';
const ID_FOTO_2 = '22222222-2222-4222-8222-222222222222';
const CARPETA = path.join(__dirname, '..', 'uploads', 'galeria');
// PNG valido de 1x1 pixel
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

let archivosAntes;

beforeEach(() => {
  jest.clearAllMocks();
  archivosAntes = new Set(fs.existsSync(CARPETA) ? fs.readdirSync(CARPETA) : []);
});

// Ninguna prueba debe dejar archivos en uploads/ (ni los rechazados ni
// el del caso exitoso, cuyo modelo esta mockeado).
afterEach(() => {
  if (!fs.existsSync(CARPETA)) return;
  fs.readdirSync(CARPETA)
    .filter((f) => !archivosAntes.has(f))
    .forEach((f) => fs.unlinkSync(path.join(CARPETA, f)));
});

function archivosNuevos() {
  return fs.existsSync(CARPETA) ? fs.readdirSync(CARPETA).filter((f) => !archivosAntes.has(f)) : [];
}

describe('GET /api/galeria', () => {
  test('es publico y devuelve solo las fotos visibles', async () => {
    galeriaModel.listarVisibles.mockResolvedValue([{ id: ID_FOTO, foto_url: '/uploads/galeria/a.jpg', activo: true }]);
    const respuesta = await request(app).get('/api/galeria');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.fotos).toHaveLength(1);
    expect(galeriaModel.listarTodas).not.toHaveBeenCalled();
  });
});

describe('GET /api/galeria/admin', () => {
  test('rechaza sin token', async () => {
    const respuesta = await request(app).get('/api/galeria/admin');
    expect(respuesta.status).toBe(401);
  });

  test('rechaza a un veterinario y a un cliente', async () => {
    for (const token of [TOKEN_VET, TOKEN_CLIENTE]) {
      const respuesta = await request(app).get('/api/galeria/admin').set('Authorization', `Bearer ${token}`);
      expect(respuesta.status).toBe(403);
    }
  });

  test('el administrador ve todas (tambien las ocultas) y el tope de fotos', async () => {
    galeriaModel.listarTodas.mockResolvedValue([{ id: ID_FOTO, activo: false }]);
    const respuesta = await request(app).get('/api/galeria/admin').set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.fotos).toHaveLength(1);
    expect(respuesta.body.maximo).toBe(12);
  });
});

describe('POST /api/galeria', () => {
  function subir(token, { descripcion = 'Equipo de la clínica', contenido = PNG, tipo = 'image/png' } = {}) {
    const peticion = request(app).post('/api/galeria').set('Authorization', `Bearer ${token}`);
    if (descripcion !== null) peticion.field('descripcion', descripcion);
    return peticion.attach('foto', contenido, { filename: 'foto.png', contentType: tipo });
  }

  test('rechaza a un cliente', async () => {
    const respuesta = await subir(TOKEN_CLIENTE);
    expect(respuesta.status).toBe(403);
    expect(galeriaModel.crear).not.toHaveBeenCalled();
  });

  test('rechaza un archivo que no es JPG/PNG', async () => {
    const respuesta = await subir(TOKEN_ADMIN, { contenido: Buffer.from('hola'), tipo: 'text/plain' });
    expect(respuesta.status).toBe(400);
    expect(galeriaModel.crear).not.toHaveBeenCalled();
  });

  test('rechaza si no se adjunta archivo', async () => {
    const respuesta = await request(app)
      .post('/api/galeria')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .field('descripcion', 'Sin foto');
    expect(respuesta.status).toBe(400);
  });

  test('exige la descripcion y no deja el archivo en disco', async () => {
    galeriaModel.contar.mockResolvedValue(0);
    const respuesta = await subir(TOKEN_ADMIN, { descripcion: '   ' });
    expect(respuesta.status).toBe(400);
    expect(galeriaModel.crear).not.toHaveBeenCalled();
    expect(archivosNuevos()).toHaveLength(0);
  });

  test('rechaza cuando la galeria ya esta llena y no deja el archivo en disco', async () => {
    galeriaModel.contar.mockResolvedValue(12);
    const respuesta = await subir(TOKEN_ADMIN);
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toMatch(/máximo 12/);
    expect(galeriaModel.crear).not.toHaveBeenCalled();
    expect(archivosNuevos()).toHaveLength(0);
  });

  test('guarda la foto con su ruta publica y su descripcion', async () => {
    galeriaModel.contar.mockResolvedValue(5);
    galeriaModel.crear.mockImplementation(({ fotoUrl, descripcion }) => ({ id: ID_FOTO, foto_url: fotoUrl, descripcion }));
    const respuesta = await subir(TOKEN_ADMIN, { descripcion: '  Equipo de la clínica  ' });
    expect(respuesta.status).toBe(201);
    expect(respuesta.body.foto.foto_url).toMatch(/^\/uploads\/galeria\/[0-9a-f-]+\.png$/);
    expect(respuesta.body.foto.descripcion).toBe('Equipo de la clínica');
    expect(archivosNuevos()).toHaveLength(1);
  });
});

describe('PUT /api/galeria/:id', () => {
  function editar(cuerpo, id = ID_FOTO, token = TOKEN_ADMIN) {
    return request(app).put(`/api/galeria/${id}`).set('Authorization', `Bearer ${token}`).send(cuerpo);
  }

  test('rechaza a un veterinario', async () => {
    const respuesta = await editar({ activo: false }, ID_FOTO, TOKEN_VET);
    expect(respuesta.status).toBe(403);
  });

  test('responde 404 con un id que no es UUID, sin consultar la base', async () => {
    const respuesta = await editar({ activo: false }, 'no-es-un-id');
    expect(respuesta.status).toBe(404);
    expect(galeriaModel.actualizar).not.toHaveBeenCalled();
  });

  test('rechaza un encuadre fuera de 0-100', async () => {
    const respuesta = await editar({ focoX: 140, focoY: 50 });
    expect(respuesta.status).toBe(400);
    expect(galeriaModel.actualizar).not.toHaveBeenCalled();
  });

  test('rechaza una descripcion vacia', async () => {
    const respuesta = await editar({ descripcion: '' });
    expect(respuesta.status).toBe(400);
  });

  test('responde 404 si la foto no existe', async () => {
    galeriaModel.actualizar.mockResolvedValue(null);
    const respuesta = await editar({ activo: false });
    expect(respuesta.status).toBe(404);
  });

  test('actualiza descripcion, encuadre y visibilidad', async () => {
    galeriaModel.actualizar.mockResolvedValue({ id: ID_FOTO, activo: false });
    const respuesta = await editar({ descripcion: ' Quirófano ', focoX: 30.4, focoY: 70, activo: false });
    expect(respuesta.status).toBe(200);
    expect(galeriaModel.actualizar).toHaveBeenCalledWith(ID_FOTO, {
      descripcion: 'Quirófano',
      focoX: 30,
      focoY: 70,
      activo: false,
    });
  });
});

describe('PUT /api/galeria/orden', () => {
  test('rechaza una lista vacia o con ids invalidos', async () => {
    for (const ids of [[], ['x'], undefined]) {
      const respuesta = await request(app)
        .put('/api/galeria/orden')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send({ ids });
      expect(respuesta.status).toBe(400);
    }
    expect(galeriaModel.reordenar).not.toHaveBeenCalled();
  });

  test('guarda el nuevo orden y devuelve la galeria', async () => {
    galeriaModel.listarTodas.mockResolvedValue([{ id: ID_FOTO_2 }, { id: ID_FOTO }]);
    const respuesta = await request(app)
      .put('/api/galeria/orden')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ ids: [ID_FOTO_2, ID_FOTO] });
    expect(respuesta.status).toBe(200);
    expect(galeriaModel.reordenar).toHaveBeenCalledWith([ID_FOTO_2, ID_FOTO]);
    expect(respuesta.body.fotos.map((f) => f.id)).toEqual([ID_FOTO_2, ID_FOTO]);
  });
});

describe('DELETE /api/galeria/:id', () => {
  test('rechaza a un cliente', async () => {
    const respuesta = await request(app).delete(`/api/galeria/${ID_FOTO}`).set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(403);
    expect(galeriaModel.eliminar).not.toHaveBeenCalled();
  });

  test('responde 404 si la foto no existe', async () => {
    galeriaModel.eliminar.mockResolvedValue(null);
    const respuesta = await request(app).delete(`/api/galeria/${ID_FOTO}`).set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(respuesta.status).toBe(404);
  });

  test('elimina la foto y borra su archivo del disco', async () => {
    fs.mkdirSync(CARPETA, { recursive: true });
    fs.writeFileSync(path.join(CARPETA, 'prueba-eliminar.png'), PNG);
    galeriaModel.eliminar.mockResolvedValue({ id: ID_FOTO, foto_url: '/uploads/galeria/prueba-eliminar.png' });
    const respuesta = await request(app).delete(`/api/galeria/${ID_FOTO}`).set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(respuesta.status).toBe(200);
    expect(fs.existsSync(path.join(CARPETA, 'prueba-eliminar.png'))).toBe(false);
  });
});
