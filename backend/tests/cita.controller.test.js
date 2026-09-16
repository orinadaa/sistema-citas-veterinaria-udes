// tests/cita.controller.test.js
// RF-06 (agendar), RF-07 (disponibilidad), RF-08 (reprogramar),
// RF-09 (cancelar). Los modelos se mockean; horarioAtencion.js se deja
// real porque es logica pura (sin base de datos).

jest.mock('../src/models/cita.model');
jest.mock('../src/models/sede.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const citaModel = require('../src/models/cita.model');
const sedeModel = require('../src/models/sede.model');
const { generarFranjasDelDia } = require('../src/config/horarioAtencion');

const ID_CLIENTE = 'cliente-1';
const ID_SEDE = 'sede-1';
const TOKEN_CLIENTE = jwt.sign({ id: ID_CLIENTE, rol: 'cliente' }, process.env.JWT_SECRET);

function proximaFranjaValida(diasAdelante = 10) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasAdelante);
  let franjas = generarFranjasDelDia(fecha);
  while (franjas.length === 0) {
    fecha.setDate(fecha.getDate() + 1);
    franjas = generarFranjasDelDia(fecha);
  }
  return franjas[0];
}

describe('GET /api/citas/disponibilidad', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza sin sedeId o fecha', async () => {
    const respuesta = await request(app)
      .get('/api/citas/disponibilidad')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

    expect(respuesta.status).toBe(400);
  });

  test('responde 404 si la sede no existe', async () => {
    sedeModel.buscarPorId.mockResolvedValue(null);

    const respuesta = await request(app)
      .get('/api/citas/disponibilidad')
      .query({ sedeId: 'no-existe', fecha: '2030-01-07' })
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

    expect(respuesta.status).toBe(404);
  });

  test('marca como no disponible una franja ya ocupada', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE, nombre: 'Sede', ciudad: 'Bucaramanga' });
    const franja = proximaFranjaValida();
    citaModel.listarFranjasOcupadas.mockResolvedValue([franja]);

    const fechaTexto = franja.toISOString().slice(0, 10);
    const respuesta = await request(app)
      .get('/api/citas/disponibilidad')
      .query({ sedeId: ID_SEDE, fecha: fechaTexto })
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

    expect(respuesta.status).toBe(200);
    const franjaOcupada = respuesta.body.franjas.find((f) => f.horaInicio === franja.toISOString());
    expect(franjaOcupada.disponible).toBe(false);
  });
});

describe('POST /api/citas', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza si faltan campos obligatorios', async () => {
    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ sedeId: ID_SEDE });

    expect(respuesta.status).toBe(400);
  });

  test('responde 409 si la fecha esta en el pasado', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ sedeId: ID_SEDE, fechaHora: '2020-01-01T08:00:00', nombreMascota: 'Firulais' });

    expect(respuesta.status).toBe(409);
  });

  test('responde 409 si la hora no coincide con una franja valida', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    citaModel.listarFranjasOcupadas.mockResolvedValue([]);
    const franja = proximaFranjaValida();
    const fechaDesalineada = new Date(franja.getTime() + 5 * 60 * 1000); // +5 minutos

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ sedeId: ID_SEDE, fechaHora: fechaDesalineada.toISOString(), nombreMascota: 'Firulais' });

    expect(respuesta.status).toBe(409);
  });

  test('responde 409 si la franja ya esta ocupada', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    const franja = proximaFranjaValida();
    citaModel.listarFranjasOcupadas.mockResolvedValue([franja]);

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ sedeId: ID_SEDE, fechaHora: franja.toISOString(), nombreMascota: 'Firulais' });

    expect(respuesta.status).toBe(409);
  });

  test('agenda la cita correctamente', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    const franja = proximaFranjaValida();
    citaModel.listarFranjasOcupadas.mockResolvedValue([]);
    citaModel.crear.mockResolvedValue({
      id: 'cita-1',
      cliente_id: ID_CLIENTE,
      sede_id: ID_SEDE,
      fecha_hora: franja,
      nombre_mascota: 'Firulais',
      estado: 'agendada',
    });

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ sedeId: ID_SEDE, fechaHora: franja.toISOString(), nombreMascota: 'Firulais' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.cita.estado).toBe('agendada');
  });
});

describe('PATCH /api/citas/:id/reprogramar', () => {
  beforeEach(() => jest.clearAllMocks());

  test('responde 404 si la cita no existe', async () => {
    citaModel.buscarPorId.mockResolvedValue(null);

    const respuesta = await request(app)
      .patch('/api/citas/no-existe/reprogramar')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nuevaFechaHora: proximaFranjaValida().toISOString() });

    expect(respuesta.status).toBe(404);
  });

  test('responde 403 si la cita es de otro cliente', async () => {
    citaModel.buscarPorId.mockResolvedValue({
      id: 'cita-1',
      cliente_id: 'otro-cliente',
      sede_id: ID_SEDE,
      estado: 'agendada',
    });

    const respuesta = await request(app)
      .patch('/api/citas/cita-1/reprogramar')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nuevaFechaHora: proximaFranjaValida().toISOString() });

    expect(respuesta.status).toBe(403);
  });

  test('responde 400 si la cita ya esta cancelada', async () => {
    citaModel.buscarPorId.mockResolvedValue({
      id: 'cita-1',
      cliente_id: ID_CLIENTE,
      sede_id: ID_SEDE,
      estado: 'cancelada',
    });

    const respuesta = await request(app)
      .patch('/api/citas/cita-1/reprogramar')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nuevaFechaHora: proximaFranjaValida().toISOString() });

    expect(respuesta.status).toBe(400);
  });

  test('reprograma correctamente una cita propia y activa', async () => {
    const nuevaFranja = proximaFranjaValida(15);
    citaModel.buscarPorId.mockResolvedValue({
      id: 'cita-1',
      cliente_id: ID_CLIENTE,
      sede_id: ID_SEDE,
      estado: 'agendada',
    });
    citaModel.listarFranjasOcupadas.mockResolvedValue([]);
    citaModel.reprogramar.mockResolvedValue({
      id: 'cita-1',
      cliente_id: ID_CLIENTE,
      sede_id: ID_SEDE,
      fecha_hora: nuevaFranja,
      estado: 'agendada',
    });

    const respuesta = await request(app)
      .patch('/api/citas/cita-1/reprogramar')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nuevaFechaHora: nuevaFranja.toISOString() });

    expect(respuesta.status).toBe(200);
    expect(citaModel.reprogramar).toHaveBeenCalledWith('cita-1', nuevaFranja);
  });
});

describe('PATCH /api/citas/:id/cancelar', () => {
  beforeEach(() => jest.clearAllMocks());

  test('responde 403 si la cita es de otro cliente', async () => {
    citaModel.buscarPorId.mockResolvedValue({ id: 'cita-1', cliente_id: 'otro-cliente', estado: 'agendada' });

    const respuesta = await request(app)
      .patch('/api/citas/cita-1/cancelar')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

    expect(respuesta.status).toBe(403);
  });

  test('cancela correctamente una cita propia y activa', async () => {
    citaModel.buscarPorId.mockResolvedValue({ id: 'cita-1', cliente_id: ID_CLIENTE, estado: 'agendada' });
    citaModel.cancelar.mockResolvedValue({ id: 'cita-1', cliente_id: ID_CLIENTE, estado: 'cancelada' });

    const respuesta = await request(app)
      .patch('/api/citas/cita-1/cancelar')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.cita.estado).toBe('cancelada');
  });
});

describe('Control de acceso del modulo de citas', () => {
  test('un administrador no puede usar las rutas de citas (son exclusivas de cliente)', async () => {
    const tokenAdmin = jwt.sign({ id: 'admin-1', rol: 'administrador' }, process.env.JWT_SECRET);

    const respuesta = await request(app)
      .get('/api/citas/mias')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(403);
  });
});
