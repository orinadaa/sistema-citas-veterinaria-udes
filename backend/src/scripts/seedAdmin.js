// scripts/seedAdmin.js
// Crea la primera cuenta de administrador. Es un paso de arranque manual:
// una vez existe un administrador, el resto de cuentas de personal se crean
// desde POST /api/usuarios (protegido por rol), no desde este script.
//
// Uso: node src/scripts/seedAdmin.js
// Variables opcionales (con valores por defecto para entorno local):
//   ADMIN_NOMBRE, ADMIN_CORREO, ADMIN_CONTRASENA, ADMIN_SEDE_CIUDAD

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { buscarPorCorreo, crearPersonal } = require('../models/usuario.model');

const RONDAS_SAL = 10;

async function seedAdmin() {
  const nombreCompleto = process.env.ADMIN_NOMBRE || 'Administrador UDES';
  const correo = process.env.ADMIN_CORREO || 'admin@udes.edu.co';
  const contrasena = process.env.ADMIN_CONTRASENA || 'CambiarEsta123';
  const ciudadSede = process.env.ADMIN_SEDE_CIUDAD || 'Bucaramanga';

  try {
    const existente = await buscarPorCorreo(correo);
    if (existente) {
      console.log(`Ya existe un usuario con el correo ${correo}. No se creó ningún registro.`);
      return;
    }

    const sedeResultado = await pool.query('SELECT id FROM sede WHERE ciudad = $1 LIMIT 1', [ciudadSede]);
    if (sedeResultado.rows.length === 0) {
      throw new Error(`No existe una sede en la ciudad "${ciudadSede}". Ejecute primero database/incremento_1_usuarios.sql.`);
    }
    const sedeId = sedeResultado.rows[0].id;

    const contrasenaHash = await bcrypt.hash(contrasena, RONDAS_SAL);
    const admin = await crearPersonal({
      nombreCompleto,
      correo,
      contrasenaHash,
      rol: 'administrador',
      sedeId,
    });

    console.log('Cuenta de administrador creada:');
    console.log({ correo: admin.correo, id: admin.id, sedeId: admin.sede_id });
    if (!process.env.ADMIN_CONTRASENA) {
      console.log(`Contraseña temporal: ${contrasena} (cámbiela después del primer inicio de sesión).`);
    }
  } catch (error) {
    console.error('Error al crear la cuenta de administrador:', error.message);
  } finally {
    await pool.end();
  }
}

seedAdmin();
