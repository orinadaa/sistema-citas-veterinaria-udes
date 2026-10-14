// tests/fotoPrivada.test.js
// Las fotos de mascotas no son publicas: solo se entregan con un enlace
// firmado y vigente. El resto de /uploads sigue siendo contenido publico.

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');
const { firmar, esValida, firmarEnDatos } = require('../src/utils/fotoPrivada');

const HORA = 60 * 60 * 1000;
const RUTA = '/uploads/mascotas/foto-de-prueba.jpg';
const parametros = (enlace) => Object.fromEntries(new URLSearchParams(enlace.split('?')[1]));

describe('Enlaces firmados', () => {
  test('un enlace recien firmado es valido y vence despues de unas horas', () => {
    const enlace = firmar(RUTA);
    const { e, f } = parametros(enlace);
    expect(enlace.split('?')[0]).toBe(RUTA);
    expect(esValida(RUTA, e, f)).toBe(true);
    expect(esValida(RUTA, e, f, Date.now() + 14 * HORA)).toBe(false);
  });

  test('la firma no sirve para otra foto ni con otro vencimiento', () => {
    const { e, f } = parametros(firmar(RUTA));
    expect(esValida('/uploads/mascotas/otra.jpg', e, f)).toBe(false);
    expect(esValida(RUTA, Number(e) + HORA, f)).toBe(false);
    expect(esValida(RUTA, e, 'x'.repeat(32))).toBe(false);
    expect(esValida(RUTA, e, undefined)).toBe(false);
  });

  test('dentro de la misma hora el enlace no cambia', () => {
    const base = Math.floor(Date.now() / HORA) * HORA;
    expect(firmar(RUTA, base + 1000)).toBe(firmar(RUTA, base + 50 * 60 * 1000));
  });

  test('firma las fotos de mascotas de una respuesta y deja lo demas igual', () => {
    const fecha = new Date();
    const salida = firmarEnDatos({
      mascotas: [
        { id: 'm1', foto_url: RUTA },
        { id: 'm2', foto_url: null },
      ],
      sede: { foto_url: '/uploads/sedes/sede.jpg' },
      creado: fecha,
      total: 2,
    });
    expect(salida.mascotas[0].foto_url).toMatch(/^\/uploads\/mascotas\/foto-de-prueba\.jpg\?e=\d+&f=[0-9a-f]{32}$/);
    expect(salida.mascotas[1].foto_url).toBeNull();
    expect(salida.sede.foto_url).toBe('/uploads/sedes/sede.jpg');
    expect(salida.creado).toBe(fecha);
    expect(salida.total).toBe(2);
  });
});

describe('GET /uploads', () => {
  const carpeta = (nombre) => path.join(__dirname, '..', 'uploads', nombre);
  const privada = path.join(carpeta('mascotas'), 'foto-de-prueba.jpg');
  const publica = path.join(carpeta('galeria'), 'foto-de-prueba.jpg');

  beforeAll(() => {
    for (const archivo of [privada, publica]) {
      fs.mkdirSync(path.dirname(archivo), { recursive: true });
      fs.writeFileSync(archivo, 'imagen de prueba');
    }
  });
  afterAll(() => {
    for (const archivo of [privada, publica]) fs.rmSync(archivo, { force: true });
  });

  test('la foto de una mascota no se entrega sin enlace firmado', async () => {
    expect((await request(app).get(RUTA)).status).toBe(403);
    expect((await request(app).get(`${RUTA}?e=${Date.now() + HORA}&f=${'0'.repeat(32)}`)).status).toBe(403);
  });

  test('con un enlace firmado y vigente si se entrega, sin guardarse en caches compartidas', async () => {
    const respuesta = await request(app).get(firmar(RUTA));
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers['cache-control']).toMatch(/private/);
  });

  test('un enlace vencido deja de servir', async () => {
    const vencido = firmar(RUTA, Date.now() - 20 * HORA);
    expect((await request(app).get(vencido)).status).toBe(403);
  });

  test('las fotos de la pagina publica siguen abiertas', async () => {
    expect((await request(app).get('/uploads/galeria/foto-de-prueba.jpg')).status).toBe(200);
  });
});
