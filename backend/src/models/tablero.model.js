// models/tablero.model.js
// Consultas de los paneles de inicio.
const { pool } = require('../config/db');

// La semana va de lunes a domingo, en la hora local del servidor.
const INICIO_SEMANA = `date_trunc('week', CURRENT_DATE)`;

async function resumenSede(sedeId) {
  const [citasHoy, indicadores, porDia, medicosSinServicios, serviciosSinMedico, diasAbiertos] = await Promise.all([
    pool.query(
      `SELECT c.id, c.codigo, c.fecha_hora, c.duracion_minutos, c.estado,
              sv.nombre AS servicio_nombre, cat.color AS categoria_color,
              m.nombre_completo AS medico_nombre, cl.nombre_completo AS cliente_nombre,
              mc.nombre AS mascota_nombre, mc.especie AS mascota_especie
       FROM cita c
       JOIN servicio sv ON sv.id = c.servicio_id
       JOIN categoria_servicio cat ON cat.id = sv.categoria_id
       JOIN usuario m ON m.id = c.medico_id
       JOIN usuario cl ON cl.id = c.cliente_id
       JOIN mascota mc ON mc.id = c.mascota_id
       WHERE c.sede_id = $1 AND c.fecha_hora::date = CURRENT_DATE AND c.estado = 'agendada'
       ORDER BY c.fecha_hora`,
      [sedeId]
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE estado = 'agendada' AND fecha_hora::date = CURRENT_DATE)::int AS citas_hoy,
         COUNT(*) FILTER (WHERE estado = 'agendada' AND fecha_hora::date = CURRENT_DATE AND fecha_hora >= NOW())::int AS pendientes_hoy,
         COUNT(*) FILTER (WHERE estado = 'agendada' AND fecha_hora >= ${INICIO_SEMANA} AND fecha_hora < ${INICIO_SEMANA} + INTERVAL '7 days')::int AS citas_semana,
         COUNT(*) FILTER (WHERE estado = 'cancelada' AND fecha_hora >= ${INICIO_SEMANA} AND fecha_hora < ${INICIO_SEMANA} + INTERVAL '7 days')::int AS canceladas_semana
       FROM cita WHERE sede_id = $1`,
      [sedeId]
    ),
    // Una fila por dia de la semana en curso, tambien los que no tienen citas.
    pool.query(
      `SELECT d::date AS dia, COUNT(c.id)::int AS total
       FROM generate_series(${INICIO_SEMANA}, ${INICIO_SEMANA} + INTERVAL '6 days', INTERVAL '1 day') d
       LEFT JOIN cita c ON c.sede_id = $1 AND c.estado = 'agendada' AND c.fecha_hora::date = d::date
       GROUP BY d ORDER BY d`,
      [sedeId]
    ),
    // Medicos activos de la sede sin ningun servicio: nadie puede agendarles.
    pool.query(
      `SELECT u.id, u.nombre_completo
       FROM usuario u
       WHERE u.rol = 'veterinario' AND u.activo AND u.sede_id = $1
         AND NOT EXISTS (SELECT 1 FROM servicio_medico sm WHERE sm.medico_id = u.id)
       ORDER BY u.nombre_completo`,
      [sedeId]
    ),
    // Servicios activos que ningun medico activo de la sede presta: en esta
    // sede no se pueden agendar.
    pool.query(
      `SELECT s.id, s.nombre
       FROM servicio s
       WHERE s.activo
         AND NOT EXISTS (
           SELECT 1 FROM servicio_medico sm
           JOIN usuario u ON u.id = sm.medico_id
           WHERE sm.servicio_id = s.id AND u.activo AND u.rol = 'veterinario' AND u.sede_id = $1
         )
       ORDER BY s.nombre`,
      [sedeId]
    ),
    pool.query('SELECT COUNT(*)::int AS total FROM horario_atencion WHERE sede_id = $1', [sedeId]),
  ]);

  return {
    citasHoy: citasHoy.rows,
    indicadores: indicadores.rows[0],
    porDia: porDia.rows,
    medicosSinServicios: medicosSinServicios.rows,
    serviciosSinMedico: serviciosSinMedico.rows,
    diasAbiertos: diasAbiertos.rows[0].total,
  };
}

async function resumenSistema() {
  const [sedes, cuentas, servicios, galeria] = await Promise.all([
    pool.query(
      `SELECT s.id, s.nombre, s.ciudad, s.activo, s.es_principal, s.foto_url,
              (SELECT COUNT(*)::int FROM usuario u WHERE u.sede_id = s.id AND u.rol = 'administrador' AND u.activo) AS administradores,
              (SELECT COUNT(*)::int FROM usuario u WHERE u.sede_id = s.id AND u.rol = 'veterinario' AND u.activo) AS medicos,
              (SELECT COUNT(*)::int FROM horario_atencion h WHERE h.sede_id = s.id) AS dias_abiertos,
              (SELECT COUNT(*)::int FROM cita c WHERE c.sede_id = s.id AND c.estado = 'agendada'
                 AND c.fecha_hora >= date_trunc('month', CURRENT_DATE)
                 AND c.fecha_hora < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month') AS citas_mes
       FROM sede s ORDER BY s.es_principal DESC, s.nombre`
    ),
    pool.query(
      `SELECT rol, COUNT(*) FILTER (WHERE activo)::int AS activas, COUNT(*) FILTER (WHERE NOT activo)::int AS inactivas
       FROM usuario GROUP BY rol`
    ),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE activo)::int AS activos,
              COUNT(*) FILTER (WHERE activo AND foto_url IS NULL)::int AS sin_foto,
              COUNT(*) FILTER (WHERE activo AND NOT EXISTS (
                SELECT 1 FROM servicio_medico sm JOIN usuario u ON u.id = sm.medico_id
                WHERE sm.servicio_id = servicio.id AND u.activo))::int AS sin_medico
       FROM servicio`
    ),
    pool.query('SELECT COUNT(*) FILTER (WHERE activo)::int AS visibles, COUNT(*)::int AS total FROM foto_galeria'),
  ]);

  return { sedes: sedes.rows, cuentas: cuentas.rows, servicios: servicios.rows[0], galeria: galeria.rows[0] };
}

module.exports = { resumenSede, resumenSistema };
