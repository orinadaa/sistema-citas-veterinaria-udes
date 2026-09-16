// models/servicio.model.js
const { pool } = require('../config/db');

async function listarTodos() {
  const resultado = await pool.query(
    'SELECT id, nombre, descripcion FROM servicio WHERE activo = true ORDER BY nombre'
  );
  return resultado.rows;
}

async function buscarPorId(id) {
  const resultado = await pool.query('SELECT id, nombre, descripcion FROM servicio WHERE id = $1', [id]);
  return resultado.rows[0] || null;
}

module.exports = { listarTodos, buscarPorId };
