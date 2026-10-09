// tests/superadministrador.test.js
// Reparto de permisos entre el administrador de sede y el
// superadministrador, y los paneles de inicio de cada uno.
// - Configurar el sistema (sedes, catalogo de servicios, galeria)
//   es del superadministrador: el administrador de sede recibe 403.
// - Cada panel de inicio es solo de su rol.

jest.mock('../src/models/tablero.model');
jest.mock('../src/models/sede.model');
jest.mock('../src/models/servicio.model');
jest.mock('../src/models/galeria.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const tableroModel = require('../src/models/tablero.model');
const sedeModel = require('../src/models/sede.model');
const servicioModel = require('../src/models/servicio.model');

const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const TOKEN_SUPER = jwt.sign({ id: 'super-1', rol: 'superadministrador' }, process.env.JWT_SECRET);
const TOKEN_VET = jwt.sign({ id: 'vet-1', rol: 'veterinario', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const con = (peticion, token) => peticion.set('Authorization', 'Bearer ' + token);

describe('El administrador de sede no configura el sistema', () => {
  beforeEach(() => jest.clearAllMocks());

  test.each([
    ['crear una sede', () => request(app).post('/api/sedes').send({ nombre: 'Nueva', ciudad: 'Cucuta' })],
    ['editar una sede', () => request(app).put('/api/sedes/sede-1').send({ nombre: 'Otra' })],
    ['crear un servicio', () => request(app).post('/api/servicios').send({ nombre: 'X' })],
    ['editar un servicio', () => request(app).put('/api/servicios/s1').send({ nombre: 'X' })],
    ['quitar la foto de un servicio', () => request(app).delete('/api/servicios/s1/foto')],
    ['ver la galeria de administracion', () => request(app).get('/api/galeria/admin')],
    ['reordenar la galeria', () => request(app).put('/api/galeria/orden').send({ ids: [] })],
  ])('no puede %s (403)', async (_nombre, peticion) => {
    const respuesta = await con(peticion(), TOKEN_ADMIN);
    expect(respuesta.status).toBe(403);
    expect(sedeModel.crear).not.toHaveBeenCalled();
    expect(servicioModel.crear).not.toHaveBeenCalled();
  });

  test('si puede consultar las sedes y el catalogo de servicios', async () => {
    sedeModel.listarTodas.mockResolvedValue([]);
    servicioModel.listarTodos.mockResolvedValue([]);
    const sedes = await con(request(app).get('/api/sedes/admin'), TOKEN_ADMIN);
    const servicios = await con(request(app).get('/api/servicios/admin'), TOKEN_ADMIN);
    expect(sedes.status).toBe(200);
    expect(servicios.status).toBe(200);
  });
});

describe('GET /api/administracion/tablero (inicio del administrador de sede)', () => {
  beforeEach(() => jest.clearAllMocks());

  const RESUMEN = {
    citasHoy: [{ id: 'c1' }],
    indicadores: { citas_hoy: 1, pendientes_hoy: 1, citas_semana: 4, canceladas_semana: 0 },
    porDia: [],
    medicosSinServicios: [{ id: 'm1', nombre_completo: 'Ana Ruiz' }],
    serviciosSinMedico: [{ id: 's1', nombre: 'Vacunación' }, { id: 's2', nombre: 'Cirugía' }],
    diasAbiertos: 0,
  };

  test('devuelve el dia de SU sede y arma los avisos', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: 'sede-1', nombre: 'Sede Uno', ciudad: 'Bucaramanga' });
    tableroModel.resumenSede.mockResolvedValue(RESUMEN);

    const respuesta = await con(request(app).get('/api/administracion/tablero'), TOKEN_ADMIN);

    expect(respuesta.status).toBe(200);
    expect(tableroModel.resumenSede).toHaveBeenCalledWith('sede-1');
    expect(respuesta.body.sede.nombre).toBe('Sede Uno');
    expect(respuesta.body.indicadores.citas_semana).toBe(4);
    expect(respuesta.body.avisos.map((a) => a.tipo)).toEqual(['horario', 'medicos', 'servicios']);
    expect(respuesta.body.avisos[2].detalle).toMatch(/Vacunación, Cirugía/);
  });

  test('sin nada pendiente no hay avisos', async () => {
    sedeModel.buscarPorId.mockResolvedValue({ id: 'sede-1', nombre: 'Sede Uno', ciudad: 'Bucaramanga' });
    tableroModel.resumenSede.mockResolvedValue({ ...RESUMEN, medicosSinServicios: [], serviciosSinMedico: [], diasAbiertos: 6 });
    const respuesta = await con(request(app).get('/api/administracion/tablero'), TOKEN_ADMIN);
    expect(respuesta.body.avisos).toEqual([]);
  });

  test('no es para el superadministrador ni para el medico', async () => {
    expect((await con(request(app).get('/api/administracion/tablero'), TOKEN_SUPER)).status).toBe(403);
    expect((await con(request(app).get('/api/administracion/tablero'), TOKEN_VET)).status).toBe(403);
    expect(tableroModel.resumenSede).not.toHaveBeenCalled();
  });
});

describe('GET /api/administracion/sistema (inicio del superadministrador)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('resume sedes y cuentas, y avisa lo que falta configurar', async () => {
    tableroModel.resumenSistema.mockResolvedValue({
      sedes: [
        { id: 'a', nombre: 'Sede A', activo: true, administradores: 1, medicos: 2, dias_abiertos: 6, citas_mes: 3 },
        { id: 'b', nombre: 'Sede B', activo: true, administradores: 0, medicos: 0, dias_abiertos: 0, citas_mes: 0 },
        { id: 'c', nombre: 'Sede C', activo: false, administradores: 0, medicos: 0, dias_abiertos: 0, citas_mes: 0 },
      ],
      cuentas: [
        { rol: 'cliente', activas: 5, inactivas: 1 },
        { rol: 'veterinario', activas: 4, inactivas: 1 },
      ],
      servicios: { activos: 9, sin_foto: 1, sin_medico: 0 },
      galeria: { visibles: 0, total: 0 },
    });

    const respuesta = await con(request(app).get('/api/administracion/sistema'), TOKEN_SUPER);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.cuentas).toEqual({ superadministrador: 0, administrador: 0, veterinario: 4, cliente: 5, inactivas: 2 });
    const titulos = respuesta.body.avisos.map((a) => a.titulo);
    expect(titulos).toEqual(
      expect.arrayContaining(['Sede B no tiene administrador', 'Sede B no tiene horario de atención', 'Sede B no tiene médicos activos', 'La galería de la portada está vacía'])
    );
    // Una sede desactivada no genera avisos.
    expect(titulos.some((t) => t.includes('Sede C'))).toBe(false);
  });

  test('no es para el administrador de sede', async () => {
    const respuesta = await con(request(app).get('/api/administracion/sistema'), TOKEN_ADMIN);
    expect(respuesta.status).toBe(403);
    expect(tableroModel.resumenSistema).not.toHaveBeenCalled();
  });
});
