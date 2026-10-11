// models/registroPendiente.model.js
// Consultas SQL de la tabla "registro_pendiente": quien se registro y aun no
// confirma su correo con el codigo (ver
// database/incremento_13b_verificacion_correo.sql).
const { pool } = require('../config/db');

// Una sola solicitud por correo: registrarse de nuevo reemplaza los datos y
// el codigo, y reinicia el contador de intentos. Devuelve el id de la
// solicitud, que cambia cada vez: solo el navegador que la envio lo conoce.
async function guardar({ correo, nombreCompleto, contrasenaHash, telefono, codigoHash, expiraEn }) {
  const resultado = await pool.query(
    `INSERT INTO registro_pendiente (correo, nombre_completo, contrasena_hash, telefono, codigo_hash, expira_en)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (correo)
     DO UPDATE SET id = uuid_generate_v4(), nombre_completo = $2, contrasena_hash = $3, telefono = $4, codigo_hash = $5,
                   intentos = 0, expira_en = $6, codigo_enviado_en = NOW(), autorizo_tratamiento_en = NOW(), creado_en = NOW()
     RETURNING id`,
    [correo, nombreCompleto, contrasenaHash, telefono || null, codigoHash, expiraEn]
  );
  return resultado.rows[0].id;
}

// Corrige los datos de una solicitud sin tocar el codigo que ya se envio.
async function actualizarDatos(correo, { nombreCompleto, contrasenaHash, telefono }) {
  await pool.query(
    'UPDATE registro_pendiente SET nombre_completo = $2, contrasena_hash = $3, telefono = $4 WHERE correo = $1',
    [correo, nombreCompleto, contrasenaHash, telefono || null]
  );
}

// Codigo nuevo para una solicitud que ya existe ("Reenviar código").
async function renovarCodigo(correo, codigoHash, expiraEn) {
  await pool.query(
    'UPDATE registro_pendiente SET codigo_hash = $2, intentos = 0, expira_en = $3, codigo_enviado_en = NOW() WHERE correo = $1',
    [correo, codigoHash, expiraEn]
  );
}

async function buscarPorCorreo(correo) {
  const resultado = await pool.query('SELECT * FROM registro_pendiente WHERE correo = $1', [correo]);
  return resultado.rows[0] || null;
}

async function incrementarIntentos(correo) {
  await pool.query('UPDATE registro_pendiente SET intentos = intentos + 1 WHERE correo = $1', [correo]);
}

async function eliminarPorCorreo(correo) {
  await pool.query('DELETE FROM registro_pendiente WHERE correo = $1', [correo]);
}

// Solicitudes que nadie confirmo: no se guardan datos personales de quien
// no termino de registrarse.
async function eliminarAntiguos(horas) {
  await pool.query("DELETE FROM registro_pendiente WHERE creado_en < NOW() - ($1 || ' hours')::interval", [String(horas)]);
}

module.exports = { guardar, actualizarDatos, renovarCodigo, buscarPorCorreo, incrementarIntentos, eliminarPorCorreo, eliminarAntiguos };
