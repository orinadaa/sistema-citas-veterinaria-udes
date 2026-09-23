// tests/reportes.controller.test.js
// Reportes agregados, solo lectura, exclusivo del administrador.

jest.mock('../src/models/reportes.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const reportesModel = require('../src/models/reportes.model');

const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const TOKEN_VET = jwt.sign({ id: 'vet-1', rol: 'veterinario', sedeId: 'sede-1' }, process.env.JWT_SECRET);

function mockearRespuestasVacias() {
  reportesModel.obtenerKpis.mockResolvedValue({
    citasMes: 0,
    citasMesAnterior: 0,
    serviciosActivos: 0,
    medicosActivos: 0,
    pacientesRegistrados: 0,
  });
  reportesModel.citasPorSemana.mockResolvedValue([]);
  reportesModel.rankingServicios.mockResolvedValue([]);
  reportesModel.citasPorSede.mockResolvedValue([]);
  reportesModel.estadoCitas.mockResolvedValue([]);
  reportesModel.ultimasCitas.mockResolvedValue([]);
}

describe('GET /api/administracion/reportes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza a un veterinario', async () => {
    const respuesta = await request(app)
      .get('/api/administracion/reportes')
      .set('Authorization', `Bearer ${TOKEN_VET}`);
    expect(respuesta.status).toBe(403);
  });

  test('rechaza si desde es posterior a hasta', async () => {
    const respuesta = await request(app)
      .get('/api/administracion/reportes')
      .query({ desde: '2030-02-01', hasta: '2030-01-01' })
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(respuesta.status).toBe(400);
  });

  test('devuelve el reporte con rango por defecto cuando no se indica', async () => {
    mockearRespuestasVacias();

    const respuesta = await request(app)
      .get('/api/administracion/reportes')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveProperty('kpis');
    expect(respuesta.body).toHaveProperty('citasPorSemana');
    expect(respuesta.body).toHaveProperty('rankingServicios');
    expect(respuesta.body).toHaveProperty('citasPorSede');
    expect(respuesta.body).toHaveProperty('estadoCitas');
    expect(respuesta.body).toHaveProperty('ultimasCitas');
  });

  test('pasa el sedeId indicado a los modelos que lo aceptan', async () => {
    mockearRespuestasVacias();

    const respuesta = await request(app)
      .get('/api/administracion/reportes')
      .query({ sedeId: 'sede-2' })
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(200);
    expect(reportesModel.obtenerKpis).toHaveBeenCalledWith('sede-2');
    expect(reportesModel.rankingServicios).toHaveBeenCalledWith('sede-2', expect.any(Date), expect.any(Date));
  });
});
