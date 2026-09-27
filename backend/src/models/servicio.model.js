// models/servicio.model.js
// RF-11: catalogo de servicios veterinarios ofrecidos.
const { pool } = require('../config/db');

const SELECT_BASE = `
  SELECT s.id, s.nombre, s.descripcion, s.precio, s.duracion_minutos, s.activo,
         c.id AS categoria_id, c.nombre AS categoria_nombre, c.color AS categoria_color
  FROM servicio s
  JOIN categoria_servicio c ON c.id = s.categoria_id
`;

async function listarTodos() {
  const resultado = await pool.query(`${SELECT_BASE} WHERE s.activo = true ORDER BY s.nombre`);
  return resultado.rows;
}

// Para el panel administrativo: incluye tambien los inactivos.
async function listarTodosAdmin() {
  const resultado = await pool.query(`${SELECT_BASE} ORDER BY s.nombre`);
  return resultado.rows;
}

async function buscarPorId(id) {
  const resultado = await pool.query(`${SELECT_BASE} WHERE s.id = $1`, [id]);
  return resultado.rows[0] || null;
}

async function crear({ nombre, descripcion, categoriaId, precio, duracionMinutos }) {
  const resultado = await pool.query(
    `INSERT INTO servicio (nombre, descripcion, categoria_id, precio, duracion_minutos)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [nombre, descripcion || null, categoriaId, precio ?? 0, duracionMinutos ?? 30]
  );
  return buscarPorId(resultado.rows[0].id);
}

async function actualizar(id, { nombre, descripcion, categoriaId, precio, duracionMinutos, activo }) {
  const resultado = await pool.query(
    `UPDATE servicio SET
       nombre = COALESCE($2, nombre),
       descripcion = COALESCE($3, descripcion),
       categoria_id = COALESCE($4, categoria_id),
       precio = COALESCE($5, precio),
       activo = COALESCE($6, activo),
       duracion_minutos = COALESCE($7, duracion_minutos)
     WHERE id = $1
     RETURNING id`,
    [id, nombre ?? null, descripcion ?? null, categoriaId ?? null, precio ?? null, activo ?? null, duracionMinutos ?? null]
  );
  if (resultado.rowCount === 0) return null;
  return buscarPorId(id);
}

module.exports = { listarTodos, listarTodosAdmin, buscarPorId, crear, actualizar };
