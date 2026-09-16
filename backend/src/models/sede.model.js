// models/sede.model.js
const { pool } = require('../config/db');

async function listarTodas() {
  const resultado = await pool.query('SELECT id, nombre, ciudad FROM sede ORDER BY ciudad');
  return resultado.rows;
}

async function buscarPorId(id) {
  const resultado = await pool.query('SELECT id, nombre, ciudad FROM sede WHERE id = $1', [id]);
  return resultado.rows[0] || null;
}

module.exports = { listarTodas, buscarPorId };
