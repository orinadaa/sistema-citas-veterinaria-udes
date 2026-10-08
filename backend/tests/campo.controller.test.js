// tests/campo.controller.test.js
// Campos personalizados administrables: definiciones (solo administrador,
// sin eliminar) y sus valores en la mascota.

jest.mock('../src/models/definicionCampo.model');
jest.mock('../src/models/mascota.model');
jest.mock('../src/models/usuario.model');
jest.mock('../src/models/pacienteMedico.model');

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const definicionCampoModel = require('../src/models/definicionCampo.model');
const mascotaModel = require('../src/models/mascota.model');

const ID_CLIENTE = 'cliente-1';
const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'superadministrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);
const TOKEN_CLIENTE = jwt.sign({ id: ID_CLIENTE, rol: 'cliente' }, process.env.JWT_SECRET);
const ID_CAMPO = '44444444-4444-4444-8444-444444444444';
const CARPETA = path.join(__dirname, '..', 'uploads', 'adjuntos');
const PDF = Buffer.from('%PDF-1.4\n%prueba\n');

const campo = (extra) => ({ id: ID_CAMPO, entidad: 'mascota', clave: 'microchip', etiqueta: 'Microchip', tipo: 'texto_corto', opciones: [], requerido: false, activo: true, ...extra });

let archivosAntes;
const listar = () => (fs.existsSync(CARPETA) ? fs.readdirSync(CARPETA) : []);
const archivosNuevos = () => listar().filter((f) => !archivosAntes.has(f));

beforeEach(() => {
  jest.clearAllMocks();
  archivosAntes = new Set(listar());
});
afterEach(() => {
  archivosNuevos().forEach((f) => fs.unlinkSync(path.join(CARPETA, f)));
});

describe('GET /api/campos', () => {
  test('exige sesion', async () => {
    expect((await request(app).get('/api/campos?entidad=mascota')).status).toBe(401);
  });

  test('un cliente puede leer las definiciones de mascota', async () => {
    definicionCampoModel.listar.mockResolvedValue([campo()]);
    const respuesta = await request(app).get('/api/campos?entidad=mascota').set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.campos).toHaveLength(1);
  });

  test('rechaza una entidad que no admite campos', async () => {
    const respuesta = await request(app).get('/api/campos?entidad=usuario').set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(respuesta.status).toBe(400);
  });
});

describe('POST /api/campos', () => {
  const crear = (cuerpo, token = TOKEN_ADMIN) => request(app).post('/api/campos').set('Authorization', `Bearer ${token}`).send(cuerpo);

  test('rechaza a un cliente', async () => {
    expect((await crear({ entidad: 'mascota', etiqueta: 'X', tipo: 'texto_corto' }, TOKEN_CLIENTE)).status).toBe(403);
    expect(definicionCampoModel.crear).not.toHaveBeenCalled();
  });

  test('valida nombre y tipo', async () => {
    definicionCampoModel.listar.mockResolvedValue([]);
    expect((await crear({ entidad: 'mascota', etiqueta: ' ', tipo: 'texto_corto' })).status).toBe(400);
    expect((await crear({ entidad: 'mascota', etiqueta: 'Chip', tipo: 'color' })).status).toBe(400);
  });

  test('un campo de seleccion necesita al menos dos opciones', async () => {
    definicionCampoModel.listar.mockResolvedValue([]);
    const respuesta = await crear({ entidad: 'mascota', etiqueta: 'Estado', tipo: 'seleccion', opciones: ['Única'] });
    expect(respuesta.status).toBe(400);
  });

  test('genera la clave a partir del nombre, sin repetir una existente', async () => {
    definicionCampoModel.listar.mockResolvedValue([campo({ clave: 'numero_de_microchip', etiqueta: 'Otro nombre' })]);
    definicionCampoModel.crear.mockImplementation((datos) => ({ id: ID_CAMPO, ...datos }));
    const respuesta = await crear({ entidad: 'mascota', etiqueta: 'Número de microchip', tipo: 'texto_corto', requerido: true });
    expect(respuesta.status).toBe(201);
    expect(respuesta.body.campo.clave).toBe('numero_de_microchip_2');
  });

  test('no deja crear otro campo con el mismo nombre', async () => {
    definicionCampoModel.listar.mockResolvedValue([campo({ activo: false })]);
    const respuesta = await crear({ entidad: 'mascota', etiqueta: 'microchip', tipo: 'texto_corto' });
    expect(respuesta.status).toBe(409);
    expect(respuesta.body.mensaje).toMatch(/reactívalo/);
  });
});

describe('PUT /api/campos/:id', () => {
  const editar = (cuerpo) => request(app).put(`/api/campos/${ID_CAMPO}`).set('Authorization', `Bearer ${TOKEN_ADMIN}`).send(cuerpo);

  test('desactiva un campo (no lo elimina)', async () => {
    definicionCampoModel.buscarPorId.mockResolvedValue(campo());
    definicionCampoModel.actualizar.mockResolvedValue(campo({ activo: false }));
    const respuesta = await editar({ activo: false });
    expect(respuesta.status).toBe(200);
    expect(definicionCampoModel.actualizar).toHaveBeenCalledWith(ID_CAMPO, expect.objectContaining({ activo: false }));
  });

  test('no permite cambiar el tipo', async () => {
    definicionCampoModel.buscarPorId.mockResolvedValue(campo());
    const respuesta = await editar({ tipo: 'numero' });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toMatch(/no se puede cambiar/);
    expect(definicionCampoModel.actualizar).not.toHaveBeenCalled();
  });

  test('las opciones se fusionan: las que no llegan se conservan', async () => {
    const opciones = [
      { valor: 'a', etiqueta: 'A', activo: true },
      { valor: 'b', etiqueta: 'B', activo: true },
      { valor: 'c', etiqueta: 'C', activo: true },
    ];
    definicionCampoModel.buscarPorId.mockResolvedValue(campo({ tipo: 'seleccion', opciones }));
    definicionCampoModel.actualizar.mockImplementation((id, datos) => campo({ tipo: 'seleccion', ...datos }));
    const respuesta = await editar({ opciones: [{ valor: 'c', etiqueta: 'C', activo: false }] });
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.campo.opciones).toEqual([opciones[0], opciones[1], { valor: 'c', etiqueta: 'C', activo: false }]);
  });

  test('deben quedar al menos dos opciones activas', async () => {
    definicionCampoModel.buscarPorId.mockResolvedValue(
      campo({ tipo: 'seleccion', opciones: [{ valor: 'a', etiqueta: 'A', activo: true }, { valor: 'b', etiqueta: 'B', activo: true }] })
    );
    expect((await editar({ opciones: [{ valor: 'b', etiqueta: 'B', activo: false }] })).status).toBe(400);
  });
});

describe('no existe eliminar', () => {
  test('DELETE /api/campos/:id responde 404', async () => {
    const respuesta = await request(app).delete(`/api/campos/${ID_CAMPO}`).set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(respuesta.status).toBe(404);
  });
});

describe('valores en la mascota', () => {
  test('crear una mascota exige los campos personalizados obligatorios', async () => {
    definicionCampoModel.listar.mockResolvedValue([campo({ requerido: true })]);
    const respuesta = await request(app)
      .post('/api/mascotas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nombre: 'Luna', especie: 'Canino', raza: 'Criollo / mestizo' });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('"Microchip" es obligatorio.');
    expect(mascotaModel.crear).not.toHaveBeenCalled();
  });

  test('crear guarda los valores validados', async () => {
    definicionCampoModel.listar.mockResolvedValue([campo({ requerido: true })]);
    mascotaModel.crear.mockImplementation((datos) => ({ id: 'm1', ...datos }));
    const respuesta = await request(app)
      .post('/api/mascotas')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ nombre: 'Luna', especie: 'Canino', raza: 'Criollo / mestizo', camposAdicionales: { microchip: ' 985-1 ', otro: 'x' } });
    expect(respuesta.status).toBe(201);
    expect(mascotaModel.crear).toHaveBeenCalledWith(expect.objectContaining({ camposAdicionales: { microchip: '985-1' } }));
  });

  test('editar conserva el valor de un campo desactivado', async () => {
    definicionCampoModel.listar.mockResolvedValue([campo({ activo: false }), campo({ clave: 'color_collar', etiqueta: 'Color del collar' })]);
    mascotaModel.buscarPorId.mockResolvedValue({ id: 'm1', cliente_id: ID_CLIENTE, campos_adicionales: { microchip: 'HISTORICO' } });
    mascotaModel.actualizar.mockImplementation((id, datos) => ({ id, ...datos }));
    const respuesta = await request(app)
      .put('/api/mascotas/m1')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
      .send({ camposAdicionales: { microchip: 'CAMBIO', color_collar: 'Rojo' } });
    expect(respuesta.status).toBe(200);
    expect(mascotaModel.actualizar).toHaveBeenCalledWith('m1', expect.objectContaining({ camposAdicionales: { microchip: 'HISTORICO', color_collar: 'Rojo' } }));
  });

  test('editar sin camposAdicionales no los toca', async () => {
    mascotaModel.buscarPorId.mockResolvedValue({ id: 'm1', cliente_id: ID_CLIENTE, campos_adicionales: { microchip: 'X' } });
    mascotaModel.actualizar.mockImplementation((id, datos) => ({ id, ...datos }));
    await request(app).put('/api/mascotas/m1').set('Authorization', `Bearer ${TOKEN_CLIENTE}`).send({ nombre: 'Luna' });
    expect(mascotaModel.actualizar.mock.calls[0][1].camposAdicionales).toBeUndefined();
    expect(definicionCampoModel.listar).not.toHaveBeenCalled();
  });
});

describe('POST /api/mascotas/:id/campos/:clave/archivo', () => {
  const subir = (token, contenido = PDF, tipo = 'application/pdf') =>
    request(app)
      .post('/api/mascotas/m1/campos/certificado/archivo')
      .set('Authorization', `Bearer ${token}`)
      .attach('archivo', contenido, { filename: 'Certificado Luna.pdf', contentType: tipo });

  test('rechaza un archivo que no es PDF, JPG ni PNG', async () => {
    const respuesta = await subir(TOKEN_CLIENTE, Buffer.from('hola'), 'text/plain');
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toMatch(/PDF, JPG o PNG/);
  });

  test('responde 403 si la mascota es de otro cliente y no deja el archivo en disco', async () => {
    mascotaModel.buscarPorId.mockResolvedValue({ id: 'm1', cliente_id: 'otro' });
    const respuesta = await subir(TOKEN_CLIENTE);
    expect(respuesta.status).toBe(403);
    expect(archivosNuevos()).toHaveLength(0);
  });

  test('responde 404 si la clave no es un campo de tipo archivo', async () => {
    mascotaModel.buscarPorId.mockResolvedValue({ id: 'm1', cliente_id: ID_CLIENTE });
    definicionCampoModel.buscarPorClave.mockResolvedValue(campo({ clave: 'certificado', tipo: 'texto_corto' }));
    const respuesta = await subir(TOKEN_CLIENTE);
    expect(respuesta.status).toBe(404);
    expect(archivosNuevos()).toHaveLength(0);
  });

  test('guarda la ruta, el nombre original y el tipo del adjunto', async () => {
    mascotaModel.buscarPorId.mockResolvedValue({ id: 'm1', cliente_id: ID_CLIENTE });
    definicionCampoModel.buscarPorClave.mockResolvedValue(campo({ clave: 'certificado', tipo: 'archivo' }));
    mascotaModel.guardarCampoAdicional.mockImplementation((id, clave, valor) => ({ mascota: { id, campos_adicionales: { [clave]: valor } }, anterior: null }));
    const respuesta = await subir(TOKEN_CLIENTE);
    expect(respuesta.status).toBe(200);
    const adjunto = respuesta.body.mascota.campos_adicionales.certificado;
    expect(adjunto.url).toMatch(/^\/uploads\/adjuntos\/[0-9a-f-]+\.pdf$/);
    expect(adjunto).toMatchObject({ nombre: 'Certificado Luna.pdf', tipo: 'application/pdf' });
    expect(archivosNuevos()).toHaveLength(1);
  });

  test('no se puede quitar el adjunto de un campo obligatorio y activo', async () => {
    mascotaModel.buscarPorId.mockResolvedValue({ id: 'm1', cliente_id: ID_CLIENTE });
    definicionCampoModel.buscarPorClave.mockResolvedValue(campo({ clave: 'certificado', tipo: 'archivo', requerido: true }));
    const respuesta = await request(app).delete('/api/mascotas/m1/campos/certificado/archivo').set('Authorization', `Bearer ${TOKEN_CLIENTE}`);
    expect(respuesta.status).toBe(400);
    expect(mascotaModel.guardarCampoAdicional).not.toHaveBeenCalled();
  });
});
