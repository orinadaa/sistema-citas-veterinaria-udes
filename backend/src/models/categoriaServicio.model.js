// models/categoriaServicio.model.js
// Catalogo compartido de categorias (servicios) / especialidades
// (medicos) del sistema de diseno: cada nombre tiene un color de la
// paleta "category" (ver database/incremento_3b_servicios_categoria_precio.sql).
const { pool } = require('../config/db');

async function listarTodas() {
  const resultado = await pool.query('SELECT id, nombre, color FROM categoria_servicio ORDER BY nombre');
  return resultado.rows;
}

async function existe(id) {
  const resultado = await pool.query('SELECT 1 FROM categoria_servicio WHERE id = $1', [id]);
  return resultado.rowCount > 0;
}

module.exports = { listarTodas, existe };
