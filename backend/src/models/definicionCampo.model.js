// models/definicionCampo.model.js
// Definiciones de los campos personalizados administrables, ver
// database/incremento_7a_campos_personalizados.sql. A proposito NO hay
// ninguna funcion que elimine: un campo solo se desactiva.
const { pool } = require('../config/db');

const CAMPOS = 'id, entidad, clave, etiqueta, tipo, ayuda, opciones, requerido, orden, activo';

// Todas las de una entidad (activas e inactivas), en el orden del admin.
async function listar(entidad) {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM definicion_campo WHERE entidad = $1 ORDER BY orden, creado_en`, [
    entidad,
  ]);
  return resultado.rows;
}

async function buscarPorId(id) {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM definicion_campo WHERE id = $1`, [id]);
  return resultado.rows[0] || null;
}

async function buscarPorClave(entidad, clave) {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM definicion_campo WHERE entidad = $1 AND clave = $2`, [
    entidad,
    clave,
  ]);
  return resultado.rows[0] || null;
}

// El campo nuevo queda al final de su entidad.
async function crear({ entidad, clave, etiqueta, tipo, ayuda, opciones, requerido }) {
  const resultado = await pool.query(
    `INSERT INTO definicion_campo (entidad, clave, etiqueta, tipo, ayuda, opciones, requerido, orden)
     VALUES ($1::varchar, $2, $3, $4, $5, $6::jsonb, $7,
             (SELECT COALESCE(MAX(orden), 0) + 1 FROM definicion_campo WHERE entidad = $1::varchar))
     RETURNING ${CAMPOS}`,
    [entidad, clave, etiqueta, tipo, ayuda || null, JSON.stringify(opciones || []), Boolean(requerido)]
  );
  return resultado.rows[0];
}

// Solo lo que se puede cambiar despues de crear: nunca clave, tipo ni
// entidad. `ayuda: ''` la borra.
async function actualizar(id, { etiqueta, ayuda, opciones, requerido, activo }) {
  const resultado = await pool.query(
    `UPDATE definicion_campo
     SET etiqueta = COALESCE($2, etiqueta),
         ayuda = CASE WHEN $3::text IS NULL THEN ayuda ELSE NULLIF($3::text, '') END,
         opciones = COALESCE($4::jsonb, opciones),
         requerido = COALESCE($5, requerido),
         activo = COALESCE($6, activo)
     WHERE id = $1
     RETURNING ${CAMPOS}`,
    [id, etiqueta ?? null, ayuda ?? null, opciones ? JSON.stringify(opciones) : null, requerido ?? null, activo ?? null]
  );
  return resultado.rows[0] || null;
}

// `ids` trae los campos de la entidad en su nuevo orden.
async function reordenar(entidad, ids) {
  await pool.query(
    `UPDATE definicion_campo d
     SET orden = nuevo.posicion
     FROM unnest($2::uuid[]) WITH ORDINALITY AS nuevo(id, posicion)
     WHERE d.id = nuevo.id AND d.entidad = $1`,
    [entidad, ids]
  );
}

module.exports = { listar, buscarPorId, buscarPorClave, crear, actualizar, reordenar };
