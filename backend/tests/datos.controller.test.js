// tests/datos.controller.test.js
// Modulo "Datos" del superadministrador: explorador de solo lectura,
// exportacion, bitacora y correcciones puntuales. Modelos simulados.

jest.mock('../src/models/bitacora.model');
jest.mock('../src/models/datos.model', () => {
  const real = jest.requireActual('../src/models/datos.model');
  return {
    ENTIDADES: real.ENTIDADES,
    columnasDe: real.columnasDe,
    listar: jest.fn(),
    obtener: jest.fn(),
    buscarUsuario: jest.fn(),
    buscarMascota: jest.fn(),
    buscarCita: jest.fn(),
    corregirUsuario: jest.fn(),
    reasignarMascota: jest.fn(),
    reactivarMascota: jest.fn(),
    cambiarEstadoCita: jest.fn(),
    cambiarMedicoCita: jest.fn(),
    medicosParaCita: jest.fn(),
  };
});

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const datosModel = require('../src/models/datos.model');
const bitacoraModel = require('../src/models/bitacora.model');
const { resumir } = require('../src/middlewares/bitacora.middleware');

const TOKEN_SUPER = jwt.sign({ id: 'super-1', rol: 'superadministrador' }, process.env.JWT_SECRET);
const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const con = (peticion, token = TOKEN_SUPER) => peticion.set('Authorization', 'Bearer ' + token);

beforeEach(() => jest.clearAllMocks());

describe('Permisos de /api/datos', () => {
  test.each([
    ['ver las entidades', () => request(app).get('/api/datos')],
    ['explorar usuarios', () => request(app).get('/api/datos/usuarios')],
    ['exportar', () => request(app).get('/api/datos/citas/exportar')],
    ['ver la bitacora', () => request(app).get('/api/datos/bitacora')],
    ['descargar la copia de seguridad', () => request(app).get('/api/datos/respaldo')],
    ['corregir una cuenta', () => request(app).put('/api/datos/usuarios/u1/corregir').send({ telefono: '3001112233' })],
    ['reasignar una mascota', () => request(app).put('/api/datos/mascotas/m1/dueno').send({ clienteId: 'c2' })],
    ['corregir una cita', () => request(app).put('/api/datos/citas/x/corregir').send({ estado: 'cancelada' })],
  ])('el administrador de sede no puede %s (403)', async (_nombre, peticion) => {
    expect((await con(peticion(), TOKEN_ADMIN)).status).toBe(403);
    expect(datosModel.listar).not.toHaveBeenCalled();
    expect(datosModel.corregirUsuario).not.toHaveBeenCalled();
  });

  test('no hay rutas para eliminar ni para editar tablas libremente', async () => {
    expect((await con(request(app).delete('/api/datos/usuarios/u1'))).status).toBe(404);
    expect((await con(request(app).put('/api/datos/usuarios/u1')).send({ rol: 'administrador' })).status).toBe(404);
    expect((await con(request(app).post('/api/datos/usuarios')).send({})).status).toBe(404);
  });
});

describe('Explorador de solo lectura', () => {
  test('lista las entidades con sus columnas, sin contraseñas ni ids internos', async () => {
    const respuesta = await con(request(app).get('/api/datos'));
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.entidades.map((e) => e.nombre)).toEqual(['usuarios', 'mascotas', 'citas', 'servicios', 'sedes', 'horarios']);
    const todas = JSON.stringify(respuesta.body.entidades);
    expect(todas).not.toMatch(/contrasena|hash|cliente_id|medico_id/);
  });

  test('pasa busqueda, pagina, orden y filtros al modelo', async () => {
    datosModel.listar.mockResolvedValue({ filas: [{ id: 'u1', nombre: 'Ana' }], total: 31 });
    const respuesta = await con(request(app).get('/api/datos/usuarios').query({ busqueda: ' ana ', pagina: 2, orden: 'nombre', direccion: 'desc', rol: 'cliente' }));
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ total: 31, pagina: 2, porPagina: 25 });
    expect(datosModel.listar).toHaveBeenCalledWith(
      'usuarios',
      expect.objectContaining({ busqueda: 'ana', orden: 'nombre', direccion: 'desc', limite: 25, desplazamiento: 25, filtros: { rol: 'cliente' } })
    );
  });

  test('una entidad que no existe responde 404 y no consulta nada', async () => {
    const respuesta = await con(request(app).get('/api/datos/contrasenas'));
    expect(respuesta.status).toBe(404);
    expect(datosModel.listar).not.toHaveBeenCalled();
  });

  test('el detalle de un registro incluye sus columnas; 404 si no existe', async () => {
    datosModel.obtener.mockResolvedValue({ id: 'm1', nombre: 'Luna', cliente_id: 'c1' });
    const respuesta = await con(request(app).get('/api/datos/mascotas/m1'));
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.columnas.some((c) => c.clave === 'dueno_correo')).toBe(true);
    datosModel.obtener.mockResolvedValue(null);
    expect((await con(request(app).get('/api/datos/mascotas/nada'))).status).toBe(404);
  });

  test('exporta a CSV con encabezados legibles y neutraliza formulas', async () => {
    datosModel.listar.mockResolvedValue({
      filas: [{ id: 's1', nombre: '=CMD()', categoria: 'Consulta; general', precio: 60000, duracion: 30, activo: true }],
      total: 1,
    });
    const respuesta = await con(request(app).get('/api/datos/servicios/exportar'));
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers['content-type']).toMatch(/text\/csv/);
    expect(respuesta.headers['content-disposition']).toMatch(/servicios-\d{4}-\d{2}-\d{2}\.csv/);
    const [encabezado, fila] = respuesta.text.replace('﻿', '').trim().split('\r\n');
    expect(encabezado).toBe('Nombre;Categoría;Precio;Duración (min);Activo');
    expect(fila).toBe(`'=CMD();"Consulta; general";60000;30;Sí`);
  });
});

describe('Bitacora', () => {
  test('lista con busqueda y pagina', async () => {
    bitacoraModel.listar.mockResolvedValue({ filas: [], total: 0 });
    const respuesta = await con(request(app).get('/api/datos/bitacora').query({ busqueda: 'sede', pagina: 3 }));
    expect(respuesta.status).toBe(200);
    expect(bitacoraModel.listar).toHaveBeenCalledWith({ busqueda: 'sede', limite: 25, desplazamiento: 50 });
  });

  test('el resumen nunca guarda contraseñas, codigos ni tokens', () => {
    const texto = resumir({ nombreCompleto: 'Ana', contrasena: 'secreta', contrasenaNueva: 'x', codigo: '123456', token: 't', activo: false });
    expect(texto).toBe('nombreCompleto: Ana · activo: false');
    expect(resumir({})).toBeNull();
  });

  test('una accion exitosa se registra con quien la hizo y sobre que', async () => {
    process.env.BITACORA_EN_PRUEBAS = '1';
    bitacoraModel.registrar.mockResolvedValue();
    datosModel.buscarMascota.mockResolvedValue({ id: 'm1', nombre: 'Luna', cliente_id: 'c1', activo: false });
    await con(request(app).put('/api/datos/mascotas/m1/reactivar'));
    await new Promise((listo) => setImmediate(listo));
    delete process.env.BITACORA_EN_PRUEBAS;
    expect(bitacoraModel.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: 'super-1', usuarioRol: 'superadministrador', accion: 'Reactivar mascota', entidad: 'mascota', entidadId: 'm1' })
    );
  });

  test('una accion rechazada no se registra', async () => {
    process.env.BITACORA_EN_PRUEBAS = '1';
    datosModel.buscarMascota.mockResolvedValue(null);
    await con(request(app).put('/api/datos/mascotas/nada/reactivar'));
    await new Promise((listo) => setImmediate(listo));
    delete process.env.BITACORA_EN_PRUEBAS;
    expect(bitacoraModel.registrar).not.toHaveBeenCalled();
  });
});

describe('Correccion de una cuenta', () => {
  const CLIENTE = { id: 'c1', nombre_completo: 'Ana', correo: 'ana@correo.com', rol: 'cliente', activo: true };

  test('corrige nombre, telefono y correo (en minusculas)', async () => {
    datosModel.buscarUsuario.mockResolvedValue(CLIENTE);
    datosModel.corregirUsuario.mockResolvedValue({ id: 'c1' });
    const respuesta = await con(request(app).put('/api/datos/usuarios/c1/corregir')).send({ nombreCompleto: ' Ana María ', correo: 'ANA@Correo.com', telefono: '300 111 2233' });
    expect(respuesta.status).toBe(200);
    expect(datosModel.corregirUsuario).toHaveBeenCalledWith('c1', { nombreCompleto: 'Ana María', telefono: '300 111 2233', correo: 'ana@correo.com' });
  });

  test('rechaza correo invalido, nombre vacio, telefono con letras y peticion vacia', async () => {
    datosModel.buscarUsuario.mockResolvedValue(CLIENTE);
    const enviar = (cuerpo) => con(request(app).put('/api/datos/usuarios/c1/corregir')).send(cuerpo);
    expect((await enviar({ correo: 'sin-arroba' })).status).toBe(400);
    expect((await enviar({ nombreCompleto: '  ' })).status).toBe(400);
    expect((await enviar({ telefono: 'abc' })).status).toBe(400);
    expect((await enviar({})).status).toBe(400);
    expect(datosModel.corregirUsuario).not.toHaveBeenCalled();
  });

  test('no toca al superadministrador; 404 si no existe; 409 si el correo ya esta en uso', async () => {
    datosModel.buscarUsuario.mockResolvedValue({ ...CLIENTE, rol: 'superadministrador' });
    expect((await con(request(app).put('/api/datos/usuarios/s1/corregir')).send({ telefono: '3001112233' })).status).toBe(403);
    datosModel.buscarUsuario.mockResolvedValue(null);
    expect((await con(request(app).put('/api/datos/usuarios/nada/corregir')).send({ telefono: '3001112233' })).status).toBe(404);
    datosModel.buscarUsuario.mockResolvedValue(CLIENTE);
    datosModel.corregirUsuario.mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' }));
    expect((await con(request(app).put('/api/datos/usuarios/c1/corregir')).send({ correo: 'otro@correo.com' })).status).toBe(409);
  });
});

describe('Correcciones de mascotas', () => {
  const MASCOTA = { id: 'm1', nombre: 'Luna', cliente_id: 'c1', activo: true };

  test('reasigna la mascota y sus citas a otro cliente activo', async () => {
    datosModel.buscarMascota.mockResolvedValue(MASCOTA);
    datosModel.buscarUsuario.mockResolvedValue({ id: 'c2', nombre_completo: 'Beto', rol: 'cliente', activo: true });
    datosModel.reasignarMascota.mockResolvedValue({ citasMovidas: 3 });
    const respuesta = await con(request(app).put('/api/datos/mascotas/m1/dueno')).send({ clienteId: 'c2' });
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.citasMovidas).toBe(3);
    expect(datosModel.reasignarMascota).toHaveBeenCalledWith('m1', 'c2');
  });

  test('el destino debe ser un cliente activo y distinto del dueño actual', async () => {
    datosModel.buscarMascota.mockResolvedValue(MASCOTA);
    const enviar = () => con(request(app).put('/api/datos/mascotas/m1/dueno')).send({ clienteId: 'x' });
    datosModel.buscarUsuario.mockResolvedValue({ id: 'v1', rol: 'veterinario', activo: true });
    expect((await enviar()).status).toBe(400);
    datosModel.buscarUsuario.mockResolvedValue({ id: 'c2', rol: 'cliente', activo: false });
    expect((await enviar()).status).toBe(400);
    datosModel.buscarUsuario.mockResolvedValue({ id: 'c1', rol: 'cliente', activo: true });
    expect((await enviar()).status).toBe(400);
    datosModel.buscarUsuario.mockResolvedValue(null);
    expect((await enviar()).status).toBe(400);
    expect(datosModel.reasignarMascota).not.toHaveBeenCalled();
  });

  test('reactiva una mascota dada de baja; no si ya esta activa', async () => {
    datosModel.buscarMascota.mockResolvedValue({ ...MASCOTA, activo: false });
    expect((await con(request(app).put('/api/datos/mascotas/m1/reactivar'))).status).toBe(200);
    expect(datosModel.reactivarMascota).toHaveBeenCalledWith('m1');
    datosModel.buscarMascota.mockResolvedValue(MASCOTA);
    expect((await con(request(app).put('/api/datos/mascotas/m1/reactivar'))).status).toBe(400);
  });
});

describe('Correccion de una cita', () => {
  const CITA = { id: 'ci1', estado: 'agendada', medico_id: 'v1', sede_id: 's1', servicio_id: 'sv1' };

  test('cambia el estado', async () => {
    datosModel.buscarCita.mockResolvedValue(CITA);
    const respuesta = await con(request(app).put('/api/datos/citas/ci1/corregir')).send({ estado: 'cancelada' });
    expect(respuesta.status).toBe(200);
    expect(datosModel.cambiarEstadoCita).toHaveBeenCalledWith('ci1', 'cancelada');
    expect(datosModel.cambiarMedicoCita).not.toHaveBeenCalled();
  });

  test('reasigna solo a un medico activo de esa sede que preste el servicio', async () => {
    datosModel.buscarCita.mockResolvedValue(CITA);
    datosModel.medicosParaCita.mockResolvedValue([{ id: 'v1' }, { id: 'v2' }]);
    expect((await con(request(app).put('/api/datos/citas/ci1/corregir')).send({ medicoId: 'v2' })).status).toBe(200);
    expect(datosModel.cambiarMedicoCita).toHaveBeenCalledWith('ci1', 'v2');
    jest.clearAllMocks();
    datosModel.buscarCita.mockResolvedValue(CITA);
    datosModel.medicosParaCita.mockResolvedValue([{ id: 'v1' }]);
    expect((await con(request(app).put('/api/datos/citas/ci1/corregir')).send({ medicoId: 'v9' })).status).toBe(400);
    expect(datosModel.cambiarMedicoCita).not.toHaveBeenCalled();
  });

  test('rechaza un estado desconocido y una peticion vacia; 404 si no existe', async () => {
    datosModel.buscarCita.mockResolvedValue(CITA);
    expect((await con(request(app).put('/api/datos/citas/ci1/corregir')).send({ estado: 'atendida' })).status).toBe(400);
    expect((await con(request(app).put('/api/datos/citas/ci1/corregir')).send({})).status).toBe(400);
    datosModel.buscarCita.mockResolvedValue(null);
    expect((await con(request(app).put('/api/datos/citas/nada/corregir')).send({ estado: 'cancelada' })).status).toBe(404);
  });

  test('avisa si el medico ya tiene otra cita a esa hora (409)', async () => {
    datosModel.buscarCita.mockResolvedValue({ ...CITA, estado: 'cancelada' });
    datosModel.cambiarEstadoCita.mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' }));
    const respuesta = await con(request(app).put('/api/datos/citas/ci1/corregir')).send({ estado: 'agendada' });
    expect(respuesta.status).toBe(409);
  });
});
