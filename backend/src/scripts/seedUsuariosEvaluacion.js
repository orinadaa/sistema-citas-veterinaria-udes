// Cuentas ficticias para que los evaluadores puedan abrir cada perfil.
// Bloqueado fuera de una base PostgreSQL local. No ejecutar en AWS ni producción.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const CONTRASENA_EVALUACION = '1234';
const CUENTAS = [
  { nombre: 'Cliente de Evaluación', correo: 'clienteprueba@demo.udes.co', rol: 'cliente', telefono: '3000000001' },
  { nombre: 'Médico de Evaluación', correo: 'medicoprueba@demo.udes.co', rol: 'veterinario', telefono: '3000000002', sede: true },
  { nombre: 'Administrador de Evaluación', correo: 'adminprueba@demo.udes.co', rol: 'administrador', telefono: '3000000003', sede: true },
  { nombre: 'Superadministrador de Evaluación', correo: 'superadminprueba@demo.udes.co', rol: 'superadministrador', telefono: '3000000004' },
];

async function crearCuentasEvaluacion() {
  const host = String(process.env.DB_HOST || '').toLowerCase();
  const hostsLocales = new Set(['localhost', '127.0.0.1', '::1']);
  if (process.env.NODE_ENV === 'production' || !hostsLocales.has(host)) {
    throw new Error('Cuentas de evaluación bloqueadas: esta herramienta solo funciona con PostgreSQL local y fuera de producción.');
  }

  const hash = await bcrypt.hash(CONTRASENA_EVALUACION, 10);
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const sede = (await cliente.query("SELECT id FROM sede WHERE ciudad = 'Bucaramanga' AND activo = TRUE LIMIT 1")).rows[0];
    if (!sede) throw new Error('No existe una sede activa de Bucaramanga. Ejecute primero database/datos_iniciales.sql.');

    for (const cuenta of CUENTAS) {
      const existente = await cliente.query('SELECT rol FROM usuario WHERE correo = $1', [cuenta.correo]);
      if (existente.rowCount) {
        if (existente.rows[0].rol !== cuenta.rol) throw new Error(`El correo ${cuenta.correo} ya pertenece a otro perfil.`);
        continue;
      }
      await cliente.query(
        `INSERT INTO usuario (nombre_completo, correo, contrasena_hash, rol, sede_id, telefono, creado_en)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [cuenta.nombre, cuenta.correo, hash, cuenta.rol, cuenta.sede ? sede.id : null, cuenta.telefono]
      );
    }

    // Sin servicios asignados el médico no tiene franjas libres y el evaluador
    // no podría agendar: se le asignan los servicios activos del catálogo.
    // Usa el horario de la sede porque no tiene horario propio.
    await cliente.query(
      `INSERT INTO servicio_medico (servicio_id, medico_id)
       SELECT s.id, u.id
         FROM servicio s
         CROSS JOIN usuario u
        WHERE u.correo = 'medicoprueba@demo.udes.co'
          AND s.activo = TRUE
          AND NOT EXISTS (
            SELECT 1 FROM servicio_medico sm WHERE sm.servicio_id = s.id AND sm.medico_id = u.id
          )`
    );
    await cliente.query('COMMIT');
    console.log('Cuentas locales de evaluación disponibles:');
    for (const cuenta of CUENTAS) console.log(`- ${cuenta.rol}: ${cuenta.correo}`);
    console.log('Contraseña temporal de evaluación: 1234. Solo para una base local ficticia.');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
    await pool.end();
  }
}

crearCuentasEvaluacion().catch(async (error) => {
  console.error('No se crearon las cuentas de evaluación:', error.message);
  await pool.end();
  process.exitCode = 1;
});
