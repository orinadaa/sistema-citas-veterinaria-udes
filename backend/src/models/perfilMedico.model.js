// models/perfilMedico.model.js
// "Mi perfil" del medico veterinario y cambio de correo verificado.
const { pool } = require('../config/db');

const CAMPOS_PERFIL = `u.id, u.nombre_completo, u.correo, u.telefono, u.direccion, u.foto_url, u.activo, u.rol,
  u.titulos_profesionales, u.registro_profesional, u.anios_experiencia, u.biografia, u.creado_en,
  s.id AS sede_id, s.nombre AS sede_nombre, s.ciudad AS sede_ciudad`;

async function obtener(medicoId) {
  const [perfil, especialidades, servicios, resumen, sedesHorario] = await Promise.all([
    pool.query(`SELECT ${CAMPOS_PERFIL} FROM usuario u LEFT JOIN sede s ON s.id = u.sede_id WHERE u.id = $1`, [medicoId]),
    pool.query(
      `SELECT cs.id, cs.nombre, cs.color FROM usuario_especialidad ue
       JOIN categoria_servicio cs ON cs.id = ue.categoria_id WHERE ue.usuario_id = $1 ORDER BY cs.nombre`,
      [medicoId]
    ),
    pool.query(
      `SELECT sv.id, sv.nombre FROM servicio_medico sm
       JOIN servicio sv ON sv.id = sm.servicio_id WHERE sm.medico_id = $1 AND sv.activo ORDER BY sv.nombre`,
      [medicoId]
    ),
    // Resumen real: citas de este mes (no canceladas), dueños atendidos
    // (con alguna cita ya pasada) y mascotas distintas con cita con el.
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE estado = 'agendada' AND date_trunc('month', fecha_hora) = date_trunc('month', NOW()))::int AS citas_mes,
         COUNT(DISTINCT cliente_id) FILTER (WHERE estado = 'agendada' AND fecha_hora <= NOW())::int AS pacientes_atendidos,
         COUNT(DISTINCT mascota_id)::int AS mascotas
       FROM cita WHERE medico_id = $1`,
      [medicoId]
    ),
    // Sedes donde atiende segun su horario propio (vacio = solo su sede).
    pool.query(
      `SELECT DISTINCT s.id, s.nombre FROM horario_medico h JOIN sede s ON s.id = h.sede_id WHERE h.medico_id = $1 ORDER BY s.nombre`,
      [medicoId]
    ),
  ]);
  if (perfil.rowCount === 0) return null;
  const datos = perfil.rows[0];
  return {
    ...datos,
    especialidades: especialidades.rows,
    servicios: servicios.rows,
    resumen: resumen.rows[0],
    sedes_asignadas: sedesHorario.rows.map((s) => ({ ...s, principal: s.id === datos.sede_id })),
  };
}

// Solo actualiza las columnas que vienen en `campos` (permite vaciar los
// opcionales enviando '' -> se guarda null).
const COLUMNAS_EDITABLES = {
  nombreCompleto: 'nombre_completo',
  telefono: 'telefono',
  direccion: 'direccion',
  titulosProfesionales: 'titulos_profesionales',
  registroProfesional: 'registro_profesional',
  aniosExperiencia: 'anios_experiencia',
  biografia: 'biografia',
};

async function actualizar(medicoId, campos) {
  const asignaciones = [];
  const valores = [medicoId];
  Object.entries(COLUMNAS_EDITABLES).forEach(([clave, columna]) => {
    if (campos[clave] === undefined) return;
    valores.push(campos[clave] === '' ? null : campos[clave]);
    asignaciones.push(`${columna} = $${valores.length}`);
  });
  if (asignaciones.length > 0) {
    await pool.query(`UPDATE usuario SET ${asignaciones.join(', ')} WHERE id = $1`, valores);
  }
  return obtener(medicoId);
}

async function actualizarFoto(medicoId, fotoUrl) {
  const resultado = await pool.query(
    `UPDATE usuario u SET foto_url = $2
     FROM (SELECT foto_url AS anterior FROM usuario WHERE id = $1) previo
     WHERE u.id = $1 RETURNING previo.anterior`,
    [medicoId, fotoUrl]
  );
  return resultado.rows[0]?.anterior ?? null;
}

async function obtenerHashContrasena(usuarioId) {
  const resultado = await pool.query('SELECT contrasena_hash FROM usuario WHERE id = $1', [usuarioId]);
  return resultado.rows[0]?.contrasena_hash ?? null;
}

// --- Cambio de correo verificado -------------------------------------

async function guardarVerificacionCorreo(usuarioId, correoNuevo, codigoHash, expiraEn) {
  await pool.query(
    `INSERT INTO verificacion_correo (usuario_id, correo_nuevo, codigo_hash, intentos, expira_en, creado_en)
     VALUES ($1, $2, $3, 0, $4, NOW())
     ON CONFLICT (usuario_id)
     DO UPDATE SET correo_nuevo = $2, codigo_hash = $3, intentos = 0, expira_en = $4, creado_en = NOW()`,
    [usuarioId, correoNuevo, codigoHash, expiraEn]
  );
}

async function buscarVerificacionCorreo(usuarioId) {
  const resultado = await pool.query('SELECT * FROM verificacion_correo WHERE usuario_id = $1', [usuarioId]);
  return resultado.rows[0] || null;
}

async function incrementarIntentosCorreo(usuarioId) {
  await pool.query('UPDATE verificacion_correo SET intentos = intentos + 1 WHERE usuario_id = $1', [usuarioId]);
}

// Aplica el correo nuevo y borra la verificacion en una transaccion.
async function confirmarCambioCorreo(usuarioId, correoNuevo) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('UPDATE usuario SET correo = $2 WHERE id = $1', [usuarioId, correoNuevo]);
    await cliente.query('DELETE FROM verificacion_correo WHERE usuario_id = $1', [usuarioId]);
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

module.exports = {
  obtener,
  actualizar,
  actualizarFoto,
  obtenerHashContrasena,
  guardarVerificacionCorreo,
  buscarVerificacionCorreo,
  incrementarIntentosCorreo,
  confirmarCambioCorreo,
};
