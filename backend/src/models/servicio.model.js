// models/servicio.model.js
// RF-11: catalogo de servicios veterinarios ofrecidos.
const { pool } = require('../config/db');

async function listarTodos() {
  const resultado = await pool.query(
    'SELECT id, nombre, descripcion FROM servicio WHERE activo = true ORDER BY nombre'
  );
  return resultado.rows;
}

// Para el panel administrativo: incluye tambien los inactivos.
async function listarTodosAdmin() {
  const resultado = await pool.query(
    'SELECT id, nombre, descripcion, activo FROM servicio ORDER BY nombre'
  );
  return resultado.rows;
}

async function buscarPorId(id) {
  const resultado = await pool.query('SELECT id, nombre, descripcion FROM servicio WHERE id = $1', [id]);
  return resultado.rows[0] || null;
}

async function crear({ nombre, descripcion }) {
  const resultado = await pool.query(
    'INSERT INTO servicio (nombre, descripcion) VALUES ($1, $2) RETURNING id, nombre, descripcion, activo',
    [nombre, descripcion || null]
  );
  return resultado.rows[0];
}

async function actualizar(id, { nombre, descripcion, activo }) {
  const resultado = await pool.query(
    `UPDATE servicio SET
       nombre = COALESCE($2, nombre),
       descripcion = COALESCE($3, descripcion),
       activo = COALESCE($4, activo)
     WHERE id = $1
     RETURNING id, nombre, descripcion, activo`,
    [id, nombre ?? null, descripcion ?? null, activo ?? null]
  );
  return resultado.rows[0] || null;
}

module.exports = { listarTodos, listarTodosAdmin, buscarPorId, crear, actualizar };
