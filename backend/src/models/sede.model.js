// models/sede.model.js
const { pool } = require('../config/db');

const CAMPOS = 'id, nombre, ciudad, direccion, foto_url, activo';

// Publico (landing, formulario de agendamiento): solo sedes activas, no
// tiene sentido ofrecer agendar en una sede que el admin desactivo.
async function listarTodas() {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM sede WHERE activo = true ORDER BY ciudad`);
  return resultado.rows;
}

// Para el panel administrativo: incluye tambien las inactivas, para
// poder reactivarlas.
async function listarTodasAdmin() {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM sede ORDER BY ciudad`);
  return resultado.rows;
}

async function buscarPorId(id) {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM sede WHERE id = $1`, [id]);
  return resultado.rows[0] || null;
}

async function crear({ nombre, ciudad, direccion, fotoUrl }) {
  const resultado = await pool.query(
    `INSERT INTO sede (nombre, ciudad, direccion, foto_url) VALUES ($1, $2, $3, $4) RETURNING ${CAMPOS}`,
    [nombre, ciudad, direccion || null, fotoUrl || null]
  );
  return resultado.rows[0];
}

async function actualizar(id, { nombre, ciudad, direccion, fotoUrl, activo }) {
  const resultado = await pool.query(
    `UPDATE sede SET
       nombre = COALESCE($2, nombre),
       ciudad = COALESCE($3, ciudad),
       direccion = COALESCE($4, direccion),
       foto_url = COALESCE($5, foto_url),
       activo = COALESCE($6, activo)
     WHERE id = $1
     RETURNING ${CAMPOS}`,
    [id, nombre ?? null, ciudad ?? null, direccion ?? null, fotoUrl ?? null, activo ?? null]
  );
  return resultado.rows[0] || null;
}

module.exports = { listarTodas, listarTodasAdmin, buscarPorId, crear, actualizar };
