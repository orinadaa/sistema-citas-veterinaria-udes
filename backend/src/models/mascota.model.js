// models/mascota.model.js
// Mascota es una entidad propia (identidad del paciente), sin
// historial clinico. Pertenece siempre a un cliente (dueño).
const { pool } = require('../config/db');

const CAMPOS = 'id, cliente_id, nombre, especie, raza, foto_url, creado_en';

async function listarPorCliente(clienteId) {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM mascota WHERE cliente_id = $1 ORDER BY nombre`, [
    clienteId,
  ]);
  return resultado.rows;
}

async function buscarPorId(id) {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM mascota WHERE id = $1`, [id]);
  return resultado.rows[0] || null;
}

async function perteneceACliente(mascotaId, clienteId) {
  const resultado = await pool.query('SELECT 1 FROM mascota WHERE id = $1 AND cliente_id = $2', [
    mascotaId,
    clienteId,
  ]);
  return resultado.rowCount > 0;
}

async function crear({ clienteId, nombre, especie, raza, fotoUrl }) {
  const resultado = await pool.query(
    `INSERT INTO mascota (cliente_id, nombre, especie, raza, foto_url) VALUES ($1, $2, $3, $4, $5) RETURNING ${CAMPOS}`,
    [clienteId, nombre, especie || null, raza || null, fotoUrl || null]
  );
  return resultado.rows[0];
}

async function actualizar(id, { nombre, especie, raza, fotoUrl }) {
  const resultado = await pool.query(
    `UPDATE mascota SET
       nombre = COALESCE($2, nombre),
       especie = COALESCE($3, especie),
       raza = COALESCE($4, raza),
       foto_url = COALESCE($5, foto_url)
     WHERE id = $1
     RETURNING ${CAMPOS}`,
    [id, nombre ?? null, especie ?? null, raza ?? null, fotoUrl ?? null]
  );
  return resultado.rows[0] || null;
}

module.exports = { listarPorCliente, buscarPorId, perteneceACliente, crear, actualizar };
