// tests/usuario.controller.test.js
// RF-04 (gestion de roles) y RF-05 (restriccion por rol) sobre /api/usuarios.

jest.mock('../src/models/usuario.model');
jest.mock('../src/services/correo.service');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const usuarioModel = require('../src/models/usuario.model');
const correoService = require('../src/services/correo.service');

function tokenPara(rol) {
  return jwt.sign({ id: 'admin1', rol }, process.env.JWT_SECRET);
}

describe('Rutas /api/usuarios (gestion de cuentas: superadministrador)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('GET /api/usuarios sin token responde 401', async () => {
    const respuesta = await request(app).get('/api/usuarios');
    expect(respuesta.status).toBe(401);
  });

  test('GET /api/usuarios con rol cliente responde 403', async () => {
    const respuesta = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${tokenPara('cliente')}`);

    expect(respuesta.status).toBe(403);
  });

  test('GET /api/usuarios con rol administrador responde 200 con la lista', async () => {
    usuarioModel.listarTodos.mockResolvedValue([{ id: 'u1', rol: 'cliente' }]);

    const respuesta = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${tokenPara('superadministrador')}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuarios).toHaveLength(1);
  });

  test('GET /api/usuarios?rol=cliente filtra por rol', async () => {
    usuarioModel.listarTodos.mockResolvedValue([{ id: 'u1', rol: 'cliente' }]);

    const respuesta = await request(app)
      .get('/api/usuarios?rol=cliente')
      .set('Authorization', `Bearer ${tokenPara('superadministrador')}`);

    expect(respuesta.status).toBe(200);
    expect(usuarioModel.listarTodos).toHaveBeenCalledWith('cliente');
  });

  test('GET /api/usuarios?rol=invalido responde 400', async () => {
    const respuesta = await request(app)
      .get('/api/usuarios?rol=superadmin')
      .set('Authorization', `Bearer ${tokenPara('superadministrador')}`);

    expect(respuesta.status).toBe(400);
  });

  test('POST /api/usuarios rechaza rol "cliente" (debe usarse /api/auth/registro)', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenPara('superadministrador')}`)
      .send({
        nombreCompleto: 'Vet Nuevo',
        correo: 'vet@correo.com',
        rol: 'cliente',
        sedeId: 'sede1',
      });

    expect(respuesta.status).toBe(400);
  });

  test('POST /api/usuarios exige teléfono para crear personal', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenPara('superadministrador')}`)
      .send({ nombreCompleto: 'Vet Nuevo', correo: 'vet@correo.com', rol: 'veterinario', sedeId: 'sede1' });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toMatch(/teléfono/i);
  });

  test('POST /api/usuarios crea personal veterinario con contraseña autogenerada y envia el correo de credenciales', async () => {
    usuarioModel.crearPersonal.mockResolvedValue({
      id: 'u3',
      nombre_completo: 'Vet Nuevo',
      correo: 'vet@correo.com',
      rol: 'veterinario',
      sede_id: 'sede1',
    });
    correoService.enviarCredenciales.mockResolvedValue();

    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenPara('superadministrador')}`)
      .send({
        nombreCompleto: 'Vet Nuevo',
        correo: 'vet@correo.com',
        rol: 'veterinario',
        sedeId: 'sede1',
        telefono: '3001112233',
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.usuario.rol).toBe('veterinario');
    expect(respuesta.body.correoEnviado).toBe(true);
    expect(usuarioModel.crearPersonal.mock.calls[0][0]).not.toHaveProperty('contrasena');
    expect(correoService.enviarCredenciales).toHaveBeenCalledWith(
      expect.objectContaining({ correo: 'vet@correo.com', rolEtiqueta: 'médico veterinario' })
    );
  });

  test('PATCH /api/usuarios/:id/rol rechaza un rol invalido', async () => {
    const respuesta = await request(app)
      .patch('/api/usuarios/u1/rol')
      .set('Authorization', `Bearer ${tokenPara('superadministrador')}`)
      .send({ rol: 'superadmin' });

    expect(respuesta.status).toBe(400);
  });

  test('PATCH /api/usuarios/:id/rol exige sede para roles de personal', async () => {
    const respuesta = await request(app)
      .patch('/api/usuarios/u1/rol')
      .set('Authorization', `Bearer ${tokenPara('superadministrador')}`)
      .send({ rol: 'veterinario' });

    expect(respuesta.status).toBe(400);
  });

  test('PATCH /api/usuarios/:id/rol responde 404 si el usuario no existe', async () => {
    usuarioModel.actualizarRol.mockResolvedValue(null);

    const respuesta = await request(app)
      .patch('/api/usuarios/no-existe/rol')
      .set('Authorization', `Bearer ${tokenPara('superadministrador')}`)
      .send({ rol: 'cliente' });

    expect(respuesta.status).toBe(404);
  });

  test('PATCH /api/usuarios/:id/rol actualiza el rol correctamente', async () => {
    usuarioModel.actualizarRol.mockResolvedValue({ id: 'u1', rol: 'cliente', sede_id: null });

    const respuesta = await request(app)
      .patch('/api/usuarios/u1/rol')
      .set('Authorization', `Bearer ${tokenPara('superadministrador')}`)
      .send({ rol: 'cliente' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario.rol).toBe('cliente');
  });

  test('PATCH /api/usuarios/:id actualiza activo/telefono correctamente', async () => {
    usuarioModel.actualizarPerfil.mockResolvedValue({ id: 'otro-usuario', activo: false });

    const respuesta = await request(app)
      .patch('/api/usuarios/otro-usuario')
      .set('Authorization', `Bearer ${tokenPara('superadministrador')}`)
      .send({ activo: false });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario.activo).toBe(false);
  });

  test('PATCH /api/usuarios/:id rechaza que un admin se desactive a si mismo', async () => {
    const respuesta = await request(app)
      .patch('/api/usuarios/admin1')
      .set('Authorization', `Bearer ${tokenPara('superadministrador')}`)
      .send({ activo: false });

    expect(respuesta.status).toBe(400);
  });

  test('PATCH /api/usuarios/:id responde 404 si el usuario no existe', async () => {
    usuarioModel.actualizarPerfil.mockResolvedValue(null);

    const respuesta = await request(app)
      .patch('/api/usuarios/no-existe')
      .set('Authorization', `Bearer ${tokenPara('superadministrador')}`)
      .send({ telefono: '3000000000' });

    expect(respuesta.status).toBe(404);
  });
});

describe('Rutas /api/usuarios para el administrador de sede', () => {
  beforeEach(() => jest.clearAllMocks());
  const TOKEN_ADMIN = jwt.sign({ id: 'admin-sede', rol: 'administrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);
  const conToken = (peticion) => peticion.set('Authorization', 'Bearer ' + TOKEN_ADMIN);

  test('puede listar clientes (para agendarles una cita)', async () => {
    usuarioModel.listarTodos.mockResolvedValue([]);
    const respuesta = await conToken(request(app).get('/api/usuarios').query({ rol: 'cliente' }));
    expect(respuesta.status).toBe(200);
    expect(usuarioModel.listarTodos).toHaveBeenCalledWith('cliente');
  });

  test('no puede listar al personal ni todas las cuentas', async () => {
    const todas = await conToken(request(app).get('/api/usuarios'));
    const medicos = await conToken(request(app).get('/api/usuarios').query({ rol: 'veterinario' }));
    expect(todas.status).toBe(403);
    expect(medicos.status).toBe(403);
    expect(usuarioModel.listarTodos).not.toHaveBeenCalled();
  });

  test('no puede crear personal ni cambiar roles', async () => {
    const crear = await conToken(request(app).post('/api/usuarios')).send({
      nombreCompleto: 'X',
      correo: 'x@udes.edu.co',
      rol: 'administrador',
      sedeId: 'sede-1',
    });
    const rol = await conToken(request(app).patch('/api/usuarios/u1/rol')).send({ rol: 'administrador', sedeId: 'sede-1' });
    expect(crear.status).toBe(403);
    expect(rol.status).toBe(403);
    expect(usuarioModel.crearPersonal).not.toHaveBeenCalled();
    expect(usuarioModel.actualizarRol).not.toHaveBeenCalled();
  });

  test('no puede activar ni desactivar ninguna cuenta (ni de clientes ni de personal)', async () => {
    const cliente = await conToken(request(app).patch('/api/usuarios/c1')).send({ activo: false });
    const reactivar = await conToken(request(app).patch('/api/usuarios/c1')).send({ activo: true });
    const personal = await conToken(request(app).patch('/api/usuarios/a2')).send({ activo: false });
    expect(cliente.status).toBe(403);
    expect(reactivar.status).toBe(403);
    expect(personal.status).toBe(403);
    expect(usuarioModel.actualizarPerfil).not.toHaveBeenCalled();
  });
});

describe('La cuenta del superadministrador no se toca desde el sistema', () => {
  beforeEach(() => jest.clearAllMocks());
  const conToken = (peticion) => peticion.set('Authorization', 'Bearer ' + tokenPara('superadministrador'));

  test('no se puede asignar el rol superadministrador', async () => {
    const respuesta = await conToken(request(app).patch('/api/usuarios/u1/rol')).send({ rol: 'superadministrador' });
    expect(respuesta.status).toBe(400);
    expect(usuarioModel.actualizarRol).not.toHaveBeenCalled();
  });

  test('no se puede cambiar el rol de un superadministrador', async () => {
    usuarioModel.buscarPorId.mockResolvedValue({ id: 's2', rol: 'superadministrador' });
    const respuesta = await conToken(request(app).patch('/api/usuarios/s2/rol')).send({ rol: 'cliente' });
    expect(respuesta.status).toBe(403);
    expect(usuarioModel.actualizarRol).not.toHaveBeenCalled();
  });
});
