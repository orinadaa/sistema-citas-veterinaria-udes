// tests/mascota.controller.test.js
// El cliente gestiona sus propias mascotas; el administrador puede
// verlas/crearlas/editarlas para cualquier cliente (pantalla de
// Pacientes del panel administrativo).

jest.mock('../src/models/mascota.model');
jest.mock('../src/models/usuario.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const mascotaModel = require('../src/models/mascota.model');
const usuarioModel = require('../src/models/usuario.model');

const ID_CLIENTE = 'cliente-1';
const TOKEN_CLIENTE = jwt.sign({ id: ID_CLIENTE, rol: 'cliente' }, process.env.JWT_SECRET);
const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const TOKEN_VET = jwt.sign({ id: 'vet-1', rol: 'veterinario', sedeId: 'sede-1' }, process.env.JWT_SECRET);

describe('GET /api/mascotas/mias', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza a un administrador', async () => {
    const respuesta = await request(app)
      .get('/api/mascotas/mias')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(respuesta.status).toBe(403);
  });

  test('devuelve las mascotas del cliente autenticado', async () => {
    mascotaModel.listarPorCliente.mockResolvedValue([{ id: 'm1', nombre: 'Luna' }]);

    const respuesta = await request(app)
      .get('/api/mascotas/mias')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

    expect(respuesta.status).toBe(200);
    expect(mascotaModel.listarPorCliente).toHaveBeenCalledWith(ID_CLIENTE);
    expect(respuesta.body.mascotas).toHaveLength(1);
  });
});

describe('GET /api/mascotas?clienteId=...', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza a un cliente (solo administrador)', async () => {
    const respuesta = await request(app)
      .get('/api/mascotas')
      .query({ clienteId: ID_CLIENTE })
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(403);
  });

  test('rechaza sin clienteId', async () => {
    const respuesta = await request(app)
      .get('/api/mascotas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(respuesta.status).toBe(400);
  });

  test('devuelve las mascotas del cliente indicado', async () => {
    mascotaModel.listarPorCliente.mockResolvedValue([{ id: 'm1', nombre: 'Luna' }]);

    const respuesta = await request(app)
      .get('/api/mascotas')
      .query({ clienteId: ID_CLIENTE })
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mascotas).toHaveLength(1);
  });
});

describe('POST /api/mascotas', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza a un veterinario', async () => {
    const respuesta = await request(app)
      .post('/api/mascotas')
      .set('Authorization', `Bearer ${TOKEN_VET}`)
      .send({ nombre: 'Luna' });
    expect(respuesta.status).toBe(403);
  });

  test('rechaza sin nombre', async () => {
    const respuesta = await request(app)
      .post('/api/mascotas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({});
    expect(respuesta.status).toBe(400);
  });

  test('el cliente crea su propia mascota', async () => {
    mascotaModel.crear.mockResolvedValue({ id: 'm1', cliente_id: ID_CLIENTE, nombre: 'Luna' });

    const respuesta = await request(app)
      .post('/api/mascotas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nombre: 'Luna', especie: 'Perro' });

    expect(respuesta.status).toBe(201);
    expect(mascotaModel.crear).toHaveBeenCalledWith(expect.objectContaining({ clienteId: ID_CLIENTE, nombre: 'Luna' }));
  });

  test('el cliente crea su mascota con el perfil completo (fecha, sexo, color, peso, caracteristicas)', async () => {
    mascotaModel.crear.mockResolvedValue({ id: 'm1', cliente_id: ID_CLIENTE, nombre: 'Luna' });

    const respuesta = await request(app)
      .post('/api/mascotas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({
        nombre: 'Luna',
        especie: 'Canino',
        raza: 'Labrador',
        fechaNacimiento: '2022-05-01',
        sexo: 'hembra',
        color: 'Dorado',
        pesoKg: 24.5,
        caracteristicas: 'Muy juguetona',
      });

    expect(respuesta.status).toBe(201);
    expect(mascotaModel.crear).toHaveBeenCalledWith(
      expect.objectContaining({ sexo: 'hembra', color: 'Dorado', pesoKg: 24.5, caracteristicas: 'Muy juguetona' })
    );
  });

  test('rechaza un sexo invalido', async () => {
    const respuesta = await request(app)
      .post('/api/mascotas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nombre: 'Luna', sexo: 'otro' });

    expect(respuesta.status).toBe(400);
  });

  test('rechaza un peso invalido', async () => {
    const respuesta = await request(app)
      .post('/api/mascotas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nombre: 'Luna', pesoKg: -5 });

    expect(respuesta.status).toBe(400);
  });

  test('el administrador rechaza sin clienteId', async () => {
    const respuesta = await request(app)
      .post('/api/mascotas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombre: 'Luna' });
    expect(respuesta.status).toBe(400);
  });

  test('el administrador responde 404 si el clienteId no es un cliente', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: ID_CLIENTE, rol: 'veterinario' });

    const respuesta = await request(app)
      .post('/api/mascotas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombre: 'Luna', clienteId: ID_CLIENTE });

    expect(respuesta.status).toBe(404);
  });

  test('el administrador crea una mascota para el cliente indicado', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: ID_CLIENTE, rol: 'cliente' });
    mascotaModel.crear.mockResolvedValue({ id: 'm1', cliente_id: ID_CLIENTE, nombre: 'Luna' });

    const respuesta = await request(app)
      .post('/api/mascotas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombre: 'Luna', clienteId: ID_CLIENTE });

    expect(respuesta.status).toBe(201);
  });
});

describe('PUT /api/mascotas/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('responde 404 si la mascota no existe', async () => {
    mascotaModel.buscarPorId.mockResolvedValue(null);

    const respuesta = await request(app)
      .put('/api/mascotas/no-existe')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nombre: 'Luna' });

    expect(respuesta.status).toBe(404);
  });

  test('rechaza si el cliente intenta editar una mascota que no es suya', async () => {
    mascotaModel.buscarPorId.mockResolvedValue({ id: 'm1', cliente_id: 'otro-cliente' });

    const respuesta = await request(app)
      .put('/api/mascotas/m1')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nombre: 'Luna' });

    expect(respuesta.status).toBe(403);
  });

  test('el administrador puede editar cualquier mascota', async () => {
    mascotaModel.buscarPorId.mockResolvedValue({ id: 'm1', cliente_id: 'otro-cliente' });
    mascotaModel.actualizar.mockResolvedValue({ id: 'm1', nombre: 'Luna II' });

    const respuesta = await request(app)
      .put('/api/mascotas/m1')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombre: 'Luna II' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mascota.nombre).toBe('Luna II');
  });
});

describe('DELETE /api/mascotas/:id (baja logica)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('un administrador no puede eliminar mascotas (exclusivo del dueño)', async () => {
    const respuesta = await request(app).delete('/api/mascotas/m1').set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(respuesta.status).toBe(403);
  });

  test('responde 404 si la mascota no existe o ya fue eliminada', async () => {
    mascotaModel.buscarPorId.mockResolvedValue(null);
    const respuesta = await request(app).delete('/api/mascotas/m1').set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(404);
  });

  test('responde 403 si la mascota es de otro cliente', async () => {
    mascotaModel.buscarPorId.mockResolvedValue({ id: 'm1', cliente_id: 'otro', nombre: 'Rocky' });
    const respuesta = await request(app).delete('/api/mascotas/m1').set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(403);
    expect(mascotaModel.desactivar).not.toHaveBeenCalled();
  });

  test('responde 409 si la mascota tiene citas agendadas a futuro', async () => {
    mascotaModel.buscarPorId.mockResolvedValue({ id: 'm1', cliente_id: ID_CLIENTE, nombre: 'Rocky' });
    mascotaModel.contarCitasPendientes.mockResolvedValue(2);
    const respuesta = await request(app).delete('/api/mascotas/m1').set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(409);
    expect(mascotaModel.desactivar).not.toHaveBeenCalled();
  });

  test('desactiva la mascota propia sin citas pendientes', async () => {
    mascotaModel.buscarPorId.mockResolvedValue({ id: 'm1', cliente_id: ID_CLIENTE, nombre: 'Rocky' });
    mascotaModel.contarCitasPendientes.mockResolvedValue(0);
    mascotaModel.desactivar.mockResolvedValue({ id: 'm1' });
    const respuesta = await request(app).delete('/api/mascotas/m1').set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(200);
    expect(mascotaModel.desactivar).toHaveBeenCalledWith('m1');
  });
});
