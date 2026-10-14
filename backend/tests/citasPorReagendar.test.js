// tests/citasPorReagendar.test.js
// Citas por reagendar: cuando la sede cambia su horario o el medico tiene
// un bloqueo, las citas que ya no se pueden atender pasan a otro medico
// libre a la misma hora o quedan "por reagendar"; el cliente elige la fecha
// nueva con cualquier medico libre, o cancela.

jest.mock('../src/models/cita.model');
jest.mock('../src/models/sede.model');
jest.mock('../src/models/servicio.model');
jest.mock('../src/models/medico.model');
jest.mock('../src/models/usuario.model');
jest.mock('../src/models/horario.model');
jest.mock('../src/models/disponibilidadMedico.model', () => ({
  cargarContexto: jest.fn(async (ids, sedeId) => ({ sedeId, conHorarioPropio: new Set(), horarioDelDia: new Map(), bloqueos: [] })),
  atiendeEnSede: jest.fn(async () => true),
  crearBloqueo: jest.fn(),
  listarCitasEnBloqueo: jest.fn(),
  listarCitasFuturas: jest.fn(),
}));
jest.mock('../src/services/correo.service');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const citaModel = require('../src/models/cita.model');
const sedeModel = require('../src/models/sede.model');
const medicoModel = require('../src/models/medico.model');
const usuarioModel = require('../src/models/usuario.model');
const horarioModel = require('../src/models/horario.model');
const disponibilidadModel = require('../src/models/disponibilidadMedico.model');
const notificaciones = require('../src/services/notificaciones.service');

const ID_SEDE = 'sede-1';
const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: ID_SEDE }, process.env.JWT_SECRET);
const TOKEN_ADMIN_OTRA_SEDE = jwt.sign({ id: 'admin-2', rol: 'administrador', sedeId: 'otra-sede' }, process.env.JWT_SECRET);
const TOKEN_CLIENTE = jwt.sign({ id: 'cliente-1', rol: 'cliente' }, process.env.JWT_SECRET);
const TOKEN_MEDICO = jwt.sign({ id: 'medico-1', rol: 'veterinario', sedeId: ID_SEDE }, process.env.JWT_SECRET);
const MEDICO_1 = { id: 'medico-1', nombre_completo: 'Dra. Uno' };
const MEDICO_2 = { id: 'medico-2', nombre_completo: 'Dr. Dos' };

function enDias(dias, hora = 9) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(hora, 0, 0, 0);
  return fecha;
}

const citaAfectada = (id, extra = {}) => ({
  id,
  codigo: `CV-BGA-2026-0000${id.slice(-1)}`,
  fecha_hora: enDias(5),
  duracion_minutos: 30,
  sede_id: ID_SEDE,
  servicio_id: 'servicio-1',
  medico_id: 'medico-1',
  ...extra,
});

beforeEach(() => {
  jest.clearAllMocks();
  horarioModel.buscarDia.mockResolvedValue({ hora_inicio: '08:00:00', hora_fin: '17:00:00' });
  medicoModel.listarFranjasOcupadas.mockResolvedValue([]);
  medicoModel.contarCitasPorMedico.mockResolvedValue([]);
  citaModel.mascotaOcupada.mockResolvedValue(false);
});

describe('Bloqueo de un medico con citas dentro', () => {
  const futuro = enDias(5).toLocaleDateString('en-CA');
  const crear = () =>
    request(app)
      .post('/api/administracion/medicos/medico-1/disponibilidad/bloqueos')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ fechaInicio: futuro, fechaFin: futuro, motivo: 'Incapacidad' });

  beforeEach(() => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'medico-1', rol: 'veterinario', sede_id: ID_SEDE });
    disponibilidadModel.crearBloqueo.mockResolvedValue({ id: 'b1' });
  });

  test('pasa la cita a otro medico libre a la misma hora y deja por reagendar la que nadie puede tomar', async () => {
    disponibilidadModel.listarCitasEnBloqueo.mockResolvedValue([citaAfectada('cita-1'), citaAfectada('cita-2')]);
    // cita-1: el medico 2 presta el servicio y esta libre; cita-2: solo el medico bloqueado.
    medicoModel.listarPorSedeYServicio.mockResolvedValueOnce([MEDICO_1, MEDICO_2]).mockResolvedValueOnce([MEDICO_1]);
    citaModel.reasignarMedico.mockResolvedValue({ id: 'cita-1', medico_id: 'medico-2' });
    citaModel.marcarPorReagendar.mockResolvedValue(['cita-2']);

    const r = await crear();

    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ citasAfectadas: 2, citasReasignadas: 1, citasPorReagendar: 1 });
    expect(citaModel.reasignarMedico).toHaveBeenCalledWith('cita-1', 'medico-2');
    expect(citaModel.marcarPorReagendar).toHaveBeenCalledWith(['cita-2'], expect.stringMatching(/agenda de la clínica/));
  });

  test('si otro movimiento ocupa al medico candidato, prueba el siguiente', async () => {
    const MEDICO_3 = { id: 'medico-3', nombre_completo: 'Dra. Tres' };
    disponibilidadModel.listarCitasEnBloqueo.mockResolvedValue([citaAfectada('cita-1')]);
    medicoModel.listarPorSedeYServicio.mockResolvedValue([MEDICO_1, MEDICO_2, MEDICO_3]);
    citaModel.reasignarMedico
      .mockRejectedValueOnce(Object.assign(new Error('ocupado'), { code: '23505' }))
      .mockResolvedValueOnce({ id: 'cita-1' });
    citaModel.marcarPorReagendar.mockResolvedValue([]);

    const r = await crear();

    expect(r.body.citasReasignadas).toBe(1);
    expect(citaModel.reasignarMedico).toHaveBeenCalledTimes(2);
    expect(citaModel.marcarPorReagendar).toHaveBeenCalledWith([], expect.any(String));
  });

  test('la sede consulta antes que citas caerian dentro del bloqueo', async () => {
    disponibilidadModel.listarCitasEnBloqueo.mockResolvedValue([citaAfectada('cita-1')]);
    const r = await request(app)
      .get(`/api/administracion/medicos/medico-1/disponibilidad/bloqueos/afectadas?fechaInicio=${futuro}&fechaFin=${futuro}`)
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(r.status).toBe(200);
    expect(r.body.citas).toHaveLength(1);
    expect(disponibilidadModel.crearBloqueo).not.toHaveBeenCalled();
  });
});

describe('Cambio del horario de atencion de la sede', () => {
  beforeEach(() => {
    sedeModel.buscarPorId.mockResolvedValue({ id: ID_SEDE });
    horarioModel.upsertDia.mockResolvedValue({ dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '12:00:00' });
  });

  test('las citas que quedan fuera pasan a por reagendar, sin buscar otro medico', async () => {
    horarioModel.listarCitasFueraDeHorario.mockResolvedValue([citaAfectada('cita-1'), citaAfectada('cita-2')]);
    citaModel.marcarPorReagendar.mockResolvedValue(['cita-1', 'cita-2']);

    const r = await request(app)
      .put('/api/horarios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ sedeId: ID_SEDE, diaSemana: 1, horaInicio: '09:00', horaFin: '12:00' });

    expect(r.status).toBe(200);
    expect(r.body.citasAfectadas).toBe(2);
    expect(citaModel.marcarPorReagendar).toHaveBeenCalledWith(['cita-1', 'cita-2'], expect.stringMatching(/horario de atención/));
    expect(citaModel.reasignarMedico).not.toHaveBeenCalled();
  });

  test('al cerrar un dia, todas sus citas futuras quedan por reagendar', async () => {
    horarioModel.listarCitasFueraDeHorario.mockResolvedValue([citaAfectada('cita-1')]);
    citaModel.marcarPorReagendar.mockResolvedValue(['cita-1']);
    const r = await request(app).delete(`/api/horarios/${ID_SEDE}/1`).set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(r.status).toBe(200);
    expect(r.body.citasAfectadas).toBe(1);
    expect(horarioModel.listarCitasFueraDeHorario).toHaveBeenCalledWith(ID_SEDE, 1);
  });

  test('la sede ve las citas afectadas antes de guardar; otra sede no', async () => {
    horarioModel.listarCitasFueraDeHorario.mockResolvedValue([citaAfectada('cita-1')]);
    const url = `/api/horarios/afectadas?sedeId=${ID_SEDE}&diaSemana=1&horaInicio=09:00&horaFin=12:00`;
    const propia = await request(app).get(url).set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(propia.status).toBe(200);
    expect(propia.body.citas).toHaveLength(1);
    expect(horarioModel.upsertDia).not.toHaveBeenCalled();
    expect((await request(app).get(url).set('Authorization', `Bearer ${TOKEN_ADMIN_OTRA_SEDE}`)).status).toBe(403);
  });
});

describe('El cliente reagenda una cita por reagendar', () => {
  const POR_REAGENDAR = {
    id: 'cita-1',
    cliente_id: 'cliente-1',
    sede_id: ID_SEDE,
    servicio_id: 'servicio-1',
    medico_id: 'medico-1',
    mascota_id: 'mascota-1',
    fecha_hora: enDias(2),
    duracion_minutos: 30,
    estado: 'por_reagendar',
  };
  const reagendar = (fecha, token = TOKEN_CLIENTE) =>
    request(app).patch('/api/citas/cita-1/reprogramar').set('Authorization', `Bearer ${token}`).send({ nuevaFechaHora: fecha.toISOString() });

  beforeEach(() => citaModel.buscarPorId.mockResolvedValue(POR_REAGENDAR));

  test('prefiere al medico que tenia la cita si esta libre', async () => {
    medicoModel.listarPorSedeYServicio.mockResolvedValue([MEDICO_2, MEDICO_1]);
    citaModel.reagendar.mockResolvedValue({ ...POR_REAGENDAR, estado: 'agendada' });
    const nueva = enDias(8);
    const r = await reagendar(nueva);
    expect(r.status).toBe(200);
    expect(citaModel.reagendar).toHaveBeenCalledWith('cita-1', nueva, 'medico-1');
  });

  test('si ese medico no esta libre, toma otro que preste el servicio', async () => {
    medicoModel.listarPorSedeYServicio.mockResolvedValue([MEDICO_2]);
    citaModel.reagendar.mockResolvedValue({ ...POR_REAGENDAR, estado: 'agendada', medico_id: 'medico-2' });
    const r = await reagendar(enDias(8));
    expect(r.status).toBe(200);
    expect(citaModel.reagendar).toHaveBeenCalledWith('cita-1', expect.any(Date), 'medico-2');
  });

  test('sin medicos libres a esa hora responde 409', async () => {
    medicoModel.listarPorSedeYServicio.mockResolvedValue([]);
    const r = await reagendar(enDias(8));
    expect(r.status).toBe(409);
    expect(citaModel.reagendar).not.toHaveBeenCalled();
  });

  test('no acepta una fecha pasada ni una hora fuera del horario de la sede', async () => {
    expect((await reagendar(new Date(Date.now() - 3600e3))).status).toBe(409);
    expect((await reagendar(enDias(8, 20))).status).toBe(409);
  });

  test('el medico no puede reagendarla', async () => {
    expect((await reagendar(enDias(8), TOKEN_MEDICO)).status).toBe(403);
  });

  test('puede cancelarla aunque su fecha original ya haya pasado', async () => {
    citaModel.buscarPorId.mockResolvedValue({ ...POR_REAGENDAR, fecha_hora: new Date(Date.now() - 864e5) });
    citaModel.cancelar.mockResolvedValue({ ...POR_REAGENDAR, estado: 'cancelada' });
    const r = await request(app).patch('/api/citas/cita-1/cancelar').set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(r.status).toBe(200);
  });
});

describe('Plazo para reagendar', () => {
  test('recuerda las que estan por vencer y cancela las vencidas', async () => {
    citaModel.tomarPorReagendarParaRecordar.mockResolvedValue(['cita-1']);
    citaModel.cancelarPorReagendarVencidas.mockResolvedValue(['cita-2', 'cita-3']);
    await expect(notificaciones.revisarCitasPorReagendar()).resolves.toEqual({ recordadas: 1, canceladas: 2 });
    expect(citaModel.tomarPorReagendarParaRecordar).toHaveBeenCalledWith(24);
  });
});
