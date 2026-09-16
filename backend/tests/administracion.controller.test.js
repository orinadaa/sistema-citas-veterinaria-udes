// tests/administracion.controller.test.js
// RF-10/RF-11 (medicos y especialidades por sede), RF-12 (seguimiento
// de citas).

jest.mock('../src/models/medico.model');
jest.mock('../src/models/servicio.model');
jest.mock('../src/models/cita.model');
jest.mock('../src/models/usuario.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const medicoModel = require('../src/models/medico.model');
const servicioModel = require('../src/models/servicio.model');
const citaModel = require('../src/models/cita.model');
const usuarioModel = require('../src/models/usuario.model');

const ID_SEDE = 'sede-1';
const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: ID_SEDE }, process.env.JWT_SECRET);
const TOKEN_VET = jwt.sign({ id: 'vet-1', rol: 'veterinario', sedeId: ID_SEDE }, process.env.JWT_SECRET);
const TOKEN_CLIENTE = jwt.sign({ id: 'cliente-1', rol: 'cliente' }, process.env.JWT_SECRET);

describe('GET /api/administracion/medicos', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza a un veterinario (solo administrador)', async () => {
    const respuesta = await request(app)
      .get('/api/administracion/medicos')
      .set('Authorization', `Bearer ${TOKEN_VET}`);
    expect(respuesta.status).toBe(403);
  });

  test('lista los medicos de la sede del administrador', async () => {
    medicoModel.listarConServicios.mockResolvedValue([
      { id: 'vet-1', nombre_completo: 'Dra. Ejemplo', servicios: [{ id: 's1', nombre: 'Consulta médica' }] },
    ]);

    const respuesta = await request(app)
      .get('/api/administracion/medicos')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(200);
    expect(medicoModel.listarConServicios).toHaveBeenCalledWith(ID_SEDE);
    expect(respuesta.body.medicos).toHaveLength(1);
  });
});

describe('PUT /api/administracion/medicos/:id/servicios', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza si servicioIds no es una lista', async () => {
    const respuesta = await request(app)
      .put('/api/administracion/medicos/vet-1/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ servicioIds: 'no-es-lista' });

    expect(respuesta.status).toBe(400);
  });

  test('responde 404 si el medico no existe', async () => {
    usuarioModel.buscarPorId.mockResolvedValue(null);

    const respuesta = await request(app)
      .put('/api/administracion/medicos/no-existe/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ servicioIds: [] });

    expect(respuesta.status).toBe(404);
  });

  test('responde 403 si el medico es de otra sede', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-2', rol: 'veterinario', sede_id: 'otra-sede' });

    const respuesta = await request(app)
      .put('/api/administracion/medicos/vet-2/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ servicioIds: [] });

    expect(respuesta.status).toBe(403);
  });

  test('actualiza las especialidades correctamente', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-1', rol: 'veterinario', sede_id: ID_SEDE });
    servicioModel.buscarPorId.mockResolvedValue({ id: 's1', nombre: 'Consulta médica' });
    medicoModel.reemplazarServicios.mockResolvedValue();
    medicoModel.listarConServicios.mockResolvedValue([
      { id: 'vet-1', nombre_completo: 'Dra. Ejemplo', servicios: [{ id: 's1', nombre: 'Consulta médica' }] },
    ]);

    const respuesta = await request(app)
      .put('/api/administracion/medicos/vet-1/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ servicioIds: ['s1'] });

    expect(respuesta.status).toBe(200);
    expect(medicoModel.reemplazarServicios).toHaveBeenCalledWith('vet-1', ['s1']);
  });
});

describe('GET /api/administracion/citas', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza a un cliente', async () => {
    const respuesta = await request(app)
      .get('/api/administracion/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(403);
  });

  test('el administrador ve las citas de su sede', async () => {
    citaModel.listarPorSede.mockResolvedValue([{ id: 'cita-1' }]);

    const respuesta = await request(app)
      .get('/api/administracion/citas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(200);
    expect(citaModel.listarPorSede).toHaveBeenCalledWith(ID_SEDE);
    expect(respuesta.body.citas).toHaveLength(1);
  });

  test('el veterinario ve solo sus propias citas', async () => {
    citaModel.listarPorMedico.mockResolvedValue([{ id: 'cita-2' }]);

    const respuesta = await request(app)
      .get('/api/administracion/citas')
      .set('Authorization', `Bearer ${TOKEN_VET}`);

    expect(respuesta.status).toBe(200);
    expect(citaModel.listarPorMedico).toHaveBeenCalledWith('vet-1');
  });
});
