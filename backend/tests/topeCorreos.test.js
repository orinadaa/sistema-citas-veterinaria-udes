// tests/topeCorreos.test.js
// Los correos con codigo tienen un tope diario por destinatario, ademas del
// tope por conexion: nadie puede llenar el buzon de otra persona.

jest.mock('../src/models/usuario.model');
jest.mock('../src/models/recuperacion.model');
jest.mock('../src/models/registroPendiente.model');
jest.mock('../src/services/correo.service');

const request = require('supertest');
const app = require('../src/app');
const usuarioModel = require('../src/models/usuario.model');

// El limite de intentos no cuenta en las pruebas, salvo en las que lo ponen a prueba.
beforeAll(() => {
  process.env.LIMITE_EN_PRUEBAS = '1';
});
afterAll(() => delete process.env.LIMITE_EN_PRUEBAS);

beforeEach(() => {
  jest.clearAllMocks();
  usuarioModel.buscarPorCorreo.mockResolvedValue(null);
});

const pedirRecuperacion = (correo) => request(app).post('/api/auth/olvide-clave').send({ correo });

describe('Tope diario de correos por destinatario', () => {
  test('tras cinco solicitudes para el mismo correo, la siguiente se rechaza', async () => {
    for (let intento = 0; intento < 5; intento++) {
      expect((await pedirRecuperacion('Destino@Correo.com')).status).not.toBe(429);
    }
    const sexta = await pedirRecuperacion(' destino@correo.com ');
    expect(sexta.status).toBe(429);
    expect(sexta.body.mensaje).toMatch(/varios correos/);
  });

  test('el tope es de cada destinatario: otro correo no queda bloqueado', async () => {
    expect((await pedirRecuperacion('otra.persona@correo.com')).status).not.toBe(429);
  });

  test('el registro y el reenvio de su codigo comparten un tope de seis al dia por destinatario', async () => {
    const registrar = () => request(app).post('/api/auth/registro').send({ correo: 'nuevo@correo.com' });
    const reenviar = () => request(app).post('/api/auth/registro/reenviar').send({ correo: 'nuevo@correo.com', solicitudId: 'x' });
    for (const pedir of [registrar, registrar, registrar, reenviar, reenviar, registrar]) {
      expect((await pedir()).status).not.toBe(429);
    }
    const septima = await registrar();
    expect(septima.status).toBe(429);
    expect(septima.body.mensaje).toMatch(/varios correos/);
  });
});
