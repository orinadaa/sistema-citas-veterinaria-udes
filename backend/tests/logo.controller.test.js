// tests/logo.controller.test.js
// Logotipos de la clinica: lectura publica; subir un archivo y restaurar el
// original, solo el superadministrador.

jest.mock('../src/models/logo.model');

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const logoModel = require('../src/models/logo.model');

const TOKEN_SUPER = jwt.sign({ id: 'super-1', rol: 'superadministrador' }, process.env.JWT_SECRET);
const TOKEN_ADMIN = jwt.sign({ id: 'admin-1', rol: 'administrador', sedeId: 'sede-1' }, process.env.JWT_SECRET);

const CARPETA = path.join(__dirname, '..', 'uploads', 'logos');
// PNG valido de 1x1 pixel
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
// Cabecera de un WebP: "RIFF", tamaño, "WEBP".
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x1a, 0, 0, 0]), Buffer.from('WEBPVP8L'), Buffer.alloc(18)]);

let archivosAntes;
const archivosNuevos = () => (fs.existsSync(CARPETA) ? fs.readdirSync(CARPETA).filter((f) => !archivosAntes.has(f)) : []);

beforeEach(() => {
  jest.clearAllMocks();
  archivosAntes = new Set(fs.existsSync(CARPETA) ? fs.readdirSync(CARPETA) : []);
  logoModel.listar.mockResolvedValue([]);
  logoModel.buscarPorClave.mockResolvedValue(null);
});

// Ninguna prueba debe dejar archivos en uploads/.
afterEach(() => {
  archivosNuevos().forEach((f) => fs.unlinkSync(path.join(CARPETA, f)));
});

const subir = (clave, token, archivo = PNG, tipo = 'image/png') => {
  const peticion = request(app).post(`/api/logos/${clave}`);
  if (token) peticion.set('Authorization', `Bearer ${token}`);
  return archivo ? peticion.attach('foto', archivo, { filename: 'logo', contentType: tipo }) : peticion;
};

describe('GET /api/logos', () => {
  test('es publico y devuelve todos los logotipos; null en los que usan el original', async () => {
    logoModel.listar.mockResolvedValue([{ clave: 'corto_color', archivo_url: '/uploads/logos/a.png' }]);

    const respuesta = await request(app).get('/api/logos');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.logos).toEqual({
      principal_blanco: null,
      principal_color: null,
      corto_color: '/uploads/logos/a.png',
      corto_blanco: null,
      icono: null,
    });
  });
});

describe('POST /api/logos/:clave', () => {
  test('sin sesion responde 401 y con otro rol 403, sin guardar el archivo', async () => {
    expect((await subir('corto_color', null)).status).toBe(401);
    expect((await subir('corto_color', TOKEN_ADMIN)).status).toBe(403);
    expect(logoModel.guardar).not.toHaveBeenCalled();
    expect(archivosNuevos()).toHaveLength(0);
  });

  test('el superadministrador sube un PNG y queda registrado con su ruta publica', async () => {
    logoModel.guardar.mockResolvedValue({});

    const respuesta = await subir('principal_blanco', TOKEN_SUPER);

    expect(respuesta.status).toBe(200);
    expect(logoModel.guardar).toHaveBeenCalledWith('principal_blanco', expect.stringMatching(/^\/uploads\/logos\/[0-9a-f-]{36}\.png$/));
    expect(archivosNuevos()).toHaveLength(1);
    expect(respuesta.body.logos).toHaveProperty('principal_blanco');
  });

  test('acepta WebP', async () => {
    logoModel.guardar.mockResolvedValue({});

    const respuesta = await subir('icono', TOKEN_SUPER, WEBP, 'image/webp');

    expect(respuesta.status).toBe(200);
    expect(logoModel.guardar).toHaveBeenCalledWith('icono', expect.stringMatching(/\.webp$/));
  });

  test('al reemplazar borra del disco el archivo anterior', async () => {
    const anterior = path.join(CARPETA, 'anterior-de-prueba.png');
    fs.mkdirSync(CARPETA, { recursive: true });
    fs.writeFileSync(anterior, PNG);
    logoModel.buscarPorClave.mockResolvedValue({ clave: 'corto_color', archivo_url: '/uploads/logos/anterior-de-prueba.png' });
    logoModel.guardar.mockResolvedValue({});

    const respuesta = await subir('corto_color', TOKEN_SUPER);

    expect(respuesta.status).toBe(200);
    expect(fs.existsSync(anterior)).toBe(false);
  });

  test('rechaza una clave que no existe, la falta de archivo, otros formatos y un archivo que no es imagen', async () => {
    expect((await subir('otro_logo', TOKEN_SUPER)).status).toBe(404);
    expect((await subir('corto_color', TOKEN_SUPER, null)).status).toBe(400);
    expect((await subir('corto_color', TOKEN_SUPER, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), 'image/svg+xml')).status).toBe(400);
    expect((await subir('corto_color', TOKEN_SUPER, Buffer.from('esto no es una imagen, es texto'), 'image/png')).status).toBe(400);
    expect(logoModel.guardar).not.toHaveBeenCalled();
    expect(archivosNuevos()).toHaveLength(0);
  });
});

describe('DELETE /api/logos/:clave', () => {
  test('solo el superadministrador', async () => {
    expect((await request(app).delete('/api/logos/corto_color')).status).toBe(401);
    expect((await request(app).delete('/api/logos/corto_color').set('Authorization', `Bearer ${TOKEN_ADMIN}`)).status).toBe(403);
    expect(logoModel.eliminar).not.toHaveBeenCalled();
  });

  test('vuelve al original: quita el registro y borra el archivo subido', async () => {
    const subido = path.join(CARPETA, 'subido-de-prueba.png');
    fs.mkdirSync(CARPETA, { recursive: true });
    fs.writeFileSync(subido, PNG);
    logoModel.eliminar.mockResolvedValue({ clave: 'corto_color', archivo_url: '/uploads/logos/subido-de-prueba.png' });

    const respuesta = await request(app).delete('/api/logos/corto_color').set('Authorization', `Bearer ${TOKEN_SUPER}`);

    expect(respuesta.status).toBe(200);
    expect(logoModel.eliminar).toHaveBeenCalledWith('corto_color');
    expect(fs.existsSync(subido)).toBe(false);
    expect(respuesta.body.logos.corto_color).toBeNull();
  });

  test('restaurar uno que ya usa el original no falla; una clave que no existe responde 404', async () => {
    logoModel.eliminar.mockResolvedValue(null);
    expect((await request(app).delete('/api/logos/icono').set('Authorization', `Bearer ${TOKEN_SUPER}`)).status).toBe(200);
    expect((await request(app).delete('/api/logos/otro').set('Authorization', `Bearer ${TOKEN_SUPER}`)).status).toBe(404);
  });
});
