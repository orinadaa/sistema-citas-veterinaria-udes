// scripts/crearSuperadmin.js
// Crea la cuenta del superadministrador.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { buscarPorCorreo, crearPersonal } = require('../models/usuario.model');
const { errorContrasena } = require('../utils/contrasena.util');

const RONDAS_SAL = 10;

async function crearSuperadmin() {
  const nombreCompleto = process.env.SUPERADMIN_NOMBRE || 'Superadministrador UDES';
  const correo = (process.env.SUPERADMIN_CORREO || '').trim().toLowerCase();
  const contrasena = process.env.SUPERADMIN_CONTRASENA || '';

  try {
    if (!correo || !contrasena) {
      throw new Error('Faltan SUPERADMIN_CORREO y SUPERADMIN_CONTRASENA.');
    }
    // La misma regla que el registro y el cambio de contraseña.
    const problema = errorContrasena(contrasena, correo);
    if (problema) {
      throw new Error(problema);
    }

    const existente = await buscarPorCorreo(correo);
    if (existente) {
      console.log(`Ya existe una cuenta con el correo ${correo} (rol: ${existente.rol}). No se creó ni se cambió nada.`);
      return;
    }

    const contrasenaHash = await bcrypt.hash(contrasena, RONDAS_SAL);
    const cuenta = await crearPersonal({ nombreCompleto, correo, contrasenaHash, rol: 'superadministrador', sedeId: null });
    console.log('Cuenta de superadministrador creada:', { id: cuenta.id, correo: cuenta.correo });
    console.log('Cambia la contraseña después del primer inicio de sesión (¿Olvidaste tu contraseña?).');
  } catch (error) {
    console.error('No se pudo crear el superadministrador:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

crearSuperadmin();
