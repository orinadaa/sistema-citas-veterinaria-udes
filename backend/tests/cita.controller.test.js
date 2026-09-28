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
jest.mock('../src/models/mascota.model');
// El correo de confirmacion (incremento 4) nunca debe salir por SMTP real en pruebas.
jest.mock('../src/services/correo.service');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const citaModel = require('../src/models/cita.model');
const sedeModel = require('../src/models/sede.model');
const servicioModel = require('../src/models/servicio.model');
const medicoModel = require('../src/models/medico.model');
const usuarioModel = require('../src/models/usuario.model');
const horarioModel = require('../src/models/horario.model');
const mascotaModel = require('../src/models/mascota.model');
const correoService = require('../src/services/correo.service');

const ID_CLIENTE = 'cliente-1';
const ID_SEDE = 'sede-1';
const ID_SERVICIO = 'servicio-1';
const ID_MEDICO = 'medico-1';
const ID_MASCOTA = 'mascota-1';
const TOKEN_CLIENTE = jwt.sign({ id: ID_CLIENTE, rol: 'cliente' }, process.env.JWT_SECRET);
const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: ID_SEDE }, process.env.JWT_SECRET);
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
  mascotaModel.perteneceACliente.mockResolvedValue(true);
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
        mascotaId: ID_MASCOTA,
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
        mascotaId: ID_MASCOTA,
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
        mascotaId: ID_MASCOTA,
      });

    expect(respuesta.status).toBe(409);
  });

  test('responde 404 si la mascota no existe o no es del cliente', async () => {
    mockearEntidadesBasicas();
    mascotaModel.perteneceACliente.mockResolvedValue(false);
    const franja = proximaFranjaValida();

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({
        sedeId: ID_SEDE,
        servicioId: ID_SERVICIO,
        medicoId: ID_MEDICO,
        fechaHora: franja.toISOString(),
        mascotaId: ID_MASCOTA,
      });

    expect(respuesta.status).toBe(404);
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
      mascota_id: ID_MASCOTA,
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
        mascotaId: ID_MASCOTA,
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.cita.estado).toBe('agendada');
  });
});

describe('POST /api/citas (administrador agenda en nombre de un cliente)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza sin clienteId', async () => {
    mockearEntidadesBasicas();
    const franja = proximaFranjaValida();

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({
        servicioId: ID_SERVICIO,
        medicoId: ID_MEDICO,
        fechaHora: franja.toISOString(),
        mascotaId: ID_MASCOTA,
      });

    expect(respuesta.status).toBe(400);
  });

  test('responde 404 si el clienteId no corresponde a un cliente', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    servicioModel.buscarPorId.mockResolvedValue({ id: ID_SERVICIO });
    usuarioModel.buscarPorId.mockImplementation((id) =>
      id === ID_CLIENTE ? { id: ID_CLIENTE, rol: 'veterinario' } : { id: ID_MEDICO, rol: 'veterinario', sede_id: ID_SEDE }
    );
    const franja = proximaFranjaValida();

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({
        clienteId: ID_CLIENTE,
        servicioId: ID_SERVICIO,
        medicoId: ID_MEDICO,
        fechaHora: franja.toISOString(),
        mascotaId: ID_MASCOTA,
      });

    expect(respuesta.status).toBe(404);
  });

  test('responde 404 si la mascota no pertenece al cliente indicado', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    servicioModel.buscarPorId.mockResolvedValue({ id: ID_SERVICIO });
    usuarioModel.buscarPorId.mockImplementation((id) =>
      id === ID_CLIENTE ? { id: ID_CLIENTE, rol: 'cliente' } : { id: ID_MEDICO, rol: 'veterinario', sede_id: ID_SEDE }
    );
    mascotaModel.perteneceACliente.mockResolvedValue(false);
    const franja = proximaFranjaValida();

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({
        clienteId: ID_CLIENTE,
        servicioId: ID_SERVICIO,
        medicoId: ID_MEDICO,
        fechaHora: franja.toISOString(),
        mascotaId: ID_MASCOTA,
      });

    expect(respuesta.status).toBe(404);
  });

  test('agenda la cita en la sede del administrador y con el cliente indicado', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    servicioModel.buscarPorId.mockResolvedValue({ id: ID_SERVICIO });
    usuarioModel.buscarPorId.mockImplementation((id) =>
      id === ID_CLIENTE ? { id: ID_CLIENTE, rol: 'cliente' } : { id: ID_MEDICO, rol: 'veterinario', sede_id: ID_SEDE }
    );
    mascotaModel.perteneceACliente.mockResolvedValue(true);
    medicoModel.ofreceServicio.mockResolvedValue(true);
    horarioModel.buscarDia.mockResolvedValue(HORARIO_ABIERTO);
    citaModel.existeConflicto.mockResolvedValue(false);
    const franja = proximaFranjaValida();
    citaModel.crear.mockResolvedValue({ id: 'cita-1', cliente_id: ID_CLIENTE, sede_id: ID_SEDE, estado: 'agendada' });

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({
        clienteId: ID_CLIENTE,
        servicioId: ID_SERVICIO,
        medicoId: ID_MEDICO,
        fechaHora: franja.toISOString(),
        mascotaId: ID_MASCOTA,
      });

    expect(respuesta.status).toBe(201);
    expect(citaModel.crear).toHaveBeenCalledWith(expect.objectContaining({ clienteId: ID_CLIENTE, sedeId: ID_SEDE }));
  });
});

describe('POST /api/citas sin medicoId (asignacion automatica, flujo del cliente)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockearEntidadesBasicas();
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE, codigo: 'BGA' });
    citaModel.buscarDetallePorId.mockResolvedValue(null);
    correoService.enviarConfirmacionCita.mockResolvedValue();
  });

  function agendarSinMedico(franja) {
    return request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ sedeId: ID_SEDE, servicioId: ID_SERVICIO, fechaHora: franja.toISOString(), mascotaId: ID_MASCOTA });
  }

  test('asigna al medico libre con menos citas ese dia', async () => {
    medicoModel.listarPorSedeYServicio.mockResolvedValue([
      { id: 'med-a', nombre_completo: 'Ana' },
      { id: 'med-b', nombre_completo: 'Bruno' },
      { id: 'med-c', nombre_completo: 'Carla' },
    ]);
    // med-a esta ocupado justo en esa franja; med-b tiene 3 citas ese dia, med-c 1
    medicoModel.listarFranjasOcupadas.mockResolvedValue([{ medico_id: 'med-a' }]);
    medicoModel.contarCitasPorMedico.mockResolvedValue([
      { medico_id: 'med-b', total: 3 },
      { medico_id: 'med-c', total: 1 },
    ]);
    citaModel.crear.mockResolvedValue({ id: 'cita-1', codigo: 'CV-BGA-2026-00001', estado: 'agendada' });

    const respuesta = await agendarSinMedico(proximaFranjaValida());

    expect(respuesta.status).toBe(201);
    expect(citaModel.crear).toHaveBeenCalledTimes(1);
    expect(citaModel.crear).toHaveBeenCalledWith(expect.objectContaining({ medicoId: 'med-c', sedeCodigo: 'BGA' }));
    expect(respuesta.body.correoEnviado).toBe(true);
  });

  test('responde 409 si ningun medico esta libre en esa franja', async () => {
    medicoModel.listarPorSedeYServicio.mockResolvedValue([{ id: 'med-a', nombre_completo: 'Ana' }]);
    medicoModel.listarFranjasOcupadas.mockResolvedValue([{ medico_id: 'med-a' }]);
    medicoModel.contarCitasPorMedico.mockResolvedValue([]);

    const respuesta = await agendarSinMedico(proximaFranjaValida());

    expect(respuesta.status).toBe(409);
    expect(citaModel.crear).not.toHaveBeenCalled();
  });

  test('si el primer candidato se ocupa en el instante del INSERT (23505), prueba con el siguiente', async () => {
    medicoModel.listarPorSedeYServicio.mockResolvedValue([
      { id: 'med-a', nombre_completo: 'Ana' },
      { id: 'med-b', nombre_completo: 'Bruno' },
    ]);
    medicoModel.listarFranjasOcupadas.mockResolvedValue([]);
    medicoModel.contarCitasPorMedico.mockResolvedValue([]);
    citaModel.crear
      .mockRejectedValueOnce(Object.assign(new Error('duplicado'), { code: '23505' }))
      .mockResolvedValueOnce({ id: 'cita-1', codigo: 'CV-BGA-2026-00002', estado: 'agendada' });

    const respuesta = await agendarSinMedico(proximaFranjaValida());

    expect(respuesta.status).toBe(201);
    expect(citaModel.crear).toHaveBeenNthCalledWith(1, expect.objectContaining({ medicoId: 'med-a' }));
    expect(citaModel.crear).toHaveBeenNthCalledWith(2, expect.objectContaining({ medicoId: 'med-b' }));
  });

  test('si el correo falla, la cita igual queda creada y se informa correoEnviado=false', async () => {
    medicoModel.listarPorSedeYServicio.mockResolvedValue([{ id: 'med-a', nombre_completo: 'Ana' }]);
    medicoModel.listarFranjasOcupadas.mockResolvedValue([]);
    medicoModel.contarCitasPorMedico.mockResolvedValue([]);
    citaModel.crear.mockResolvedValue({ id: 'cita-1', codigo: 'CV-BGA-2026-00003', estado: 'agendada' });
    correoService.enviarConfirmacionCita.mockRejectedValue(new Error('SMTP caido'));
    const errorOriginal = console.error;
    console.error = jest.fn();

    const respuesta = await agendarSinMedico(proximaFranjaValida());
    console.error = errorOriginal;

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.correoEnviado).toBe(false);
  });

  test('rechaza un motivo de mas de 255 caracteres', async () => {
    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({
        sedeId: ID_SEDE,
        servicioId: ID_SERVICIO,
        fechaHora: proximaFranjaValida().toISOString(),
        mascotaId: ID_MASCOTA,
        motivo: 'x'.repeat(256),
      });
    expect(respuesta.status).toBe(400);
  });
});

describe('POST /api/citas/:id/reenviar-confirmacion', () => {
  beforeEach(() => jest.clearAllMocks());

  const CITA_DETALLE = { id: 'cita-1', cliente_id: ID_CLIENTE, estado: 'agendada', codigo: 'CV-BGA-2026-00001', cliente_correo: 'c@c.com' };

  test('responde 403 si la cita es de otro cliente', async () => {
    citaModel.buscarDetallePorId.mockResolvedValue({ ...CITA_DETALLE, cliente_id: 'otro' });
    const respuesta = await request(app)
      .post('/api/citas/cita-1/reenviar-confirmacion')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(403);
    expect(correoService.enviarConfirmacionCita).not.toHaveBeenCalled();
  });

  test('responde 400 si la cita esta cancelada', async () => {
    citaModel.buscarDetallePorId.mockResolvedValue({ ...CITA_DETALLE, estado: 'cancelada' });
    const respuesta = await request(app)
      .post('/api/citas/cita-1/reenviar-confirmacion')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(400);
  });

  test('reenvia el correo de una cita propia y activa', async () => {
    citaModel.buscarDetallePorId.mockResolvedValue(CITA_DETALLE);
    correoService.enviarConfirmacionCita.mockResolvedValue();
    const respuesta = await request(app)
      .post('/api/citas/cita-1/reenviar-confirmacion')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(200);
    expect(correoService.enviarConfirmacionCita).toHaveBeenCalledWith(CITA_DETALLE);
  });

  test('responde 502 si el servidor de correo falla', async () => {
    citaModel.buscarDetallePorId.mockResolvedValue(CITA_DETALLE);
    correoService.enviarConfirmacionCita.mockRejectedValue(new Error('SMTP caido'));
    const errorOriginal = console.error;
    console.error = jest.fn();
    const respuesta = await request(app)
      .post('/api/citas/cita-1/reenviar-confirmacion')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    console.error = errorOriginal;
    expect(respuesta.status).toBe(502);
  });
});

describe('POST /api/citas (medico agenda a nombre de un cliente)', () => {
  beforeEach(() => jest.clearAllMocks());
  const TOKEN_VET = jwt.sign({ id: ID_MEDICO, rol: 'veterinario', sedeId: ID_SEDE }, process.env.JWT_SECRET);

  test('exige clienteId', async () => {
    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_VET}`)
      .send({ servicioId: ID_SERVICIO, fechaHora: proximaFranjaValida().toISOString(), mascotaId: ID_MASCOTA });
    expect(respuesta.status).toBe(400);
  });

  test('la cita queda con el mismo medico y en su sede, ignorando otros valores enviados', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE, codigo: 'BGA' });
    servicioModel.buscarPorId.mockResolvedValue({ id: ID_SERVICIO });
    usuarioModel.buscarPorId.mockImplementation((id) =>
      id === ID_CLIENTE ? { id: ID_CLIENTE, rol: 'cliente' } : { id: ID_MEDICO, rol: 'veterinario', sede_id: ID_SEDE }
    );
    mascotaModel.perteneceACliente.mockResolvedValue(true);
    medicoModel.ofreceServicio.mockResolvedValue(true);
    horarioModel.buscarDia.mockResolvedValue(HORARIO_ABIERTO);
    citaModel.existeConflicto.mockResolvedValue(false);
    citaModel.crear.mockResolvedValue({ id: 'cita-1', estado: 'agendada' });
    citaModel.buscarDetallePorId.mockResolvedValue(null);
    correoService.enviarConfirmacionCita.mockResolvedValue();

    const respuesta = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${TOKEN_VET}`)
      .send({
        clienteId: ID_CLIENTE,
        sedeId: 'otra-sede',
        medicoId: 'otro-medico',
        servicioId: ID_SERVICIO,
        fechaHora: proximaFranjaValida().toISOString(),
        mascotaId: ID_MASCOTA,
      });

    expect(respuesta.status).toBe(201);
    expect(citaModel.crear).toHaveBeenCalledWith(
      expect.objectContaining({ clienteId: ID_CLIENTE, sedeId: ID_SEDE, medicoId: ID_MEDICO })
    );
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
  beforeEach(() => jest.clearAllMocks());

  test('un administrador no puede ver "mis citas" (es una vista exclusiva del cliente dueño)', async () => {
    const respuesta = await request(app)
      .get('/api/citas/mias')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(403);
  });

  test('un administrador no puede reprogramar citas (exclusivo del cliente dueño)', async () => {
    const respuesta = await request(app)
      .patch('/api/citas/cita-1/reprogramar')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nuevaFechaHora: proximaFranjaValida().toISOString() });

    expect(respuesta.status).toBe(403);
  });

  test('un administrador no puede cancelar citas (exclusivo del cliente dueño)', async () => {
    const respuesta = await request(app)
      .patch('/api/citas/cita-1/cancelar')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(403);
  });

  test('un administrador si puede consultar disponibilidad y medicos-disponibles (calendario del panel)', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    servicioModel.buscarPorId.mockResolvedValue({ id: ID_SERVICIO });
    medicoModel.listarPorSedeYServicio.mockResolvedValue([]);
    horarioModel.buscarDia.mockResolvedValue(HORARIO_ABIERTO);

    const respuesta = await request(app)
      .get('/api/citas/disponibilidad')
      .query({ sedeId: ID_SEDE, servicioId: ID_SERVICIO, fecha: '2030-01-07' })
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(200);
  });
});
