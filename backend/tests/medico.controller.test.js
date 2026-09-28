// tests/medico.controller.test.js
// Endpoints propios del panel del medico veterinario (/api/medico).
jest.mock('../src/models/usuario.model');
jest.mock('../src/models/medico.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const usuarioModel = require('../src/models/usuario.model');
const medicoModel = require('../src/models/medico.model');

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
