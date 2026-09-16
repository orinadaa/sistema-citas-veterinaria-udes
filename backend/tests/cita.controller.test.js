// tests/cita.controller.test.js
// RF-06 (agendar), RF-07 (disponibilidad), RF-08 (reprogramar),
// RF-09 (cancelar). Los modelos se mockean, incluido horario.model
// (RF-13, horario configurable por sede); utils/franjas.js se deja real
// porque es logica pura (sin base de datos).

jest.mock('../src/models/cita.model');
jest.mock('../src/models/sede.model');
jest.mock('../src/models/servicio.model');
jest.mock('../src/models/medico.model');
jest.mock('../src/models/usuario.model');
jest.mock('../src/models/horario.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const citaModel = require('../src/models/cita.model');
const sedeModel = require('../src/models/sede.model');
const servicioModel = require('../src/models/servicio.model');
const medicoModel = require('../src/models/medico.model');
const usuarioModel = require('../src/models/usuario.model');
const horarioModel = require('../src/models/horario.model');

const ID_CLIENTE = 'cliente-1';
const ID_SEDE = 'sede-1';
const ID_SERVICIO = 'servicio-1';
const ID_MEDICO = 'medico-1';
const TOKEN_CLIENTE = jwt.sign({ id: ID_CLIENTE, rol: 'cliente' }, process.env.JWT_SECRET);
const MEDICO_EJEMPLO = { id: ID_MEDICO, nombre_completo: 'Dra. Ejemplo' };
const HORARIO_ABIERTO = { hora_inicio: '08:00:00', hora_fin: '17:00:00' };

function proximaFranjaValida(diasAdelante = 10) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasAdelante);
  fecha.setHours(8, 0, 0, 0);
  return fecha;
}

function mockearEntidadesBasicas() {
  sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE, nombre: 'Sede', ciudad: 'Bucaramanga' });
  servicioModel.buscarPorId.mockResolvedValue({ id: ID_SERVICIO, nombre: 'Consulta médica' });
  usuarioModel.buscarPorId.mockResolvedValue({ id: ID_MEDICO, rol: 'veterinario', sede_id: ID_SEDE });
  medicoModel.ofreceServicio.mockResolvedValue(true);
  horarioModel.buscarDia.mockResolvedValue(HORARIO_ABIERTO);
}

describe('GET /api/citas/disponibilidad', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza sin sedeId, servicioId o fecha', async () => {
    const respuesta = await request(app)
      .get('/api/citas/disponibilidad')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

    expect(respuesta.status).toBe(400);
  });

  test('responde 404 si la sede no existe', async () => {
    sedeModel.buscarPorId.mockResolvedValue(null);

    const respuesta = await request(app)
      .get('/api/citas/disponibilidad')
      .query({ sedeId: 'no-existe', servicioId: ID_SERVICIO, fecha: '2030-01-07' })
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

    expect(respuesta.status).toBe(404);
  });

  test('si no hay medicos para ese servicio en la sede, todas las franjas quedan no disponibles', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    servicioModel.buscarPorId.mockResolvedValue({ id: ID_SERVICIO });
    medicoModel.listarPorSedeYServicio.mockResolvedValue([]);
    horarioModel.buscarDia.mockResolvedValue(HORARIO_ABIERTO);

    const respuesta = await request(app)
      .get('/api/citas/disponibilidad')
      .query({ sedeId: ID_SEDE, servicioId: ID_SERVICIO, fecha: '2030-01-07' })
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.medicosDisponiblesEnSede).toBe(0);
    expect(respuesta.body.franjas.every((f) => !f.disponible)).toBe(true);
  });

  test('marca una franja como no disponible si todos los medicos estan ocupados', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    servicioModel.buscarPorId.mockResolvedValue({ id: ID_SERVICIO });
    medicoModel.listarPorSedeYServicio.mockResolvedValue([MEDICO_EJEMPLO]);
    horarioModel.buscarDia.mockResolvedValue(HORARIO_ABIERTO);
    const franja = proximaFranjaValida();
    medicoModel.listarFranjasOcupadas.mockResolvedValue([{ medico_id: ID_MEDICO, fecha_hora: franja }]);

    const fechaTexto = franja.toISOString().slice(0, 10);
    const respuesta = await request(app)
      .get('/api/citas/disponibilidad')
      .query({ sedeId: ID_SEDE, servicioId: ID_SERVICIO, fecha: fechaTexto })
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

    expect(respuesta.status).toBe(200);
    const franjaOcupada = respuesta.body.franjas.find((f) => f.horaInicio === franja.toISOString());
    expect(franjaOcupada.disponible).toBe(false);
  });
});

describe('GET /api/citas/disponibilidad con medicoId (usado al reprogramar)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calcula disponibilidad para un solo medico en vez del agregado', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    servicioModel.buscarPorId.mockResolvedValue({ id: ID_SERVICIO });
    usuarioModel.buscarPorId.mockResolvedValue({ id: ID_MEDICO, rol: 'veterinario', sede_id: ID_SEDE });
    medicoModel.ofreceServicio.mockResolvedValue(true);
    horarioModel.buscarDia.mockResolvedValue(HORARIO_ABIERTO);
    const franja = proximaFranjaValida();
    medicoModel.listarFranjasOcupadas.mockResolvedValue([{ medico_id: ID_MEDICO, fecha_hora: franja }]);

    const fechaTexto = franja.toISOString().slice(0, 10);
    const respuesta = await request(app)
      .get('/api/citas/disponibilidad')
      .query({ sedeId: ID_SEDE, servicioId: ID_SERVICIO, fecha: fechaTexto, medicoId: ID_MEDICO })
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

    expect(respuesta.status).toBe(200);
    expect(medicoModel.listarPorSedeYServicio).not.toHaveBeenCalled();
    const franjaOcupada = respuesta.body.franjas.find((f) => f.horaInicio === franja.toISOString());
    expect(franjaOcupada.disponible).toBe(false);
  });

  test('responde 400 si el medico no presta ese servicio', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    servicioModel.buscarPorId.mockResolvedValue({ id: ID_SERVICIO });
    usuarioModel.buscarPorId.mockResolvedValue({ id: ID_MEDICO, rol: 'veterinario', sede_id: ID_SEDE });
    medicoModel.ofreceServicio.mockResolvedValue(false);

    const respuesta = await request(app)
      .get('/api/citas/disponibilidad')
      .query({ sedeId: ID_SEDE, servicioId: ID_SERVICIO, fecha: '2030-01-07', medicoId: ID_MEDICO })
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

    expect(respuesta.status).toBe(400);
  });
});

describe('GET /api/citas/medicos-disponibles', () => {
  beforeEach(() => jest.clearAllMocks());

  test('excluye a los medicos ocupados exactamente en esa franja', async () => {
    const otroMedico = { id: 'medico-2', nombre_completo: 'Dr. Otro' };
    medicoModel.listarPorSedeYServicio.mockResolvedValue([MEDICO_EJEMPLO, otroMedico]);
    const franja = proximaFranjaValida();
    medicoModel.listarFranjasOcupadas.mockResolvedValue([{ medico_id: ID_MEDICO, fecha_hora: franja }]);

    const respuesta = await request(app)
      .get('/api/citas/medicos-disponibles')
      .query({ sedeId: ID_SEDE, servicioId: ID_SERVICIO, fechaHora: franja.toISOString() })
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.medicos).toEqual([{ id: 'medico-2', nombreCompleto: 'Dr. Otro' }]);
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

  test('responde 400 si el medico no presta ese servicio', async () => {
    mockearEntidadesBasicas();
    medicoModel.ofreceServicio.mockResolvedValue(false);
    const franja = proximaFranjaValida();

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({
        sedeId: ID_SEDE,
        servicioId: ID_SERVICIO,
        medicoId: ID_MEDICO,
        fechaHora: franja.toISOString(),
        nombreMascota: 'Firulais',
      });

    expect(respuesta.status).toBe(400);
  });

  test('responde 409 si la fecha esta en el pasado', async () => {
    mockearEntidadesBasicas();

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({
        sedeId: ID_SEDE,
        servicioId: ID_SERVICIO,
        medicoId: ID_MEDICO,
        fechaHora: '2020-01-01T08:00:00',
        nombreMascota: 'Firulais',
      });

    expect(respuesta.status).toBe(409);
  });

  test('responde 409 si el medico ya tiene una cita en esa franja', async () => {
    mockearEntidadesBasicas();
    citaModel.existeConflicto.mockResolvedValue(true);
    const franja = proximaFranjaValida();

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({
        sedeId: ID_SEDE,
        servicioId: ID_SERVICIO,
        medicoId: ID_MEDICO,
        fechaHora: franja.toISOString(),
        nombreMascota: 'Firulais',
      });

    expect(respuesta.status).toBe(409);
  });

  test('agenda la cita correctamente', async () => {
    mockearEntidadesBasicas();
    citaModel.existeConflicto.mockResolvedValue(false);
    const franja = proximaFranjaValida();
    citaModel.crear.mockResolvedValue({
      id: 'cita-1',
      cliente_id: ID_CLIENTE,
      sede_id: ID_SEDE,
      servicio_id: ID_SERVICIO,
      medico_id: ID_MEDICO,
      fecha_hora: franja,
      nombre_mascota: 'Firulais',
      estado: 'agendada',
    });

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({
        sedeId: ID_SEDE,
        servicioId: ID_SERVICIO,
        medicoId: ID_MEDICO,
        fechaHora: franja.toISOString(),
        nombreMascota: 'Firulais',
      });

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
      medico_id: ID_MEDICO,
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
      medico_id: ID_MEDICO,
      estado: 'cancelada',
    });

    const respuesta = await request(app)
      .patch('/api/citas/cita-1/reprogramar')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nuevaFechaHora: proximaFranjaValida().toISOString() });

    expect(respuesta.status).toBe(400);
  });

  test('reprograma correctamente una cita propia y activa, validando al mismo medico', async () => {
    const franjaActual = proximaFranjaValida(5);
    const nuevaFranja = proximaFranjaValida(15);
    citaModel.buscarPorId.mockResolvedValue({
      id: 'cita-1',
      cliente_id: ID_CLIENTE,
      medico_id: ID_MEDICO,
      sede_id: ID_SEDE,
      fecha_hora: franjaActual,
      estado: 'agendada',
    });
    citaModel.existeConflicto.mockResolvedValue(false);
    citaModel.reprogramar.mockResolvedValue({
      id: 'cita-1',
      cliente_id: ID_CLIENTE,
      medico_id: ID_MEDICO,
      fecha_hora: nuevaFranja,
      estado: 'agendada',
    });

    const respuesta = await request(app)
      .patch('/api/citas/cita-1/reprogramar')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nuevaFechaHora: nuevaFranja.toISOString() });

    expect(respuesta.status).toBe(200);
    expect(citaModel.existeConflicto).toHaveBeenCalledWith(ID_MEDICO, nuevaFranja);
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
