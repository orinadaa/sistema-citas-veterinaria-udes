// scripts/crearSuperadmin.js
// Crea la cuenta del superadministrador. Es un paso manual y deliberado: el
// rol no se puede asignar desde el sistema (ver usuario.controller.js), asi
// nadie se lo otorga por error desde una pantalla.
//
// Uso (desde backend/):
//   SUPERADMIN_CORREO=correo@udes.edu.co SUPERADMIN_CONTRASENA=Temporal123 npm run crear:superadmin
// Opcional: SUPERADMIN_NOMBRE (por defecto "Superadministrador UDES").
//
// No toca ninguna cuenta existente: si el correo ya esta registrado, avisa
// y no hace nada. El superadministrador no pertenece a una sede.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { buscarPorCorreo, crearPersonal } = require('../models/usuario.model');

const RONDAS_SAL = 10;

async function crearSuperadmin() {
  const nombreCompleto = process.env.SUPERADMIN_NOMBRE || 'Superadministrador UDES';
  const correo = (process.env.SUPERADMIN_CORREO || '').trim().toLowerCase();
  const contrasena = process.env.SUPERADMIN_CONTRASENA || '';

  try {
    if (!correo || !contrasena) {
      throw new Error('Faltan SUPERADMIN_CORREO y SUPERADMIN_CONTRASENA.');
    }
    if (contrasena.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres.');
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
