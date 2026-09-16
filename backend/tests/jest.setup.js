// tests/jest.setup.js
// Variables de entorno minimas para que la app se pueda importar en pruebas
// sin depender del .env real ni de una conexion a PostgreSQL.
process.env.JWT_SECRET = 'clave_secreta_de_pruebas';
process.env.JWT_EXPIRACION = '1h';
