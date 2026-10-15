// tests/administracion.controller.test.js
// RF-10/RF-11 (medicos y especialidades por sede), RF-12 (seguimiento
// de citas).

jest.mock('../src/models/medico.model');
jest.mock('../src/models/servicio.model');
jest.mock('../src/models/categoriaServicio.model');
jest.mock('../src/models/cita.model');
jest.mock('../src/models/usuario.model');
jest.mock('../src/models/mascota.model');
jest.mock('../src/models/paciente.model');
jest.mock('../src/services/correo.service');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const medicoModel = require('../src/models/medico.model');
const servicioModel = require('../src/models/servicio.model');
const categoriaServicioModel = require('../src/models/categoriaServicio.model');
const citaModel = require('../src/models/cita.model');
const usuarioModel = require('../src/models/usuario.model');
const mascotaModel = require('../src/models/mascota.model');
const pacienteModel = require('../src/models/paciente.model');
const correoService = require('../src/services/correo.service');

const ID_SEDE = 'sede-1';
const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: ID_SEDE }, process.env.JWT_SECRET);
const TOKEN_VET = jwt.sign({ id: 'vet-1', rol: 'veterinario', sedeId: ID_SEDE }, process.env.JWT_SECRET);
const TOKEN_CLIENTE = jwt.sign({ id: 'cliente-1', rol: 'cliente' }, process.env.JWT_SECRET);

describe('GET /api/administracion/medicos', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza a un veterinario (solo administrador)', async () => {
    const respuesta = await request(app)
      .get('/api/administracion/medicos')
      .set('Authorization', `Bearer ${TOKEN_VET}`);
    expect(respuesta.status).toBe(403);
  });

  test('lista los medicos de la sede del administrador', async () => {
    medicoModel.listarConServicios.mockResolvedValue([
      { id: 'vet-1', nombre_completo: 'Dra. Ejemplo', servicios: [{ id: 's1', nombre: 'Consulta médica' }] },
    ]);

    const respuesta = await request(app)
      .get('/api/administracion/medicos')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(200);
    expect(medicoModel.listarConServicios).toHaveBeenCalledWith(ID_SEDE);
    expect(respuesta.body.medicos).toHaveLength(1);
  });
});

describe('POST /api/administracion/medicos', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza a un veterinario', async () => {
    const respuesta = await request(app)
      .post('/api/administracion/medicos')
      .set('Authorization', `Bearer ${TOKEN_VET}`)
      .send({ nombreCompleto: 'Dr. Nuevo', correo: 'nuevo@udes.edu.co', documento: '123456' });
    expect(respuesta.status).toBe(403);
  });

  test('rechaza sin correo', async () => {
    const respuesta = await request(app)
      .post('/api/administracion/medicos')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombreCompleto: 'Dr. Nuevo', documento: '123456' });
    expect(respuesta.status).toBe(400);
  });

  test('rechaza sin documento de identidad', async () => {
    const respuesta = await request(app)
      .post('/api/administracion/medicos')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombreCompleto: 'Dr. Nuevo', correo: 'nuevo@udes.edu.co' });
    expect(respuesta.status).toBe(400);
  });

  test('rechaza crear un médico sin teléfono', async () => {
    const respuesta = await request(app)
      .post('/api/administracion/medicos')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombreCompleto: 'Dra. Ejemplo', correo: 'ejemplo@udes.edu.co', documento: '123456' });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toMatch(/teléfono/i);
  });

  test('rechaza documentos con letras y teléfonos que no tengan 10 dígitos', async () => {
    const documentoInvalido = await request(app)
      .post('/api/administracion/medicos')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombreCompleto: 'Dra. Ejemplo', correo: 'ejemplo@udes.edu.co', documento: 'AB1234' });
    expect(documentoInvalido.status).toBe(400);

    const telefonoInvalido = await request(app)
      .post('/api/administracion/medicos')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombreCompleto: 'Dra. Ejemplo', correo: 'ejemplo@udes.edu.co', documento: '123456', telefono: '300 111 2233' });
    expect(telefonoInvalido.status).toBe(400);
  });

  test('responde 409 si el correo ya existe', async () => {
    medicoModel.crear.mockRejectedValue({ code: '23505' });

    const respuesta = await request(app)
      .post('/api/administracion/medicos')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombreCompleto: 'Dr. Nuevo', correo: 'repetido@udes.edu.co', documento: '123456', telefono: '3001112233' });

    expect(respuesta.status).toBe(409);
  });

  test('crea el medico en la sede del administrador con una contraseña autogenerada y envia el correo de credenciales', async () => {
    medicoModel.crear.mockResolvedValue('vet-nuevo');
    medicoModel.listarConServicios.mockResolvedValue([{ id: 'vet-nuevo', nombre_completo: 'Dr. Nuevo' }]);
    correoService.enviarCredenciales.mockResolvedValue();

    const respuesta = await request(app)
      .post('/api/administracion/medicos')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombreCompleto: 'Dr. Nuevo', correo: 'nuevo@udes.edu.co', documento: '123456', telefono: '3001112233' });

    expect(respuesta.status).toBe(201);
    expect(medicoModel.crear).toHaveBeenCalledWith(expect.objectContaining({ sedeId: ID_SEDE, documento: '123456' }));
    expect(medicoModel.crear.mock.calls[0][0]).not.toHaveProperty('contrasena');
    expect(respuesta.body.medico.id).toBe('vet-nuevo');
    expect(respuesta.body.correoEnviado).toBe(true);
    expect(correoService.enviarCredenciales).toHaveBeenCalledWith(
      expect.objectContaining({ correo: 'nuevo@udes.edu.co', rolEtiqueta: 'médico veterinario' })
    );
  });

  test('crea el medico aunque falle el envio del correo (best-effort, no bloquea la creacion)', async () => {
    medicoModel.crear.mockResolvedValue('vet-nuevo');
    medicoModel.listarConServicios.mockResolvedValue([{ id: 'vet-nuevo', nombre_completo: 'Dr. Nuevo' }]);
    correoService.enviarCredenciales.mockRejectedValue(new Error('SMTP caído'));

    const respuesta = await request(app)
      .post('/api/administracion/medicos')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombreCompleto: 'Dr. Nuevo', correo: 'nuevo@udes.edu.co', documento: '123456', telefono: '3001112233' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.correoEnviado).toBe(false);
  });
});

describe('PUT /api/administracion/medicos/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('responde 404 si el medico no existe', async () => {
    usuarioModel.buscarPorId.mockResolvedValue(null);

    const respuesta = await request(app)
      .put('/api/administracion/medicos/no-existe')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ biografia: 'Nueva bio' });

    expect(respuesta.status).toBe(404);
  });

  test('responde 403 si el medico es de otra sede', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-2', rol: 'veterinario', sede_id: 'otra-sede' });

    const respuesta = await request(app)
      .put('/api/administracion/medicos/vet-2')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ activo: false });

    expect(respuesta.status).toBe(403);
  });

  test('actualiza el perfil del medico', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-1', rol: 'veterinario', sede_id: ID_SEDE, activo: true });
    medicoModel.actualizar.mockResolvedValue(true);
    medicoModel.listarConServicios.mockResolvedValue([{ id: 'vet-1', nombre_completo: 'Dra. Ejemplo', telefono: '3001112233', activo: true }]);

    const respuesta = await request(app)
      .put('/api/administracion/medicos/vet-1')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ telefono: '3001112233' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.medico.telefono).toBe('3001112233');
    // El estado de la cuenta nunca viaja al modelo desde esta ruta.
    expect(medicoModel.actualizar.mock.calls[0][1].activo).toBeUndefined();
  });

  test('el administrador de sede no puede desactivar ni reactivar a un medico', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-1', rol: 'veterinario', sede_id: ID_SEDE, activo: true });
    const desactivar = await request(app)
      .put('/api/administracion/medicos/vet-1')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ activo: false });

    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-1', rol: 'veterinario', sede_id: ID_SEDE, activo: false });
    const reactivar = await request(app)
      .put('/api/administracion/medicos/vet-1')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ activo: true });

    expect(desactivar.status).toBe(403);
    expect(reactivar.status).toBe(403);
    expect(medicoModel.actualizar).not.toHaveBeenCalled();
  });
});

describe('PUT /api/administracion/medicos/:id/especialidades', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza si categoriaIds no es una lista', async () => {
    const respuesta = await request(app)
      .put('/api/administracion/medicos/vet-1/especialidades')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ categoriaIds: 'no-es-lista' });

    expect(respuesta.status).toBe(400);
  });

  test('rechaza si alguna categoria no existe', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-1', rol: 'veterinario', sede_id: ID_SEDE });
    categoriaServicioModel.existe.mockResolvedValue(false);

    const respuesta = await request(app)
      .put('/api/administracion/medicos/vet-1/especialidades')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ categoriaIds: ['cat-1'] });

    expect(respuesta.status).toBe(400);
  });

  test('actualiza las especialidades correctamente', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-1', rol: 'veterinario', sede_id: ID_SEDE });
    categoriaServicioModel.existe.mockResolvedValue(true);
    medicoModel.reemplazarEspecialidades.mockResolvedValue();
    medicoModel.listarConServicios.mockResolvedValue([
      { id: 'vet-1', nombre_completo: 'Dra. Ejemplo', especialidades: [{ id: 'cat-1', nombre: 'Consulta', color: 'blue' }] },
    ]);

    const respuesta = await request(app)
      .put('/api/administracion/medicos/vet-1/especialidades')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ categoriaIds: ['cat-1'] });

    expect(respuesta.status).toBe(200);
    expect(medicoModel.reemplazarEspecialidades).toHaveBeenCalledWith('vet-1', ['cat-1']);
  });
});

describe('PUT /api/administracion/medicos/:id/servicios', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza si servicioIds no es una lista', async () => {
    const respuesta = await request(app)
      .put('/api/administracion/medicos/vet-1/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ servicioIds: 'no-es-lista' });

    expect(respuesta.status).toBe(400);
  });

  test('responde 404 si el medico no existe', async () => {
    usuarioModel.buscarPorId.mockResolvedValue(null);

    const respuesta = await request(app)
      .put('/api/administracion/medicos/no-existe/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ servicioIds: [] });

    expect(respuesta.status).toBe(404);
  });

  test('responde 403 si el medico es de otra sede', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-2', rol: 'veterinario', sede_id: 'otra-sede' });

    const respuesta = await request(app)
      .put('/api/administracion/medicos/vet-2/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ servicioIds: [] });

    expect(respuesta.status).toBe(403);
  });

  test('actualiza las especialidades correctamente', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-1', rol: 'veterinario', sede_id: ID_SEDE });
    servicioModel.buscarPorId.mockResolvedValue({ id: 's1', nombre: 'Consulta médica' });
    medicoModel.reemplazarServicios.mockResolvedValue();
    medicoModel.listarConServicios.mockResolvedValue([
      { id: 'vet-1', nombre_completo: 'Dra. Ejemplo', servicios: [{ id: 's1', nombre: 'Consulta médica' }] },
    ]);

    const respuesta = await request(app)
      .put('/api/administracion/medicos/vet-1/servicios')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ servicioIds: ['s1'] });

    expect(respuesta.status).toBe(200);
    expect(medicoModel.reemplazarServicios).toHaveBeenCalledWith('vet-1', ['s1']);
  });
});

describe('GET /api/administracion/citas', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza a un cliente', async () => {
    const respuesta = await request(app)
      .get('/api/administracion/citas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(403);
  });

  test('el administrador ve las citas de su sede', async () => {
    citaModel.listarPorSede.mockResolvedValue([{ id: 'cita-1' }]);

    const respuesta = await request(app)
      .get('/api/administracion/citas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(200);
    expect(citaModel.listarPorSede).toHaveBeenCalledWith(ID_SEDE);
    expect(respuesta.body.citas).toHaveLength(1);
  });

  test('el veterinario ve solo sus propias citas', async () => {
    citaModel.listarPorMedico.mockResolvedValue([{ id: 'cita-2' }]);

    const respuesta = await request(app)
      .get('/api/administracion/citas')
      .set('Authorization', `Bearer ${TOKEN_VET}`);

    expect(respuesta.status).toBe(200);
    expect(citaModel.listarPorMedico).toHaveBeenCalledWith('vet-1');
  });
});

describe('GET /api/administracion/pacientes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza a un veterinario', async () => {
    const respuesta = await request(app)
      .get('/api/administracion/pacientes')
      .set('Authorization', `Bearer ${TOKEN_VET}`);
    expect(respuesta.status).toBe(403);
  });

  test('devuelve la lista de pacientes y las citas del mes', async () => {
    pacienteModel.listarClientes.mockResolvedValue([
      { id: 'cliente-1', nombre_completo: 'Oriana Duran', mascotas_total: 2, citas_total: 3 },
    ]);
    pacienteModel.contarCitasDelMes.mockResolvedValue(5);

    const respuesta = await request(app)
      .get('/api/administracion/pacientes')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.pacientes).toHaveLength(1);
    expect(respuesta.body.citasDelMes).toBe(5);
  });

  test('usa la sede de la sesion aunque la peticion pida otra', async () => {
    pacienteModel.listarClientes.mockResolvedValue([]);
    pacienteModel.contarCitasDelMes.mockResolvedValue(0);

    await request(app)
      .get('/api/administracion/pacientes?sedeId=otra-sede&busqueda=ana')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    const sedeDelAdministrador = jwt.decode(TOKEN_ADMIN).sedeId;
    expect(pacienteModel.listarClientes).toHaveBeenCalledWith({ sedeId: sedeDelAdministrador, busqueda: 'ana' });
    expect(pacienteModel.contarCitasDelMes).toHaveBeenCalledWith(sedeDelAdministrador);
  });
});

describe('GET /api/administracion/pacientes/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('responde 404 si el usuario no existe o no es cliente', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'vet-1', rol: 'veterinario' });

    const respuesta = await request(app)
      .get('/api/administracion/pacientes/vet-1')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(404);
  });

  test('responde 404 si el cliente no tiene citas en la sede del administrador', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'cliente-1', rol: 'cliente', nombre_completo: 'Oriana Duran' });
    citaModel.listarPorClienteEnSede.mockResolvedValue([]);

    const respuesta = await request(app)
      .get('/api/administracion/pacientes/cliente-1')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(404);
    expect(citaModel.listarPorClienteEnSede).toHaveBeenCalledWith('cliente-1', jwt.decode(TOKEN_ADMIN).sedeId);
    expect(mascotaModel.listarPorCliente).not.toHaveBeenCalled();
  });

  test('devuelve el cliente con sus mascotas y sus citas en la sede', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 'cliente-1', rol: 'cliente', nombre_completo: 'Oriana Duran' });
    mascotaModel.listarPorCliente.mockResolvedValue([{ id: 'm1', nombre: 'Luna' }]);
    citaModel.listarPorClienteEnSede.mockResolvedValue([{ id: 'c1', estado: 'agendada' }]);

    const respuesta = await request(app)
      .get('/api/administracion/pacientes/cliente-1')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mascotas).toHaveLength(1);
    expect(respuesta.body.citas).toHaveLength(1);
  });
});
