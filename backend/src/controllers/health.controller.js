// controllers/health.controller.js
// Su unico proposito en el Incremento 0 es confirmar que el backend
// esta corriendo Y que puede conectarse a PostgreSQL.

const { testConnection } = require('../config/db');

async function getHealth(req, res, next) {
  try {
    const dbStatus = await testConnection();

    if (!dbStatus.ok) {
      return res.status(503).json({
        servidor: 'ok',
        baseDeDatos: 'error',
        detalle: dbStatus.error,
      });
    }

    return res.status(200).json({
      servidor: 'ok',
      baseDeDatos: 'ok',
      horaServidorBD: dbStatus.horaServidor,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getHealth };