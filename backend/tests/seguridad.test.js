// tests/seguridad.test.js
// Auditoria de seguridad (RNF-04): cabeceras, CORS, tope de intentos, errores
// sin detalles internos, sesion de cuentas desactivadas y fotos falsas.

jest.mock('../src/config/db', () => ({ pool: { query: jest.fn() } }));
jest.mock('../src/models/usuario.model');
jest.mock('../src/models/sede.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const usuarioModel = require('../src/models/usuario.model');
const sedeModel = require('../src/models/sede.model');

const firmar = (datos, opciones) => jwt.sign(datos, process.env.JWT_SECRET, opciones);

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.LIMITE_EN_PRUEBAS;
  delete process.env.VERIFICAR_ACTIVO_EN_PRUEBAS;
});

describe('Cabeceras y CORS', () => {
  test('toda respuesta lleva las cabeceras de proteccion y no anuncia Express', async () => {
    sedeModel.listarTodas.mockResolvedValue([]);
    const respuesta = await request(app).get('/api/sedes');
    expect(respuesta.headers['x-content-type-options']).toBe('nosniff');
    expect(respuesta.headers['x-frame-options']).toBe('DENY');
    expect(respuesta.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(respuesta.headers['content-security-policy']).toMatch(/default-src 'none'/);
    expect(respuesta.headers['cache-control']).toBe('no-store');
    expect(respuesta.headers['x-powered-by']).toBeUndefined();
  });

  test('solo el frontend autorizado recibe permiso de CORS', async () => {
    sedeModel.listarTodas.mockResolvedValue([]);
    const propio = await request(app).get('/api/sedes').set('Origin', 'http://localhost:5173');
    expect(propio.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const ajeno = await request(app).get('/api/sedes').set('Origin', 'https://sitio-ajeno.example');
    expect(ajeno.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Errores', () => {
  test('un error inesperado no revela detalles internos', async () => {
    const silencio = jest.spyOn(console, 'error').mockImplementation(() => {});
    sedeModel.listarTodas.mockRejectedValue(new Error('relation "sede" does not exist at /var/app/models/sede.model.js'));
    const respuesta = await request(app).get('/api/sedes');
    expect(respuesta.status).toBe(500);
    expect(respuesta.body.mensaje).not.toMatch(/relation|sede\.model|var\/app/);
    silencio.mockRestore();
  });

  test('JSON mal formado responde 400 y una ruta inexistente de la API, 404 en JSON', async () => {
    const malo = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"correo": ');
    expect(malo.status).toBe(400);
    const inexistente = await request(app).get('/api/no-existe');
    expect(inexistente.status).toBe(404);
    expect(inexistente.body.mensaje).toBeDefined();
  });
});

describe('Tope de intentos', () => {
  test('el inicio de sesion se bloquea tras demasiados intentos desde la misma IP', async () => {
    process.env.LIMITE_EN_PRUEBAS = '1';
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    let ultima;
    for (let i = 0; i < 21; i += 1) {
      // Un correo distinto cada vez: asi cuenta solo el tope por IP.
      ultima = await request(app).post('/api/auth/login').send({ correo: `x${i}@x.co`, contrasena: 'incorrecta' });
      if (i < 20) expect(ultima.status).toBe(401);
    }
    expect(ultima.status).toBe(429);
    expect(ultima.headers['retry-after']).toBeDefined();
  });

  test('tambien se bloquea por cuenta: muchos intentos contra el mismo correo', async () => {
    process.env.LIMITE_EN_PRUEBAS = '1';
    // Aplicacion nueva: los contadores por IP de la prueba anterior no cuentan aqui.
    jest.resetModules();
    require('../src/models/usuario.model').buscarPorCorreo.mockResolvedValue(null);
    const appNueva = require('../src/app');
    let ultima;
    for (let i = 0; i < 11; i += 1) {
      ultima = await request(appNueva).post('/api/auth/login').send({ correo: 'Victima@Clinica.co', contrasena: 'incorrecta' });
    }
    expect(ultima.status).toBe(429);
    expect(ultima.body.mensaje).toMatch(/esta cuenta/);
  });
});

describe('Sesion', () => {
  test('una cuenta desactivada pierde el acceso aunque su token siga vigente', async () => {
    process.env.VERIFICAR_ACTIVO_EN_PRUEBAS = '1';
    pool.query.mockResolvedValue({ rows: [{ activo: false }] });
    const respuesta = await request(app).get('/api/auth/perfil').set('Authorization', 'Bearer ' + firmar({ id: 'u-inactivo', rol: 'cliente' }));
    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe('SESION_TERMINADA');
  });

  test('una cuenta que ya no existe tampoco entra', async () => {
    process.env.VERIFICAR_ACTIVO_EN_PRUEBAS = '1';
    pool.query.mockResolvedValue({ rows: [] });
    const respuesta = await request(app).get('/api/auth/perfil').set('Authorization', 'Bearer ' + firmar({ id: 'u-borrado', rol: 'cliente' }));
    expect(respuesta.status).toBe(401);
  });

  test('no acepta un token firmado con otro algoritmo ni sin firma', async () => {
    const otro = firmar({ id: 'u1', rol: 'superadministrador' }, { algorithm: 'HS512' });
    expect((await request(app).get('/api/auth/perfil').set('Authorization', 'Bearer ' + otro)).status).toBe(401);
    const sinFirma = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"id":"u1","rol":"superadministrador"}').toString('base64url')}.`;
    expect((await request(app).get('/api/auth/perfil').set('Authorization', 'Bearer ' + sinFirma)).status).toBe(401);
  });
});

describe('Fotos', () => {
  test('rechaza un archivo que dice ser imagen pero no lo es', async () => {
    const token = firmar({ id: 'su', rol: 'superadministrador' });
    const respuesta = await request(app)
      .post('/api/sedes/s1/foto')
      .set('Authorization', 'Bearer ' + token)
      .attach('foto', Buffer.from('<script>alert(1)</script> esto no es una imagen'), { filename: 'foto.png', contentType: 'image/png' });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toMatch(/no es una imagen/);
    expect(sedeModel.actualizarFoto).not.toHaveBeenCalled();
  });
});
