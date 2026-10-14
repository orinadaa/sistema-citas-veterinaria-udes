// tests/textoSitio.test.js
// Textos de marca de la pagina publica (/api/textos): lectura publica con los
// originales por defecto y cambios solo del superadministrador.

jest.mock('../src/config/db', () => ({ pool: { query: jest.fn(), connect: jest.fn() } }));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { TEXTOS_SITIO, limpiarTexto } = require('../src/utils/textosSitio');

const firmar = (datos) => jwt.sign(datos, process.env.JWT_SECRET);
const SUPER = firmar({ id: 'su', rol: 'superadministrador' });
const ADMIN = firmar({ id: 'a1', rol: 'administrador', sedeId: 's1' });
const con = (peticion, token) => peticion.set('Authorization', 'Bearer ' + token);
const original = (clave) => TEXTOS_SITIO.find((t) => t.clave === clave).original;

let cliente;
beforeEach(() => {
  jest.clearAllMocks();
  cliente = { query: jest.fn().mockResolvedValue({ rows: [] }), release: jest.fn() };
  pool.connect.mockResolvedValue(cliente);
  // Usuario activo para los middlewares y, por defecto, sin textos cambiados.
  pool.query.mockImplementation(async (sql) => {
    if (/FROM usuario/i.test(sql)) return { rows: [{ id: 'su', rol: 'superadministrador', sede_id: null, activo: true, token_version: 0 }] };
    return { rows: [] };
  });
});

describe('Textos originales', () => {
  test('el frontend tiene los mismos textos originales que el backend', () => {
    const fs = require('fs');
    const path = require('path');
    const fuente = fs.readFileSync(path.join(__dirname, '../../frontend/src/utils/textosSitio.js'), 'utf8');
    for (const t of TEXTOS_SITIO) {
      const encontrado = new RegExp(`${t.clave}: '([^']*)'`).exec(fuente);
      expect([t.clave, encontrado?.[1]]).toEqual([t.clave, t.original]);
    }
  });

  test('cada original cabe en su largo maximo', () => {
    for (const t of TEXTOS_SITIO) expect(t.original.length).toBeLessThanOrEqual(t.maximo);
  });
});

describe('limpiarTexto', () => {
  test('deja una sola linea sin espacios repetidos ni caracteres de control', () => {
    expect(limpiarTexto('  Hola\n\nmundo\t  ')).toBe('Hola mundo');
    expect(limpiarTexto('a\u0000b')).toBe('a b');
  });
});

describe('/api/textos', () => {
  test('sin cambios guardados devuelve todos los textos originales', async () => {
    const respuesta = await request(app).get('/api/textos');
    expect(respuesta.status).toBe(200);
    expect(Object.keys(respuesta.body.textos)).toHaveLength(TEXTOS_SITIO.length);
    expect(respuesta.body.textos.hero_titulo).toBe(original('hero_titulo'));
  });

  test('un texto cambiado reemplaza al original', async () => {
    pool.query.mockResolvedValue({ rows: [{ clave: 'hero_titulo', valor: 'Bienvenidos a la clínica', actualizado_en: new Date() }] });
    const respuesta = await request(app).get('/api/textos');
    expect(respuesta.body.textos.hero_titulo).toBe('Bienvenidos a la clínica');
    expect(respuesta.body.textos.hero_descripcion).toBe(original('hero_descripcion'));
  });

  test('una clave guardada que ya no existe en la lista se ignora', async () => {
    pool.query.mockResolvedValue({ rows: [{ clave: 'clave_vieja', valor: 'x' }] });
    const respuesta = await request(app).get('/api/textos');
    expect(respuesta.body.textos.clave_vieja).toBeUndefined();
  });

  test('solo el superadministrador ve la lista de edicion y la cambia', async () => {
    expect((await request(app).get('/api/textos/admin')).status).toBe(401);
    expect((await con(request(app).get('/api/textos/admin'), ADMIN)).status).toBe(403);
    expect((await con(request(app).put('/api/textos'), ADMIN).send({ textos: { hero_titulo: 'x' } })).status).toBe(403);
    const lista = await con(request(app).get('/api/textos/admin'), SUPER);
    expect(lista.status).toBe(200);
    expect(lista.body.textos[0]).toMatchObject({ clave: 'hero_titulo', original: original('hero_titulo'), personalizado: false });
  });

  test('guarda el texto limpio y deja constancia de quien lo cambio', async () => {
    const respuesta = await con(request(app).put('/api/textos'), SUPER).send({ textos: { hero_titulo: '  Cuidamos   de\ntu mascota ' } });
    expect(respuesta.status).toBe(200);
    const insercion = cliente.query.mock.calls.find(([sql]) => /INSERT INTO texto_sitio/.test(sql));
    expect(insercion[1]).toEqual(['hero_titulo', 'Cuidamos de tu mascota', 'su']);
    expect(cliente.query).toHaveBeenCalledWith('COMMIT');
  });

  test('escribir el texto original o enviar null vuelve al original (borra el cambio)', async () => {
    await con(request(app).put('/api/textos'), SUPER).send({ textos: { sedes_titulo: original('sedes_titulo'), hero_descripcion: null } });
    const borrado = cliente.query.mock.calls.find(([sql]) => /DELETE FROM texto_sitio/.test(sql));
    expect(borrado[1]).toEqual([['sedes_titulo', 'hero_descripcion']]);
  });

  test('rechaza claves desconocidas, textos muy largos, vacios obligatorios y valores que no son texto', async () => {
    const put = (textos) => con(request(app).put('/api/textos'), SUPER).send({ textos });
    expect((await put({ otra_cosa: 'x' })).status).toBe(400);
    expect((await put({ hero_titulo: 'a'.repeat(71) })).status).toBe(400);
    expect((await put({ hero_titulo: '   ' })).status).toBe(400);
    expect((await put({ hero_titulo: 5 })).status).toBe(400);
    expect((await put({})).status).toBe(400);
    expect(cliente.query).not.toHaveBeenCalled();
  });

  test('los textos opcionales (viñetas, parte destacada) si pueden quedar vacios', async () => {
    const respuesta = await con(request(app).put('/api/textos'), SUPER).send({ textos: { hero_vineta_2: '' } });
    expect(respuesta.status).toBe(200);
    const insercion = cliente.query.mock.calls.find(([sql]) => /INSERT INTO texto_sitio/.test(sql));
    expect(insercion[1]).toEqual(['hero_vineta_2', '', 'su']);
  });

  test('si falla la base, deshace todo', async () => {
    cliente.query.mockImplementation(async (sql) => {
      if (/INSERT/.test(sql)) throw new Error('falla');
      return { rows: [] };
    });
    const respuesta = await con(request(app).put('/api/textos'), SUPER).send({ textos: { hero_titulo: 'Nuevo título' } });
    expect(respuesta.status).toBe(500);
    expect(cliente.query).toHaveBeenCalledWith('ROLLBACK');
    expect(cliente.release).toHaveBeenCalled();
  });
});
