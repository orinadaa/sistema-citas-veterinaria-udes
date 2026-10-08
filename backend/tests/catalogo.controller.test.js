// tests/catalogo.controller.test.js
// Catalogos gestionados por el superadministrador: categorias de servicio
// (= especialidades) y especies y razas. Modelo simulado.

jest.mock('../src/models/catalogo.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const catalogoModel = require('../src/models/catalogo.model');

const TOKEN_SUPER = jwt.sign({ id: 'super-1', rol: 'superadministrador' }, process.env.JWT_SECRET);
const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const con = (peticion, token = TOKEN_SUPER) => peticion.set('Authorization', 'Bearer ' + token);
const duplicado = Object.assign(new Error('duplicado'), { code: '23505' });

beforeEach(() => jest.clearAllMocks());

describe('Permisos de /api/catalogos', () => {
  test('la lista de especies y razas activas es publica y solo trae nombres', async () => {
    catalogoModel.listarEspecies.mockResolvedValue([
      { id: 'e1', nombre: 'Canino', icono: 'perro', orden: 0, activo: true, mascotas: 3, razas: [{ id: 'r1', nombre: 'Beagle', activo: true, mascotas: 1 }] },
    ]);
    const respuesta = await request(app).get('/api/catalogos/especies');
    expect(respuesta.status).toBe(200);
    expect(catalogoModel.listarEspecies).toHaveBeenCalledWith({ soloActivas: true });
    expect(respuesta.body.especies).toEqual([{ id: 'e1', nombre: 'Canino', icono: 'perro', razas: ['Beagle'] }]);
  });

  test.each([
    ['ver las especies de administracion', () => request(app).get('/api/catalogos/especies/admin')],
    ['crear una especie', () => request(app).post('/api/catalogos/especies').send({ nombre: 'Reptil' })],
    ['editar una especie', () => request(app).put('/api/catalogos/especies/e1').send({ activo: false })],
    ['crear una raza', () => request(app).post('/api/catalogos/especies/e1/razas').send({ nombre: 'Iguana' })],
    ['editar una raza', () => request(app).put('/api/catalogos/razas/r1').send({ activo: false })],
    ['ver las categorias', () => request(app).get('/api/catalogos/categorias')],
    ['crear una categoria', () => request(app).post('/api/catalogos/categorias').send({ nombre: 'X', color: 'blue' })],
    ['editar una categoria', () => request(app).put('/api/catalogos/categorias/c1').send({ activo: false })],
  ])('el administrador de sede no puede %s (403)', async (_nombre, peticion) => {
    expect((await con(peticion(), TOKEN_ADMIN)).status).toBe(403);
    expect(catalogoModel.crearEspecie).not.toHaveBeenCalled();
    expect(catalogoModel.actualizarCategoria).not.toHaveBeenCalled();
  });

  test('no existe ninguna ruta para eliminar', async () => {
    expect((await con(request(app).delete('/api/catalogos/especies/e1'))).status).toBe(404);
    expect((await con(request(app).delete('/api/catalogos/razas/r1'))).status).toBe(404);
    expect((await con(request(app).delete('/api/catalogos/categorias/c1'))).status).toBe(404);
  });
});

describe('Categorias de servicio', () => {
  test('crea una categoria limpiando espacios del nombre', async () => {
    catalogoModel.crearCategoria.mockResolvedValue({ id: 'c9', nombre: 'Fisioterapia', color: 'teal', activo: true });
    const respuesta = await con(request(app).post('/api/catalogos/categorias')).send({ nombre: '  Fisioterapia  ', color: 'teal' });
    expect(respuesta.status).toBe(201);
    expect(catalogoModel.crearCategoria).toHaveBeenCalledWith({ nombre: 'Fisioterapia', color: 'teal' });
  });

  test('rechaza nombre vacio, nombre largo y color fuera de la paleta', async () => {
    expect((await con(request(app).post('/api/catalogos/categorias')).send({ nombre: ' ', color: 'teal' })).status).toBe(400);
    expect((await con(request(app).post('/api/catalogos/categorias')).send({ nombre: 'x'.repeat(41), color: 'teal' })).status).toBe(400);
    expect((await con(request(app).post('/api/catalogos/categorias')).send({ nombre: 'Nueva', color: 'rojo' })).status).toBe(400);
    expect(catalogoModel.crearCategoria).not.toHaveBeenCalled();
  });

  test('avisa si el nombre ya existe (409)', async () => {
    catalogoModel.crearCategoria.mockRejectedValue(duplicado);
    const respuesta = await con(request(app).post('/api/catalogos/categorias')).send({ nombre: 'Consulta', color: 'blue' });
    expect(respuesta.status).toBe(409);
  });

  test('desactiva una categoria sin tocar nombre ni color', async () => {
    catalogoModel.actualizarCategoria.mockResolvedValue({ id: 'c1', nombre: 'Consulta', color: 'blue', activo: false });
    const respuesta = await con(request(app).put('/api/catalogos/categorias/c1')).send({ activo: false });
    expect(respuesta.status).toBe(200);
    expect(catalogoModel.actualizarCategoria).toHaveBeenCalledWith('c1', { nombre: undefined, color: undefined, activo: false });
  });

  test('404 si la categoria no existe; 400 si el estado no es booleano', async () => {
    catalogoModel.actualizarCategoria.mockResolvedValue(null);
    expect((await con(request(app).put('/api/catalogos/categorias/nada')).send({ nombre: 'Otra' })).status).toBe(404);
    expect((await con(request(app).put('/api/catalogos/categorias/c1')).send({ activo: 'no' })).status).toBe(400);
  });
});

describe('Especies y razas', () => {
  test('crea una especie; sin icono usa la huella', async () => {
    catalogoModel.crearEspecie.mockResolvedValue({ id: 'e9', nombre: 'Reptil', icono: 'pata', orden: 4, activo: true });
    const respuesta = await con(request(app).post('/api/catalogos/especies')).send({ nombre: 'Reptil' });
    expect(respuesta.status).toBe(201);
    expect(catalogoModel.crearEspecie).toHaveBeenCalledWith({ nombre: 'Reptil', icono: 'pata' });
    expect(respuesta.body.especie.razas).toEqual([]);
  });

  test('rechaza un icono que no esta en la lista y un nombre repetido', async () => {
    expect((await con(request(app).post('/api/catalogos/especies')).send({ nombre: 'Reptil', icono: 'dragon' })).status).toBe(400);
    catalogoModel.crearEspecie.mockRejectedValue(duplicado);
    expect((await con(request(app).post('/api/catalogos/especies')).send({ nombre: 'Canino' })).status).toBe(409);
  });

  test('renombrar una especie pasa la especie actual al modelo (para corregir las mascotas)', async () => {
    const actual = { id: 'e1', nombre: 'Canino', icono: 'perro', orden: 0, activo: true };
    catalogoModel.buscarEspecie.mockResolvedValue(actual);
    catalogoModel.actualizarEspecie.mockResolvedValue({ ...actual, nombre: 'Perro' });
    const respuesta = await con(request(app).put('/api/catalogos/especies/e1')).send({ nombre: 'Perro' });
    expect(respuesta.status).toBe(200);
    expect(catalogoModel.actualizarEspecie).toHaveBeenCalledWith(actual, { nombre: 'Perro', icono: undefined, activo: undefined });
  });

  test('404 si la especie o la raza no existen', async () => {
    catalogoModel.buscarEspecie.mockResolvedValue(null);
    catalogoModel.buscarRaza.mockResolvedValue(null);
    expect((await con(request(app).put('/api/catalogos/especies/nada')).send({ activo: false })).status).toBe(404);
    expect((await con(request(app).post('/api/catalogos/especies/nada/razas')).send({ nombre: 'Iguana' })).status).toBe(404);
    expect((await con(request(app).put('/api/catalogos/razas/nada')).send({ activo: false })).status).toBe(404);
  });

  test('crea una raza dentro de la especie y avisa si ya existe', async () => {
    catalogoModel.buscarEspecie.mockResolvedValue({ id: 'e1', nombre: 'Canino' });
    catalogoModel.crearRaza.mockResolvedValue({ id: 'r9', especie_id: 'e1', nombre: 'Galgo', activo: true });
    const creada = await con(request(app).post('/api/catalogos/especies/e1/razas')).send({ nombre: ' Galgo ' });
    expect(creada.status).toBe(201);
    expect(catalogoModel.crearRaza).toHaveBeenCalledWith('e1', 'Galgo');

    catalogoModel.crearRaza.mockRejectedValue(duplicado);
    expect((await con(request(app).post('/api/catalogos/especies/e1/razas')).send({ nombre: 'Galgo' })).status).toBe(409);
  });

  test('desactiva una raza', async () => {
    const actual = { id: 'r1', especie_id: 'e1', nombre: 'Beagle', activo: true, especie_nombre: 'Canino' };
    catalogoModel.buscarRaza.mockResolvedValue(actual);
    catalogoModel.actualizarRaza.mockResolvedValue({ ...actual, activo: false });
    const respuesta = await con(request(app).put('/api/catalogos/razas/r1')).send({ activo: false });
    expect(respuesta.status).toBe(200);
    expect(catalogoModel.actualizarRaza).toHaveBeenCalledWith(actual, { nombre: undefined, activo: false });
  });
});
