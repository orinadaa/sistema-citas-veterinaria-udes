// models/medico.model.js
// "Medico" aqui es un usuario con rol 'veterinario'. RF-10/RF-11: el
// administrador ve los medicos de su sede y administra su perfil
// (documento, telefono, foto, biografia, especialidades, activo) y que
// servicio presta cada uno (servicio_medico).
const { pool } = require('../config/db');

// Medicos activos que prestan el servicio y atienden en esa sede (opcion
// A de disponibilidad): con horario propio, si tienen un dia en esa sede
// (ese dia de la semana, si se indica diaSemana); sin horario propio, si
// es su sede (usuario.sede_id), como funcionaba antes.
async function listarPorSedeYServicio(sedeId, servicioId, diaSemana = null) {
  const resultado = await pool.query(
    `SELECT u.id, u.nombre_completo
     FROM usuario u
     JOIN servicio_medico sm ON sm.medico_id = u.id
     WHERE u.rol = 'veterinario' AND u.activo = true AND sm.servicio_id = $2
       AND (
         (NOT EXISTS (SELECT 1 FROM horario_medico hm WHERE hm.medico_id = u.id) AND u.sede_id = $1)
         OR EXISTS (SELECT 1 FROM horario_medico hm
                    WHERE hm.medico_id = u.id AND hm.sede_id = $1 AND ($3::int IS NULL OR hm.dia_semana = $3))
       )
     ORDER BY u.nombre_completo`,
    [sedeId, servicioId, diaSemana]
  );
  return resultado.rows;
}

// Filas {medico_id, fecha_hora} de citas activas de esos medicos dentro
// de un rango [inicio, fin). Sirve para calcular disponibilidad agregada.
async function listarFranjasOcupadas(medicoIds, inicio, fin) {
  if (medicoIds.length === 0) return [];
  const resultado = await pool.query(
    `SELECT medico_id, fecha_hora FROM cita
     WHERE medico_id = ANY($1::uuid[]) AND estado = 'agendada' AND fecha_hora >= $2 AND fecha_hora < $3`,
    [medicoIds, inicio, fin]
  );
  return resultado.rows;
}

// Citas activas de cada medico dentro de [inicio, fin): criterio de
// balanceo al asignar medico automaticamente (el menos cargado ese dia).
async function contarCitasPorMedico(medicoIds, inicio, fin) {
  if (medicoIds.length === 0) return [];
  const resultado = await pool.query(
    `SELECT medico_id, COUNT(*)::int AS total FROM cita
     WHERE medico_id = ANY($1::uuid[]) AND estado = 'agendada' AND fecha_hora >= $2 AND fecha_hora < $3
     GROUP BY medico_id`,
    [medicoIds, inicio, fin]
  );
  return resultado.rows;
}

// Servicios activos que presta un medico (con su categoria), para el
// selector de servicio cuando el medico agenda y para "Mi perfil".
async function listarServiciosDeMedico(medicoId) {
  const resultado = await pool.query(
    `SELECT sv.id, sv.nombre, sv.descripcion, sv.duracion_minutos, cat.nombre AS categoria_nombre, cat.color AS categoria_color
     FROM servicio_medico sm
     JOIN servicio sv ON sv.id = sm.servicio_id
     JOIN categoria_servicio cat ON cat.id = sv.categoria_id
     WHERE sm.medico_id = $1 AND sv.activo
     ORDER BY sv.nombre`,
    [medicoId]
  );
  return resultado.rows;
}

async function ofreceServicio(medicoId, servicioId) {
  const resultado = await pool.query(
    'SELECT 1 FROM servicio_medico WHERE medico_id = $1 AND servicio_id = $2',
    [medicoId, servicioId]
  );
  return resultado.rowCount > 0;
}

async function asignarServicio(medicoId, servicioId) {
  await pool.query(
    'INSERT INTO servicio_medico (medico_id, servicio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [medicoId, servicioId]
  );
}

// Todos los veterinarios de una sede, con su perfil, los servicios que
// presta y sus especialidades. Para el panel administrativo (RF-10/RF-11).
async function listarConServicios(sedeId) {
  const resultado = await pool.query(
    `SELECT u.id, u.nombre_completo, u.correo, u.sede_id, u.telefono, u.documento, u.foto_url,
            u.biografia, u.activo,
            COALESCE(
              json_agg(DISTINCT jsonb_build_object('id', sv.id, 'nombre', sv.nombre)) FILTER (WHERE sv.id IS NOT NULL),
              '[]'
            ) AS servicios,
            COALESCE(
              json_agg(DISTINCT jsonb_build_object('id', esp.id, 'nombre', esp.nombre, 'color', esp.color)) FILTER (WHERE esp.id IS NOT NULL),
              '[]'
            ) AS especialidades
     FROM usuario u
     LEFT JOIN servicio_medico sm ON sm.medico_id = u.id
     LEFT JOIN servicio sv ON sv.id = sm.servicio_id
     LEFT JOIN usuario_especialidad ue ON ue.usuario_id = u.id
     LEFT JOIN categoria_servicio esp ON esp.id = ue.categoria_id
     WHERE u.rol = 'veterinario' AND u.sede_id = $1
     GROUP BY u.id
     ORDER BY u.nombre_completo`,
    [sedeId]
  );
  return resultado.rows;
}

async function crear({ nombreCompleto, correo, contrasenaHash, documento, telefono, sedeId }) {
  const resultado = await pool.query(
    // debe_cambiar_contrasena: el medico nace con una clave temporal generada
    // por el sistema y debe establecer la suya al entrar por primera vez.
    `INSERT INTO usuario (nombre_completo, correo, contrasena_hash, rol, sede_id, telefono, documento, debe_cambiar_contrasena)
     VALUES ($1, $2, $3, 'veterinario', $4, $5, $6, true)
     RETURNING id`,
    [nombreCompleto, correo, contrasenaHash, sedeId, telefono || null, documento || null]
  );
  return resultado.rows[0].id;
}

async function actualizar(id, { nombreCompleto, telefono, documento, fotoUrl, biografia, activo }) {
  const resultado = await pool.query(
    `UPDATE usuario SET
       nombre_completo = COALESCE($2, nombre_completo),
       telefono = COALESCE($3, telefono),
       documento = COALESCE($4, documento),
       foto_url = COALESCE($5, foto_url),
       biografia = COALESCE($6, biografia),
       activo = COALESCE($7, activo)
     WHERE id = $1 AND rol = 'veterinario'
     RETURNING id`,
    [id, nombreCompleto ?? null, telefono ?? null, documento ?? null, fotoUrl ?? null, biografia ?? null, activo ?? null]
  );
  return resultado.rowCount > 0;
}

// Reemplaza por completo el conjunto de servicios que presta un medico.
// Transaccional: o se aplican todos los cambios, o ninguno.
async function reemplazarServicios(medicoId, servicioIds) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('DELETE FROM servicio_medico WHERE medico_id = $1', [medicoId]);
    for (const servicioId of servicioIds) {
      await cliente.query('INSERT INTO servicio_medico (medico_id, servicio_id) VALUES ($1, $2)', [
        medicoId,
        servicioId,
      ]);
    }
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

// Reemplaza por completo las especialidades (categorias) de un medico.
// Mismo patron transaccional que reemplazarServicios.
async function reemplazarEspecialidades(medicoId, categoriaIds) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('DELETE FROM usuario_especialidad WHERE usuario_id = $1', [medicoId]);
    for (const categoriaId of categoriaIds) {
      await cliente.query('INSERT INTO usuario_especialidad (usuario_id, categoria_id) VALUES ($1, $2)', [
        medicoId,
        categoriaId,
      ]);
    }
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

module.exports = {
  listarPorSedeYServicio,
  listarFranjasOcupadas,
  contarCitasPorMedico,
  listarServiciosDeMedico,
  ofreceServicio,
  asignarServicio,
  listarConServicios,
  crear,
  actualizar,
  reemplazarServicios,
  reemplazarEspecialidades,
};
