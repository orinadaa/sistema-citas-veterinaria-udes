// models/usuario.model.js
// Consultas SQL relacionadas con la tabla "usuario".
// Se mantienen aqui, separadas del controlador, para que el controlador
// se enfoque solo en la logica de la peticion HTTP.

const { pool } = require('../config/db');

async function buscarPorCorreo(correo) {
  const resultado = await pool.query(
    'SELECT id, nombre_completo, correo, contrasena_hash, rol, sede_id, telefono, activo, debe_cambiar_contrasena FROM usuario WHERE correo = $1',
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
// claveTemporal: la contraseña la genero el sistema (no la eligio la
// persona): al entrar por primera vez debera establecer la suya.
async function crearPersonal({ nombreCompleto, correo, contrasenaHash, rol, sedeId, telefono, claveTemporal = false }) {
  const resultado = await pool.query(
    `INSERT INTO usuario (nombre_completo, correo, contrasena_hash, rol, sede_id, telefono, debe_cambiar_contrasena)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, nombre_completo, correo, rol, sede_id, telefono, creado_en`,
    [nombreCompleto, correo, contrasenaHash, rol, sedeId, telefono || null, claveTemporal]
  );
  return resultado.rows[0];
}

// Busqueda de clientes activos por nombre, correo o telefono (el medico
// busca al dueño al agendar una cita). Maximo 10 resultados.
async function buscarClientes(termino) {
  const resultado = await pool.query(
    `SELECT id, nombre_completo, correo, telefono
     FROM usuario
     WHERE rol = 'cliente' AND activo
       AND (nombre_completo ILIKE '%' || $1 || '%' OR correo ILIKE '%' || $1 || '%' OR telefono ILIKE '%' || $1 || '%')
     ORDER BY nombre_completo
     LIMIT 10`,
    [termino]
  );
  return resultado.rows;
}

async function listarTodos(rol) {
  const condicion = rol ? 'WHERE rol = $1' : '';
  const resultado = await pool.query(
    `SELECT id, nombre_completo, correo, rol, sede_id, telefono, activo, creado_en
     FROM usuario ${condicion} ORDER BY creado_en DESC`,
    rol ? [rol] : []
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

// Actualizacion generica de perfil (activo/telefono/nombre), para
// cualquier rol: la usan Configuracion->Usuarios y el toggle de
// estado de Pacientes.
async function actualizarPerfil(id, { nombreCompleto, telefono, activo }) {
  const resultado = await pool.query(
    `UPDATE usuario SET
       nombre_completo = COALESCE($2, nombre_completo),
       telefono = COALESCE($3, telefono),
       activo = COALESCE($4, activo)
     WHERE id = $1
     RETURNING id, nombre_completo, correo, rol, sede_id, telefono, activo`,
    [id, nombreCompleto ?? null, telefono ?? null, activo ?? null]
  );
  return resultado.rows[0] || null;
}

// Cualquier cambio de contraseña hecho por la propia persona (primera
// entrada, perfil, recuperacion por codigo) apaga la marca de clave temporal.
async function actualizarContrasena(id, contrasenaHash) {
  await pool.query('UPDATE usuario SET contrasena_hash = $2, debe_cambiar_contrasena = false WHERE id = $1', [id, contrasenaHash]);
}

// Para establecer la contraseña propia: la cuenta completa, con su hash.
async function buscarConHashPorId(id) {
  const resultado = await pool.query(
    'SELECT id, nombre_completo, correo, contrasena_hash, rol, sede_id, activo, debe_cambiar_contrasena FROM usuario WHERE id = $1',
    [id]
  );
  return resultado.rows[0] || null;
}

module.exports = {
  buscarClientes,
  buscarPorCorreo,
  buscarPorId,
  crearCliente,
  crearPersonal,
  listarTodos,
  actualizarRol,
  actualizarPerfil,
  actualizarContrasena,
  buscarConHashPorId,
};
