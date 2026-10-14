// models/usuario.model.js
// Consultas SQL relacionadas con la tabla "usuario".
// Se mantienen aqui, separadas del controlador, para que el controlador
// se enfoque solo en la logica de la peticion HTTP.

const { pool } = require('../config/db');
const { olvidarCuenta } = require('../utils/estadoCuenta');

async function buscarPorCorreo(correo) {
  const resultado = await pool.query(
    // Sin distinguir mayusculas: el correo se guarda en minusculas, pero asi
    // tampoco falla una cuenta antigua guardada de otra forma.
    'SELECT id, nombre_completo, correo, contrasena_hash, rol, sede_id, telefono, activo, debe_cambiar_contrasena, creado_en FROM usuario WHERE LOWER(correo) = LOWER($1)',
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

// autorizaTratamiento: deja la fecha en que autorizo el tratamiento de sus
// datos personales (Ley 1581 de 2012).
async function crearCliente({ nombreCompleto, correo, contrasenaHash, telefono, autorizaTratamiento = false }) {
  const resultado = await pool.query(
    `INSERT INTO usuario (nombre_completo, correo, contrasena_hash, rol, telefono, autorizo_tratamiento_en)
     VALUES ($1, $2, $3, 'cliente', $4, CASE WHEN $5 THEN NOW() END)
     RETURNING id, nombre_completo, correo, rol, telefono, creado_en`,
    [nombreCompleto, correo, contrasenaHash, telefono || null, Boolean(autorizaTratamiento)]
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

// Busqueda de clientes activos por nombre, correo o telefono, limitada a
// los pacientes del medico (quienes tienen o tuvieron una cita con el).
// Maximo 10 resultados.
async function buscarClientes(termino, medicoId) {
  const resultado = await pool.query(
    `SELECT u.id, u.nombre_completo, u.correo, u.telefono
     FROM usuario u
     WHERE u.rol = 'cliente' AND u.activo
       AND (u.nombre_completo ILIKE '%' || $1 || '%' OR u.correo ILIKE '%' || $1 || '%' OR u.telefono ILIKE '%' || $1 || '%')
       AND EXISTS (SELECT 1 FROM cita c WHERE c.cliente_id = u.id AND c.medico_id = $2)
     ORDER BY u.nombre_completo
     LIMIT 10`,
    [termino, medicoId]
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
  // El cambio de rol o sede vale desde ya, no cuando venza la sesion.
  olvidarCuenta(id);
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
  olvidarCuenta(id);
  return resultado.rows[0] || null;
}

// Cualquier cambio de contraseña hecho por la propia persona (primera
// entrada, perfil, recuperacion por codigo) apaga la marca de clave temporal
// y cierra las sesiones abiertas con la clave anterior: los tokens emitidos
// antes de este momento dejan de servir (ver utils/estadoCuenta.js). Quien
// la cambia desde su perfil recibe un token nuevo para seguir en su sesion.
async function actualizarContrasena(id, contrasenaHash) {
  await pool.query(
    "UPDATE usuario SET contrasena_hash = $2, debe_cambiar_contrasena = false, sesiones_validas_desde = date_trunc('second', NOW()) WHERE id = $1",
    [id, contrasenaHash]
  );
  olvidarCuenta(id);
}

// Para establecer la contraseña propia: la cuenta completa, con su hash.
async function buscarConHashPorId(id) {
  const resultado = await pool.query(
    'SELECT id, nombre_completo, correo, contrasena_hash, rol, sede_id, activo, debe_cambiar_contrasena FROM usuario WHERE id = $1',
    [id]
  );
  return resultado.rows[0] || null;
}

// Citas agendadas que todavia no ocurren (o por reagendar), donde la cuenta es el medico o el cliente.
async function contarCitasFuturasDeCuenta(id) {
  const resultado = await pool.query(
    "SELECT COUNT(*)::int AS total FROM cita WHERE (estado = 'por_reagendar' OR (estado = 'agendada' AND fecha_hora > NOW())) AND (medico_id = $1 OR cliente_id = $1)",
    [id]
  );
  return resultado.rows[0].total;
}

module.exports = {
  contarCitasFuturasDeCuenta,
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
