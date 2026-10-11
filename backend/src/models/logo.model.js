// models/logo.model.js
// Logotipos de la clinica que el superadministrador reemplazo por un archivo
// propio (ver database/incremento_14a_logos.sql). Un logotipo sin fila usa
// el original que viene con el sistema.
const { pool } = require('../config/db');

async function listar() {
  const resultado = await pool.query('SELECT clave, archivo_url, actualizado_en FROM logo_clinica');
  return resultado.rows;
}

async function buscarPorClave(clave) {
  const resultado = await pool.query('SELECT clave, archivo_url FROM logo_clinica WHERE clave = $1', [clave]);
  return resultado.rows[0] || null;
}

// Un solo archivo por logotipo: subir otro reemplaza el anterior.
async function guardar(clave, archivoUrl) {
  const resultado = await pool.query(
    `INSERT INTO logo_clinica (clave, archivo_url)
     VALUES ($1, $2)
     ON CONFLICT (clave) DO UPDATE SET archivo_url = $2, actualizado_en = NOW()
     RETURNING clave, archivo_url, actualizado_en`,
    [clave, archivoUrl]
  );
  return resultado.rows[0];
}

// Devuelve la fila eliminada (para borrar su archivo), o null.
async function eliminar(clave) {
  const resultado = await pool.query('DELETE FROM logo_clinica WHERE clave = $1 RETURNING clave, archivo_url', [clave]);
  return resultado.rows[0] || null;
}

module.exports = { listar, buscarPorClave, guardar, eliminar };
