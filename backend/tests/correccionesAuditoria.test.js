// tests/correccionesAuditoria.test.js
// Reglas que se agregaron al corregir la auditoria del 11 de octubre de 2026
// (docs/auditoria_sistema_2026-10-11.pdf): registro, inicio de sesion,
// sesiones, mascotas, horario de atencion y copia de seguridad.
jest.mock('../src/config/db', () => ({ pool: { query: jest.fn() } }));
jest.mock('../src/models/usuario.model');
jest.mock('../src/models/registroPendiente.model');
jest.mock('../src/models/mascota.model');
jest.mock('../src/models/pacienteMedico.model');
jest.mock('../src/models/horario.model');
jest.mock('../src/models/sede.model');
jest.mock('../src/models/bitacora.model');
jest.mock('../src/services/correo.service');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const usuarioModel = require('../src/models/usuario.model');
const mascotaModel = require('../src/models/mascota.model');
const pacienteMedicoModel = require('../src/models/pacienteMedico.model');
const horarioModel = require('../src/models/horario.model');
const sedeModel = require('../src/models/sede.model');
const { errorContrasena } = require('../src/utils/contrasena.util');
const { esFechaReal, normalizarCorreo } = require('../src/utils/validacion');
const { franjasQueOcupa } = require('../src/utils/franjas');

const firmar = (datos, opciones) => jwt.sign(datos, process.env.JWT_SECRET, opciones);
const TOKEN_VET = firmar({ id: 'vet-1', rol: 'veterinario', sedeId: 'sede-1' });
const TOKEN_ADMIN = firmar({ id: 'admin-1', rol: 'administrador', sedeId: 'sede-1' });
const TOKEN_SUPER = firmar({ id: 'super-1', rol: 'superadministrador' });
const REGISTRO = { nombreCompleto: 'Ana Pérez', correo: 'Ana@Correo.com', contrasena: 'UnaFraseLarga9', autorizaTratamiento: true };

beforeEach(() => jest.clearAllMocks());
afterEach(() => {
  delete process.env.VERIFICAR_ACTIVO_EN_PRUEBAS;
});

describe('Registro', () => {
  const registrar = (datos) => request(app).post('/api/auth/registro').send({ ...REGISTRO, ...datos });

  test('guarda el correo en minusculas y deja constancia de la autorizacion', async () => {
    const registroPendienteModel = require('../src/models/registroPendiente.model');
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    registroPendienteModel.guardar.mockResolvedValue('s1');
    const respuesta = await registrar({});
    expect(respuesta.status).toBe(202);
    expect(registroPendienteModel.guardar).toHaveBeenCalledWith(expect.objectContaining({ correo: 'ana@correo.com' }));

    registroPendienteModel.buscarPorCorreo.mockResolvedValue({
      id: 's1',
      correo: 'ana@correo.com',
      nombre_completo: 'Ana Pérez',
      contrasena_hash: 'hash',
      telefono: null,
      codigo_hash: await bcrypt.hash('123456', 4),
      intentos: 0,
      expira_en: new Date(Date.now() + 60000),
    });
    usuarioModel.crearCliente.mockResolvedValue({ id: 'c1', nombre_completo: 'Ana Pérez', correo: 'ana@correo.com', rol: 'cliente' });
    const confirmada = await request(app).post('/api/auth/registro/verificar').send({ correo: ' Ana@Correo.com', solicitudId: 's1', codigo: '123456' });
    expect(confirmada.status).toBe(201);
    expect(usuarioModel.crearCliente).toHaveBeenCalledWith(expect.objectContaining({ correo: 'ana@correo.com', autorizaTratamiento: true }));
  });

  test('sin autorizar el tratamiento de datos no crea la cuenta', async () => {
    const respuesta = await registrar({ autorizaTratamiento: false });
    expect(respuesta.status).toBe(400);
    expect(usuarioModel.crearCliente).not.toHaveBeenCalled();
  });

  test('rechaza el campo trampa lleno, nombres largos o con enlaces, telefonos invalidos y claves comunes', async () => {
    expect((await registrar({ sitioWeb: 'http://spam.example' })).status).toBe(400);
    expect((await registrar({ nombreCompleto: 'A'.repeat(200) })).status).toBe(400);
    expect((await registrar({ nombreCompleto: 'Gana dinero en https://estafa.example' })).status).toBe(400);
    expect((await registrar({ telefono: '0'.repeat(31) })).status).toBe(400);
    expect((await registrar({ contrasena: '12345678' })).status).toBe(400);
    expect(usuarioModel.crearCliente).not.toHaveBeenCalled();
  });
});

describe('Inicio de sesion', () => {
  test('busca el correo en minusculas y sin espacios', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    await request(app).post('/api/auth/login').send({ correo: '  Ana@Correo.COM ', contrasena: 'loQueSea123' });
    expect(usuarioModel.buscarPorCorreo).toHaveBeenCalledWith('ana@correo.com');
  });

  test('la clave temporal del personal vence a las 72 horas', async () => {
    const hash = await bcrypt.hash('Temporal123x', 4);
    const cuenta = { id: 'v1', correo: 'vet@clinica.co', contrasena_hash: hash, rol: 'veterinario', activo: true, debe_cambiar_contrasena: true };
    usuarioModel.buscarPorCorreo.mockResolvedValue({ ...cuenta, creado_en: new Date(Date.now() - 80 * 3600000) });
    const vencida = await request(app).post('/api/auth/login').send({ correo: 'vet@clinica.co', contrasena: 'Temporal123x' });
    expect(vencida.status).toBe(403);
    expect(vencida.body.codigo).toBe('CLAVE_TEMPORAL_VENCIDA');

    usuarioModel.buscarPorCorreo.mockResolvedValue({ ...cuenta, creado_en: new Date(Date.now() - 2 * 3600000) });
    const vigente = await request(app).post('/api/auth/login').send({ correo: 'vet@clinica.co', contrasena: 'Temporal123x' });
    expect(vigente.status).toBe(200);
  });
});

describe('Sesiones', () => {
  test('el rol y la sede salen de la base, no del token: un cambio de rol vale de inmediato', async () => {
    process.env.VERIFICAR_ACTIVO_EN_PRUEBAS = '1';
    // El token dice "administrador", pero la cuenta ya es "cliente".
    const token = firmar({ id: 'degradado-1', rol: 'administrador', sedeId: 'sede-1' });
    pool.query.mockResolvedValue({ rows: [{ activo: true, rol: 'cliente', sede_id: null, desde: null }] });
    const respuesta = await request(app).get('/api/administracion/medicos').set('Authorization', `Bearer ${token}`);
    expect(respuesta.status).toBe(403);
  });

  test('un token anterior al ultimo cambio de contraseña deja de servir', async () => {
    process.env.VERIFICAR_ACTIVO_EN_PRUEBAS = '1';
    const ahora = Math.floor(Date.now() / 1000);
    const tokenViejo = firmar({ id: 'cambio-clave-1', rol: 'cliente', iat: ahora - 3600 });
    pool.query.mockResolvedValue({ rows: [{ activo: true, rol: 'cliente', sede_id: null, desde: String(ahora - 60) }] });
    const respuesta = await request(app).get('/api/notificaciones').set('Authorization', `Bearer ${tokenViejo}`);
    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe('SESION_TERMINADA');
  });
});

describe('Mascotas', () => {
  test('el medico no consulta las mascotas de un cliente que no es paciente suyo', async () => {
    pacienteMedicoModel.esPacienteDe.mockResolvedValue(false);
    const respuesta = await request(app).get('/api/mascotas').query({ clienteId: 'c9' }).set('Authorization', `Bearer ${TOKEN_VET}`);
    expect(respuesta.status).toBe(403);
    expect(mascotaModel.listarPorCliente).not.toHaveBeenCalled();
  });

  test('la foto no se puede fijar con una direccion escrita a mano', async () => {
    mascotaModel.buscarPorId.mockResolvedValue({ id: 'm1', cliente_id: 'c1' });
    mascotaModel.actualizar.mockResolvedValue({ id: 'm1' });
    const respuesta = await request(app)
      .put('/api/mascotas/m1')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ color: 'Negro', fotoUrl: 'https://rastreador.example/pixel.png' });
    expect(respuesta.status).toBe(200);
    expect(mascotaModel.actualizar.mock.calls[0][1].fotoUrl).toBeUndefined();
  });

  test('rechaza textos demasiado largos y fechas de nacimiento imposibles o futuras', async () => {
    const editar = (datos) => request(app).put('/api/mascotas/m1').set('Authorization', `Bearer ${TOKEN_ADMIN}`).send(datos);
    expect((await editar({ nombre: 'L'.repeat(101) })).status).toBe(400);
    expect((await editar({ fechaNacimiento: '2020-02-31' })).status).toBe(400);
    expect((await editar({ fechaNacimiento: '2999-01-01' })).status).toBe(400);
    expect(mascotaModel.actualizar).not.toHaveBeenCalled();
  });
});

describe('Horario de atencion', () => {
  const guardar = (horaInicio, horaFin) =>
    request(app).put('/api/horarios').set('Authorization', `Bearer ${TOKEN_ADMIN}`).send({ sedeId: 'sede-1', diaSemana: 1, horaInicio, horaFin });

  test('valida el formato de las horas y compara en minutos', async () => {
    expect((await guardar('9:00', '17:00')).status).toBe(400);
    expect((await guardar('25:99', '26:00')).status).toBe(400);
    expect((await guardar('08:10', '17:00')).status).toBe(400);
    expect(horarioModel.upsertDia).not.toHaveBeenCalled();
  });

  test('al guardar avisa cuantas citas quedan fuera del horario nuevo (pasan a por reagendar)', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: 'sede-1' });
    horarioModel.upsertDia.mockResolvedValue({ dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '12:00:00' });
    horarioModel.listarCitasFueraDeHorario.mockResolvedValue([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    jest.spyOn(require('../src/models/cita.model'), 'marcarPorReagendar').mockResolvedValue(['a', 'b', 'c']);
    const respuesta = await guardar('09:00', '12:00');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.citasAfectadas).toBe(3);
  });
});

describe('Copia de seguridad', () => {
  const pedir = (cuerpo) => request(app).post('/api/datos/respaldo').set('Authorization', `Bearer ${TOKEN_SUPER}`).send(cuerpo);

  test('pide de nuevo la contraseña y rechaza una incorrecta', async () => {
    expect((await pedir({})).status).toBe(400);
    usuarioModel.buscarConHashPorId.mockResolvedValue({ id: 'super-1', contrasena_hash: await bcrypt.hash('LaCorrecta99', 4) });
    expect((await pedir({ contrasena: 'otra-cosa' })).status).toBe(403);
  });

  test('ya no se descarga con una simple peticion GET', async () => {
    const respuesta = await request(app).get('/api/datos/respaldo').set('Authorization', `Bearer ${TOKEN_SUPER}`);
    expect(respuesta.headers['content-type']).not.toMatch(/sql/);
  });
});

describe('Reglas sueltas', () => {
  test('contraseñas: minimo 8, no comunes, no un solo caracter, no el correo, maximo 72 bytes', () => {
    expect(errorContrasena('corta')).toMatch(/8 caracteres/);
    expect(errorContrasena('password')).toMatch(/adivinar/);
    expect(errorContrasena('aaaaaaaaaa')).toMatch(/adivinar/);
    expect(errorContrasena('ana@correo.com', 'ana@correo.com')).toMatch(/correo/);
    expect(errorContrasena('x'.repeat(80))).toMatch(/72/);
    expect(errorContrasena('MiPerroSeLlamaTobi7')).toBeNull();
  });

  test('fechas reales, correos normalizados y franjas segun la duracion', () => {
    expect(esFechaReal('2026-02-28')).toBe(true);
    expect(esFechaReal('2026-02-31')).toBe(false);
    expect(normalizarCorreo('  Ana@Correo.COM ')).toBe('ana@correo.com');
    const inicio = new Date(2030, 0, 7, 8, 0);
    expect(franjasQueOcupa(inicio, 30)).toHaveLength(1);
    expect(franjasQueOcupa(inicio, 90)).toHaveLength(3);
    expect(franjasQueOcupa(inicio, 45)[1].getMinutes()).toBe(30);
  });
});
