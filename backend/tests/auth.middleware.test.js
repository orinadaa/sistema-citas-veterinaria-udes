// tests/auth.middleware.test.js
// RF-05 / RNF-04: proteccion de rutas por autenticacion y rol.

const jwt = require('jsonwebtoken');
const { verificarToken, verificarRol } = require('../src/middlewares/auth.middleware');

function crearRespuestaFalsa() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('verificarToken', () => {
  test('rechaza la peticion si no hay encabezado Authorization', () => {
    const req = { headers: {} };
    const res = crearRespuestaFalsa();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rechaza un token invalido', () => {
    const req = { headers: { authorization: 'Bearer token-invalido' } };
    const res = crearRespuestaFalsa();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('acepta un token valido y adjunta el usuario decodificado a req.usuario', () => {
    const token = jwt.sign({ id: 'abc123', rol: 'cliente' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = crearRespuestaFalsa();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.usuario.id).toBe('abc123');
    expect(req.usuario.rol).toBe('cliente');
  });
});

describe('verificarRol', () => {
  test('rechaza con 403 si el rol del usuario no esta permitido', () => {
    const req = { usuario: { rol: 'cliente' } };
    const res = crearRespuestaFalsa();
    const next = jest.fn();

    verificarRol('administrador')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('permite continuar si el rol esta en la lista de permitidos', () => {
    const req = { usuario: { rol: 'administrador' } };
    const res = crearRespuestaFalsa();
    const next = jest.fn();

    verificarRol('administrador', 'veterinario')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
