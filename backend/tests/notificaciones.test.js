// tests/notificaciones.test.js
// Modulo de notificaciones (RF-17, RF-18): la campana (rutas) y el servicio
// que crea los avisos. Modelo y correo simulados.

jest.mock('../src/models/notificacion.model');
jest.mock('../src/services/correo.service');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const notificacionModel = require('../src/models/notificacion.model');
const correoService = require('../src/services/correo.service');
const servicio = require('../src/services/notificaciones.service');

const TOKEN = jwt.sign({ id: 'c1', rol: 'cliente' }, process.env.JWT_SECRET);
const con = (peticion) => peticion.set('Authorization', 'Bearer ' + TOKEN);

const CITA = {
  id: 'ci1', codigo: 'CV-BGA-2026-00001', fecha_hora: new Date('2026-10-20T14:30:00'), cliente_id: 'c1', medico_id: 'm1', sede_id: 's1',
  sede_nombre: 'Sede Bucaramanga', servicio_nombre: 'Vacunación', mascota_nombre: 'Luna', cliente_nombre: 'Ana Pérez', cliente_correo: 'ana@correo.com', medico_nombre: 'Dr. Ruiz',
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NOTIFICACIONES_EN_PRUEBAS = '1';
  notificacionModel.crear.mockResolvedValue();
  notificacionModel.detalleCita.mockResolvedValue(CITA);
  notificacionModel.administradoresDeSede.mockResolvedValue(['a1', 'a2']);
});
afterAll(() => delete process.env.NOTIFICACIONES_EN_PRUEBAS);

const creadas = () => notificacionModel.crear.mock.calls.map(([aviso]) => aviso);
const para = (usuarioId) => creadas().filter((a) => a.usuarioId === usuarioId);

describe('La campana (/api/notificaciones)', () => {
  test('exige sesion', async () => {
    expect((await request(app).get('/api/notificaciones')).status).toBe(401);
  });

  test('lista solo las del usuario que inicio sesion', async () => {
    notificacionModel.listarDeUsuario.mockResolvedValue({ notificaciones: [{ id: 'n1' }], sinLeer: 1 });
    const respuesta = await con(request(app).get('/api/notificaciones'));
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.sinLeer).toBe(1);
    expect(notificacionModel.listarDeUsuario).toHaveBeenCalledWith('c1');
  });

  test('marca una como leida solo si es suya', async () => {
    notificacionModel.marcarLeida.mockResolvedValue(true);
    expect((await con(request(app).patch('/api/notificaciones/n1/leida'))).status).toBe(204);
    expect(notificacionModel.marcarLeida).toHaveBeenCalledWith('c1', 'n1');
    notificacionModel.marcarLeida.mockResolvedValue(false);
    expect((await con(request(app).patch('/api/notificaciones/de-otro/leida'))).status).toBe(404);
  });

  test('marca todas como leidas', async () => {
    expect((await con(request(app).patch('/api/notificaciones/leidas'))).status).toBe(204);
    expect(notificacionModel.marcarTodasLeidas).toHaveBeenCalledWith('c1');
  });
});

describe('Avisos de citas', () => {
  test('cita agendada por el cliente: avisa al cliente, al medico y a los administradores de la sede', async () => {
    await servicio.citaAgendada('ci1', 'c1');
    expect(creadas()).toHaveLength(4);
    expect(para('c1')[0]).toMatchObject({ tipo: 'cita_agendada', titulo: 'Cita agendada', enlace: '/panel?tab=citas' });
    expect(para('c1')[0].mensaje).toMatch(/^Agendaste Vacunación para Luna/);
    expect(para('m1')[0]).toMatchObject({ titulo: 'Nueva cita', enlace: '/medico' });
    expect(para('a1')[0]).toMatchObject({ enlace: 'citas' });
    expect(para('a1')[0].mensaje).toMatch(/Médico: Dr\. Ruiz/);
  });

  test('si la agenda el medico, el no recibe su propio aviso y al cliente se le dice que fue la clinica', async () => {
    await servicio.citaAgendada('ci1', 'm1');
    expect(para('m1')).toHaveLength(0);
    expect(para('c1')[0].mensaje).toMatch(/^La clínica agendó/);
  });

  test('si la agenda un administrador, ese administrador no se avisa a si mismo', async () => {
    await servicio.citaAgendada('ci1', 'a1');
    expect(para('a1')).toHaveLength(0);
    expect(para('a2')).toHaveLength(1);
  });

  test('reprogramada: dice de que fecha a que fecha', async () => {
    await servicio.citaReprogramada('ci1', 'c1', new Date('2026-10-18T09:00:00'));
    expect(para('c1')[0]).toMatchObject({ tipo: 'cita_reprogramada', titulo: 'Cita reprogramada' });
    expect(para('c1')[0].mensaje).toMatch(/18 de octubre.*20 de octubre/);
    expect(para('m1')).toHaveLength(1);
  });

  test('cancelada: avisa a los tres', async () => {
    await servicio.citaCancelada('ci1', 'c1');
    expect(creadas().map((a) => a.tipo)).toEqual(['cita_cancelada', 'cita_cancelada', 'cita_cancelada', 'cita_cancelada']);
  });

  test('un fallo al guardar el aviso no rompe la accion', async () => {
    notificacionModel.crear.mockRejectedValue(new Error('sin base'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(servicio.citaAgendada('ci1', 'c1')).resolves.toBeUndefined();
    notificacionModel.detalleCita.mockRejectedValue(new Error('sin base'));
    await expect(servicio.citaCancelada('ci1', 'c1')).resolves.toBeUndefined();
    console.error.mockRestore();
  });

  test('en las pruebas automaticas normales no escribe nada', async () => {
    delete process.env.NOTIFICACIONES_EN_PRUEBAS;
    await servicio.citaAgendada('ci1', 'c1');
    await servicio.mascotaRegistrada({ nombre: 'Luna', cliente_id: 'c1' }, 'c1');
    expect(notificacionModel.crear).not.toHaveBeenCalled();
  });
});

describe('Avisos de mascotas y recordatorios', () => {
  test('mascota registrada por el cliente o por la clinica', async () => {
    await servicio.mascotaRegistrada({ nombre: 'Luna', cliente_id: 'c1' }, 'c1');
    await servicio.mascotaRegistrada({ nombre: 'Milo', cliente_id: 'c1' }, 'a1');
    expect(creadas()[0]).toMatchObject({ usuarioId: 'c1', tipo: 'mascota_registrada', enlace: '/panel?tab=mascotas' });
    expect(creadas()[0].mensaje).toMatch(/Luna ya hace parte de tu cuenta/);
    expect(creadas()[1].mensaje).toBe('La clínica registró a Milo en tu cuenta.');
  });

  test('recordatorio creado por el medico', async () => {
    await servicio.recordatorioDelMedico({ clienteId: 'c1', nombreMascota: 'Luna', nombreMedico: 'Dr. Ruiz', titulo: 'Refuerzo de vacuna', fechaTexto: '20 de octubre', hora: '9:00 a. m.' });
    expect(creadas()[0]).toMatchObject({ usuarioId: 'c1', tipo: 'recordatorio', titulo: 'Recordatorio para Luna' });
  });
});

describe('Recordatorio automatico previo a la cita (RF-18)', () => {
  test('avisa en la campana y por correo de las citas de las proximas 24 horas', async () => {
    notificacionModel.tomarCitasParaRecordar.mockResolvedValue(['ci1']);
    correoService.enviarRecordatorioCita.mockResolvedValue();
    expect(await servicio.recordarCitasProximas()).toBe(1);
    expect(notificacionModel.tomarCitasParaRecordar).toHaveBeenCalledWith(24);
    expect(creadas()[0]).toMatchObject({ usuarioId: 'c1', tipo: 'recordatorio_cita', titulo: 'Tu cita se acerca' });
    expect(correoService.enviarRecordatorioCita).toHaveBeenCalledWith(expect.objectContaining({ cliente_correo: 'ana@correo.com', codigo: 'CV-BGA-2026-00001' }));
  });

  test('a los correos de ejemplo no les envia correo, pero si el aviso', async () => {
    notificacionModel.tomarCitasParaRecordar.mockResolvedValue(['ci1']);
    notificacionModel.detalleCita.mockResolvedValue({ ...CITA, cliente_correo: 'maria@demo.udes.co' });
    await servicio.recordarCitasProximas();
    expect(creadas()).toHaveLength(1);
    expect(correoService.enviarRecordatorioCita).not.toHaveBeenCalled();
  });

  test('si el correo falla, el aviso queda y no se interrumpe', async () => {
    notificacionModel.tomarCitasParaRecordar.mockResolvedValue(['ci1', 'ci2']);
    correoService.enviarRecordatorioCita.mockRejectedValue(new Error('smtp'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(await servicio.recordarCitasProximas()).toBe(2);
    expect(creadas()).toHaveLength(2);
    console.error.mockRestore();
  });

  test('sin citas proximas no hace nada', async () => {
    notificacionModel.tomarCitasParaRecordar.mockResolvedValue([]);
    expect(await servicio.recordarCitasProximas()).toBe(0);
    expect(notificacionModel.crear).not.toHaveBeenCalled();
  });
});
