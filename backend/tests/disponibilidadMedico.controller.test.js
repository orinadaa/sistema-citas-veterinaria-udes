// tests/disponibilidadMedico.controller.test.js
// Horario de trabajo y bloqueos del medico: los define el administrador de
// su sede; el medico solo los consulta.
jest.mock('../src/models/disponibilidadMedico.model');
jest.mock('../src/models/sede.model');
jest.mock('../src/models/horario.model');
jest.mock('../src/models/usuario.model');
// Sin otros medicos: las citas dentro de un bloqueo quedan por reagendar.
jest.mock('../src/models/medico.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const disponibilidadModel = require('../src/models/disponibilidadMedico.model');
const sedeModel = require('../src/models/sede.model');
const horarioModel = require('../src/models/horario.model');
const usuarioModel = require('../src/models/usuario.model');

const TOKEN_VET = jwt.sign({ id: 'vet-1', rol: 'veterinario', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const TOKEN_ADMIN = jwt.sign({ id: 'a1', rol: 'administrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const TOKEN_ADMIN_OTRA_SEDE = jwt.sign({ id: 'a2', rol: 'administrador', sedeId: 'sede-2' }, process.env.JWT_SECRET);
const TOKEN_SUPER = jwt.sign({ id: 's1', rol: 'superadministrador', sedeId: null }, process.env.JWT_SECRET);
const DIA = { diaSemana: 1, horaInicio: '08:00', horaFin: '12:00' };
const BASE = '/api/administracion/medicos/vet-1/disponibilidad';

beforeEach(() => {
  jest.clearAllMocks();
  usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-1', rol: 'veterinario', sede_id: 'sede-1' });
  sedeModel.buscarPorId.mockResolvedValue({ id: 'sede-1', nombre: 'Sede BGA', activo: true });
  sedeModel.listarTodas.mockResolvedValue([{ id: 'sede-1', nombre: 'Sede BGA', ciudad: 'Bucaramanga' }]);
  horarioModel.buscarDia.mockResolvedValue({ hora_inicio: '08:00:00', hora_fin: '17:00:00' });
  horarioModel.listarPorSede.mockResolvedValue([]);
  disponibilidadModel.listarHorario.mockResolvedValue([]);
  disponibilidadModel.listarBloqueos.mockResolvedValue([]);
  disponibilidadModel.listarCitasFuturas.mockResolvedValue([]);
  disponibilidadModel.listarCitasEnBloqueo.mockResolvedValue([]);
});

function guardar(dias, token = TOKEN_ADMIN) {
  return request(app).put(`${BASE}/horario`).set('Authorization', `Bearer ${token}`).send({ dias });
}

describe('El medico solo consulta su horario', () => {
  test('puede verlo', async () => {
    const r = await request(app).get('/api/medico/disponibilidad').set('Authorization', `Bearer ${TOKEN_VET}`);
    expect(r.status).toBe(200);
    expect(r.body.sedePrincipalId).toBe('sede-1');
  });

  test('ya no puede cambiar su horario ni sus bloqueos', async () => {
    const con = (peticion) => peticion.set('Authorization', `Bearer ${TOKEN_VET}`);
    expect((await con(request(app).put('/api/medico/disponibilidad/horario')).send({ dias: [DIA] })).status).toBe(404);
    expect((await con(request(app).post('/api/medico/disponibilidad/bloqueos')).send({})).status).toBe(404);
    expect((await guardar([DIA], TOKEN_VET)).status).toBe(403);
    expect(disponibilidadModel.reemplazarHorario).not.toHaveBeenCalled();
    expect(disponibilidadModel.crearBloqueo).not.toHaveBeenCalled();
  });
});

describe('PUT /api/administracion/medicos/:id/disponibilidad/horario', () => {
  test('es exclusivo del administrador de la sede del medico', async () => {
    expect((await guardar([DIA], TOKEN_SUPER)).status).toBe(403);
    expect((await guardar([DIA], TOKEN_ADMIN_OTRA_SEDE)).status).toBe(403);
    expect(disponibilidadModel.reemplazarHorario).not.toHaveBeenCalled();
  });

  test('responde 404 si la cuenta no es de un medico', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'c1', rol: 'cliente', sede_id: null });
    expect((await guardar([DIA])).status).toBe(404);
  });

  test('guarda un horario valido dentro del horario de la sede', async () => {
    const r = await guardar([DIA, { ...DIA, diaSemana: 2, pausaInicio: '10:00', pausaFin: '10:30' }]);
    expect(r.status).toBe(200);
    expect(disponibilidadModel.reemplazarHorario).toHaveBeenCalledWith('vet-1', expect.any(Array));
  });

  test('los dias quedan siempre en la sede del administrador', async () => {
    await guardar([{ ...DIA, sedeId: 'sede-2' }]);
    const [, dias] = disponibilidadModel.reemplazarHorario.mock.calls[0];
    expect(dias[0].sedeId).toBe('sede-1');
  });

  test('lista vacia = volver al horario de la sede', async () => {
    expect((await guardar([])).status).toBe(200);
    expect(disponibilidadModel.reemplazarHorario).toHaveBeenCalledWith('vet-1', []);
  });

  test('rechaza un dia repetido', async () => {
    expect((await guardar([DIA, DIA])).status).toBe(400);
  });

  test('rechaza un horario fuera del horario de atencion de la sede', async () => {
    expect((await guardar([{ ...DIA, horaFin: '19:00' }])).status).toBe(400);
    expect(disponibilidadModel.reemplazarHorario).not.toHaveBeenCalled();
  });

  test('rechaza un dia en que la sede no atiende', async () => {
    horarioModel.buscarDia.mockResolvedValue(null);
    expect((await guardar([DIA])).status).toBe(400);
  });

  test('rechaza una pausa fuera del rango o incompleta', async () => {
    expect((await guardar([{ ...DIA, pausaInicio: '12:30', pausaFin: '13:00' }])).status).toBe(400);
    expect((await guardar([{ ...DIA, pausaInicio: '10:00' }])).status).toBe(400);
  });
});

describe('Bloqueos', () => {
  const futuro = new Date(Date.now() + 5 * 864e5).toLocaleDateString('en-CA');
  const post = (b, token = TOKEN_ADMIN) => request(app).post(`${BASE}/bloqueos`).set('Authorization', `Bearer ${token}`).send(b);

  test('rechaza fechas invertidas o ya pasadas', async () => {
    expect((await post({ fechaInicio: '2030-01-10', fechaFin: '2030-01-05' })).status).toBe(400);
    expect((await post({ fechaInicio: '2020-01-01', fechaFin: '2020-01-02' })).status).toBe(400);
  });

  test('crea el bloqueo y avisa cuantas citas quedan dentro', async () => {
    disponibilidadModel.crearBloqueo.mockResolvedValue({ id: 'b1' });
    const cita = { sede_id: 'sede-1', servicio_id: 's1', medico_id: 'vet-1', fecha_hora: new Date(), duracion_minutos: 30 };
    disponibilidadModel.listarCitasEnBloqueo.mockResolvedValue([{ ...cita, id: 'c1' }, { ...cita, id: 'c2' }]);
    require('../src/models/medico.model').listarPorSedeYServicio.mockResolvedValue([]);
    jest.spyOn(require('../src/models/cita.model'), 'marcarPorReagendar').mockResolvedValue(['c1', 'c2']);
    const r = await post({ fechaInicio: futuro, fechaFin: futuro, motivo: 'Vacaciones' });
    expect(r.status).toBe(201);
    expect(r.body.citasAfectadas).toBe(2);
    expect(disponibilidadModel.crearBloqueo).toHaveBeenCalledWith('vet-1', expect.any(Object));
  });

  test('un administrador de otra sede no puede bloquear al medico', async () => {
    expect((await post({ fechaInicio: futuro, fechaFin: futuro }, TOKEN_ADMIN_OTRA_SEDE)).status).toBe(403);
  });

  test('solo elimina bloqueos de ese medico', async () => {
    disponibilidadModel.eliminarBloqueo.mockResolvedValue(false);
    const r = await request(app)
      .delete(`${BASE}/bloqueos/11111111-1111-1111-1111-111111111111`)
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(r.status).toBe(404);
    expect(disponibilidadModel.eliminarBloqueo).toHaveBeenCalledWith('vet-1', '11111111-1111-1111-1111-111111111111');
  });
});
