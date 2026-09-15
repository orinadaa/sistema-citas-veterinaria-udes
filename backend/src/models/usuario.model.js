// models/usuario.model.js
// Consultas SQL relacionadas con la tabla "usuario".
// Se mantienen aqui, separadas del controlador, para que el controlador
// se enfoque solo en la logica de la peticion HTTP.

const { pool } = require('../config/db');

async function buscarPorCorreo(correo) {
  const resultado = await pool.query(
    'SELECT id, nombre_completo, correo, contrasena_hash, rol, sede_id, telefono, activo FROM usuario WHERE correo = $1',
    [correo]
  );
  return resultado.rows[0] || null;
}

async function buscarPorId(id) {
  const resultado = await pool.query(
    'SELECT id, nombre_completo, correo, rol, sede_id, telefono, activo, creado_en FROM usuario WHERE id = $1',
    [id]
  );
  return resultado.rows[0] || null;
}

async function crearCliente({ nombreCompleto, correo, contrasenaHash, telefono }) {
  const resultado = await pool.query(
    `INSERT INTO usuario (nombre_completo, correo, contrasena_hash, rol, telefono)
     VALUES ($1, $2, $3, 'cliente', $4)
     RETURNING id, nombre_completo, correo, rol, telefono, creado_en`,
    [nombreCompleto, correo, contrasenaHash, telefono || null]
  );
  return resultado.rows[0];
}

// Crea cuentas de personal (administrador o veterinario). A diferencia del
// registro publico, estas siempre requieren una sede y las crea un admin.
async function crearPersonal({ nombreCompleto, correo, contrasenaHash, rol, sedeId, telefono }) {
  const resultado = await pool.query(
    `INSERT INTO usuario (nombre_completo, correo, contrasena_hash, rol, sede_id, telefono)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nombre_completo, correo, rol, sede_id, telefono, creado_en`,
    [nombreCompleto, correo, contrasenaHash, rol, sedeId, telefono || null]
  );
  return resultado.rows[0];
}

async function listarTodos() {
  const resultado = await pool.query(
    'SELECT id, nombre_completo, correo, rol, sede_id, telefono, activo, creado_en FROM usuario ORDER BY creado_en DESC'
  );
  return resultado.rows;
}

async function actualizarRol(id, { rol, sedeId }) {
  const resultado = await pool.query(
    `UPDATE usuario SET rol = $2, sede_id = $3 WHERE id = $1
     RETURNING id, nombre_completo, correo, rol, sede_id, telefono, activo`,
    [id, rol, sedeId ?? null]
  );
  return resultado.rows[0] || null;
}

module.exports = {
  buscarPorCorreo,
  buscarPorId,
  crearCliente,
  crearPersonal,
  listarTodos,
  actualizarRol,
};
