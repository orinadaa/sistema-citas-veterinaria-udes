// tests/usuario.controller.test.js
// RF-04 (gestion de roles) y RF-05 (restriccion por rol) sobre /api/usuarios.

jest.mock('../src/models/usuario.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const usuarioModel = require('../src/models/usuario.model');

function tokenPara(rol) {
  return jwt.sign({ id: 'admin1', rol }, process.env.JWT_SECRET);
}

describe('Rutas /api/usuarios (protegidas para administrador)', () => {
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
      .set('Authorization', `Bearer ${tokenPara('administrador')}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuarios).toHaveLength(1);
  });

  test('POST /api/usuarios rechaza rol "cliente" (debe usarse /api/auth/registro)', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenPara('administrador')}`)
      .send({
        nombreCompleto: 'Vet Nuevo',
        correo: 'vet@correo.com',
        contrasena: 'password123',
        rol: 'cliente',
        sedeId: 'sede1',
      });

    expect(respuesta.status).toBe(400);
  });

  test('POST /api/usuarios crea personal veterinario correctamente', async () => {
    usuarioModel.crearPersonal.mockResolvedValue({
      id: 'u3',
      nombre_completo: 'Vet Nuevo',
      correo: 'vet@correo.com',
      rol: 'veterinario',
      sede_id: 'sede1',
    });

    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenPara('administrador')}`)
      .send({
        nombreCompleto: 'Vet Nuevo',
        correo: 'vet@correo.com',
        contrasena: 'password123',
        rol: 'veterinario',
        sedeId: 'sede1',
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.usuario.rol).toBe('veterinario');
  });

  test('PATCH /api/usuarios/:id/rol rechaza un rol invalido', async () => {
    const respuesta = await request(app)
      .patch('/api/usuarios/u1/rol')
      .set('Authorization', `Bearer ${tokenPara('administrador')}`)
      .send({ rol: 'superadmin' });

    expect(respuesta.status).toBe(400);
  });

  test('PATCH /api/usuarios/:id/rol exige sede para roles de personal', async () => {
    const respuesta = await request(app)
      .patch('/api/usuarios/u1/rol')
      .set('Authorization', `Bearer ${tokenPara('administrador')}`)
      .send({ rol: 'veterinario' });

    expect(respuesta.status).toBe(400);
  });

  test('PATCH /api/usuarios/:id/rol responde 404 si el usuario no existe', async () => {
    usuarioModel.actualizarRol.mockResolvedValue(null);

    const respuesta = await request(app)
      .patch('/api/usuarios/no-existe/rol')
      .set('Authorization', `Bearer ${tokenPara('administrador')}`)
      .send({ rol: 'cliente' });

    expect(respuesta.status).toBe(404);
  });

  test('PATCH /api/usuarios/:id/rol actualiza el rol correctamente', async () => {
    usuarioModel.actualizarRol.mockResolvedValue({ id: 'u1', rol: 'cliente', sede_id: null });

    const respuesta = await request(app)
      .patch('/api/usuarios/u1/rol')
      .set('Authorization', `Bearer ${tokenPara('administrador')}`)
      .send({ rol: 'cliente' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario.rol).toBe('cliente');
  });
});
