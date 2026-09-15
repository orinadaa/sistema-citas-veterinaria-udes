// models/sede.model.js
const { pool } = require('../config/db');

async function listarTodas() {
  const resultado = await pool.query('SELECT id, nombre, ciudad FROM sede ORDER BY ciudad');
  return resultado.rows;
}

module.exports = { listarTodas };
