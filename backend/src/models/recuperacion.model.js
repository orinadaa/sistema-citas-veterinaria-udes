// models/recuperacion.model.js
// Consultas SQL de la tabla "codigo_recuperacion" (recuperacion de clave
// por codigo).
const { pool } = require('../config/db');

// Un solo codigo activo por usuario: pedir uno nuevo reemplaza el anterior
// y reinicia el contador de intentos.
async function guardarCodigo(usuarioId, codigoHash, expiraEn) {
  await pool.query(
    `INSERT INTO codigo_recuperacion (usuario_id, codigo_hash, intentos, expira_en, creado_en)
     VALUES ($1, $2, 0, $3, NOW())
     ON CONFLICT (usuario_id)
     DO UPDATE SET codigo_hash = $2, intentos = 0, expira_en = $3, creado_en = NOW()`,
    [usuarioId, codigoHash, expiraEn]
  );
}

async function buscarPorUsuarioId(usuarioId) {
  const resultado = await pool.query('SELECT * FROM codigo_recuperacion WHERE usuario_id = $1', [usuarioId]);
  return resultado.rows[0] || null;
}

async function incrementarIntentos(usuarioId) {
  await pool.query('UPDATE codigo_recuperacion SET intentos = intentos + 1 WHERE usuario_id = $1', [usuarioId]);
}

async function eliminarPorUsuarioId(usuarioId) {
  await pool.query('DELETE FROM codigo_recuperacion WHERE usuario_id = $1', [usuarioId]);
}

module.exports = { guardarCodigo, buscarPorUsuarioId, incrementarIntentos, eliminarPorUsuarioId };
