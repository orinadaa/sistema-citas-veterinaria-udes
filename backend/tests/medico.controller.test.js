// tests/medico.controller.test.js
// Endpoints propios del panel del medico veterinario (/api/medico).
jest.mock('../src/models/usuario.model');
jest.mock('../src/models/medico.model');
jest.mock('../src/models/pacienteMedico.model');
jest.mock('../src/models/mascota.model');
jest.mock('../src/models/cita.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const usuarioModel = require('../src/models/usuario.model');
const medicoModel = require('../src/models/medico.model');
const pacienteMedicoModel = require('../src/models/pacienteMedico.model');
const mascotaModel = require('../src/models/mascota.model');
const citaModel = require('../src/models/cita.model');

const TOKEN_VET = jwt.sign({ id: 'vet-1', rol: 'veterinario', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);

describe('GET /api/medico/clientes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('es exclusivo del veterinario', async () => {
    const respuesta = await request(app).get('/api/medico/clientes?busqueda=ana').set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(respuesta.status).toBe(403);
  });

  test('con menos de 2 caracteres no consulta la base', async () => {
    const respuesta = await request(app).get('/api/medico/clientes?busqueda=a').set('Authorization', `Bearer ${TOKEN_VET}`);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.clientes).toEqual([]);
    expect(usuarioModel.buscarClientes).not.toHaveBeenCalled();
  });

  test('busca clientes por el termino indicado', async () => {
    usuarioModel.buscarClientes.mockResolvedValue([{ id: 'c1', nombre_completo: 'Ana' }]);
    const respuesta = await request(app).get('/api/medico/clientes?busqueda=ana').set('Authorization', `Bearer ${TOKEN_VET}`);
    expect(respuesta.status).toBe(200);
    expect(usuarioModel.buscarClientes).toHaveBeenCalledWith('ana');
  });
});

describe('GET /api/medico/servicios', () => {
  test('lista los servicios del medico que inicio sesion', async () => {
    medicoModel.listarServiciosDeMedico.mockResolvedValue([{ id: 's1' }]);
    const respuesta = await request(app).get('/api/medico/servicios').set('Authorization', `Bearer ${TOKEN_VET}`);
    expect(respuesta.status).toBe(200);
    expect(medicoModel.listarServiciosDeMedico).toHaveBeenCalledWith('vet-1');
  });
});

describe('GET /api/medico/pacientes', () => {
  test('calcula los KPIs sobre todos sus pacientes', async () => {
    const filas = [
      { cliente_id: 'c1', mascota_id: 'm1', proxima_cita: '2030-01-01' },
      { cliente_id: 'c1', mascota_id: 'm2', proxima_cita: null },
      { cliente_id: 'c2', mascota_id: 'm3', proxima_cita: null },
    ];
    pacienteMedicoModel.listarPorMedico.mockResolvedValue(filas);
    pacienteMedicoModel.contarCitasPorCliente.mockResolvedValue([
      { cliente_id: 'c1', total: 4 },
      { cliente_id: 'c2', total: 1 },
    ]);
    const respuesta = await request(app).get('/api/medico/pacientes').set('Authorization', `Bearer ${TOKEN_VET}`);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.kpis).toEqual({ pacientes: 2, conCitasProximas: 1, frecuentes: 1, mascotas: 3 });
  });
});

describe('GET /api/medico/pacientes/:clienteId', () => {
  beforeEach(() => jest.clearAllMocks());

  test('responde 403 si el cliente no es paciente de este medico', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'c1', rol: 'cliente' });
    pacienteMedicoModel.esPacienteDe.mockResolvedValue(false);
    const respuesta = await request(app).get('/api/medico/pacientes/c1').set('Authorization', `Bearer ${TOKEN_VET}`);
    expect(respuesta.status).toBe(403);
  });

  test('devuelve solo las citas del cliente con este medico', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'c1', rol: 'cliente' });
    pacienteMedicoModel.esPacienteDe.mockResolvedValue(true);
    mascotaModel.listarPorCliente.mockResolvedValue([{ id: 'm1' }]);
    citaModel.listarPorCliente.mockResolvedValue([
      { id: 'a', medico_id: 'vet-1' },
      { id: 'b', medico_id: 'otro' },
    ]);
    const respuesta = await request(app).get('/api/medico/pacientes/c1').set('Authorization', `Bearer ${TOKEN_VET}`);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.citas.map((c) => c.id)).toEqual(['a']);
  });
});
