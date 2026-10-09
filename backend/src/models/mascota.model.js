// models/mascota.model.js
// Mascota es una entidad propia (identidad del paciente), sin
// historial clinico. Pertenece siempre a un cliente (dueño).
const { pool } = require('../config/db');

const CAMPOS =
  'id, cliente_id, nombre, especie, raza, foto_url, fecha_nacimiento, sexo, color, peso_kg, caracteristicas, ' +
  'alergias, medicamentos, condiciones_medicas, observaciones, creado_en';

// Solo mascotas activas: las eliminadas (baja logica, ver
// database/incremento_4c_mascota_baja.sql) ya no se listan.
async function listarPorCliente(clienteId) {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM mascota WHERE cliente_id = $1 AND activo ORDER BY nombre`, [
    clienteId,
  ]);
  return resultado.rows;
}

async function buscarPorId(id) {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM mascota WHERE id = $1 AND activo`, [id]);
  return resultado.rows[0] || null;
}

async function perteneceACliente(mascotaId, clienteId) {
  // Una mascota eliminada no se puede usar para agendar.
  const resultado = await pool.query('SELECT 1 FROM mascota WHERE id = $1 AND cliente_id = $2 AND activo', [
    mascotaId,
    clienteId,
  ]);
  return resultado.rowCount > 0;
}

async function crear({
  clienteId,
  nombre,
  especie,
  raza,
  fotoUrl,
  fechaNacimiento,
  sexo,
  color,
  pesoKg,
  caracteristicas,
  alergias,
  medicamentos,
  condicionesMedicas,
  observaciones,
}) {
  const resultado = await pool.query(
    `INSERT INTO mascota (cliente_id, nombre, especie, raza, foto_url, fecha_nacimiento, sexo, color, peso_kg, caracteristicas,
                          alergias, medicamentos, condiciones_medicas, observaciones)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING ${CAMPOS}`,
    [
      clienteId,
      nombre,
      especie || null,
      raza || null,
      fotoUrl || null,
      fechaNacimiento || null,
      sexo || null,
      color || null,
      pesoKg ?? null,
      caracteristicas || null,
      alergias || null,
      medicamentos || null,
      condicionesMedicas || null,
      observaciones || null,
    ]
  );
  return resultado.rows[0];
}

async function actualizar(
  id,
  { nombre, especie, raza, fotoUrl, fechaNacimiento, sexo, color, pesoKg, caracteristicas, alergias, medicamentos, condicionesMedicas, observaciones }
) {
  const resultado = await pool.query(
    `UPDATE mascota SET
       nombre = COALESCE($2, nombre),
       especie = COALESCE($3, especie),
       raza = COALESCE($4, raza),
       foto_url = COALESCE($5, foto_url),
       fecha_nacimiento = COALESCE($6, fecha_nacimiento),
       sexo = COALESCE($7, sexo),
       color = COALESCE($8, color),
       peso_kg = COALESCE($9, peso_kg),
       caracteristicas = COALESCE($10, caracteristicas),
       alergias = COALESCE($11, alergias),
       medicamentos = COALESCE($12, medicamentos),
       condiciones_medicas = COALESCE($13, condiciones_medicas),
       observaciones = COALESCE($14, observaciones)
     WHERE id = $1
     RETURNING ${CAMPOS}`,
    [
      id,
      nombre ?? null,
      especie ?? null,
      raza ?? null,
      fotoUrl ?? null,
      fechaNacimiento ?? null,
      sexo ?? null,
      color ?? null,
      pesoKg ?? null,
      caracteristicas ?? null,
      alergias ?? null,
      medicamentos ?? null,
      condicionesMedicas ?? null,
      observaciones ?? null,
    ]
  );
  return resultado.rows[0] || null;
}

// Citas activas (agendadas y futuras) de la mascota: mientras tenga
// alguna, no se puede eliminar.
async function contarCitasPendientes(id) {
  const resultado = await pool.query(
    `SELECT COUNT(*)::int AS total FROM cita WHERE mascota_id = $1 AND estado = 'agendada' AND fecha_hora > NOW()`,
    [id]
  );
  return resultado.rows[0].total;
}

// Reemplaza la foto y devuelve la ruta anterior (para borrar el archivo
// viejo del disco despues de guardar la nueva).
async function actualizarFoto(id, fotoUrl) {
  const resultado = await pool.query(
    `UPDATE mascota m SET foto_url = $2
     FROM (SELECT foto_url AS anterior FROM mascota WHERE id = $1) previo
     WHERE m.id = $1 AND m.activo
     RETURNING previo.anterior, ${CAMPOS.split(', ').map((c) => `m.${c}`).join(', ')}`,
    [id, fotoUrl]
  );
  if (resultado.rowCount === 0) return null;
  const { anterior, ...mascota } = resultado.rows[0];
  return { mascota, fotoAnterior: anterior };
}

async function desactivar(id) {
  const resultado = await pool.query(`UPDATE mascota SET activo = false WHERE id = $1 AND activo RETURNING ${CAMPOS}`, [id]);
  return resultado.rows[0] || null;
}

module.exports = { listarPorCliente, buscarPorId, perteneceACliente, crear, actualizar, contarCitasPendientes, actualizarFoto, desactivar };
