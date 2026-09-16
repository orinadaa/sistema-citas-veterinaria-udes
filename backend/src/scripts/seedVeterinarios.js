// scripts/seedVeterinarios.js
// Siembra medicos de ejemplo y sus especialidades (que servicio presta
// cada uno), para poder probar el flujo de agendamiento de citas de
// principio a fin. La administracion real de medicos/especialidades
// (crear, editar, reasignar) es del panel administrativo, incremento 3;
// este script es solo el punto de partida, igual que seedAdmin.js.
//
// Uso: node src/scripts/seedVeterinarios.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { buscarPorCorreo, crearPersonal } = require('../models/usuario.model');
const { asignarServicio } = require('../models/medico.model');

const RONDAS_SAL = 10;
const CONTRASENA_TEMPORAL = 'CambiarEsta123';

const VETERINARIOS = [
  {
    nombreCompleto: 'Camilo Rueda Peña',
    correo: 'camilo.rueda@udes.edu.co',
    ciudadSede: 'Bucaramanga',
    servicios: ['Consulta médica', 'Vacunación', 'Desparasitación'],
  },
  {
    nombreCompleto: 'Valentina Ortiz Silva',
    correo: 'valentina.ortiz@udes.edu.co',
    ciudadSede: 'Bucaramanga',
    servicios: ['Cirugía', 'Laboratorio clínico', 'Radiología', 'Profilaxis dental', 'Oncología', 'Endoscopia'],
  },
  {
    nombreCompleto: 'Andrés Felipe Mendoza',
    correo: 'andres.mendoza@udes.edu.co',
    ciudadSede: 'Valledupar',
    servicios: ['Consulta médica', 'Vacunación', 'Desparasitación', 'Profilaxis dental'],
  },
  {
    nombreCompleto: 'Laura Camila Daza',
    correo: 'laura.daza@udes.edu.co',
    ciudadSede: 'Valledupar',
    servicios: ['Cirugía', 'Laboratorio clínico', 'Radiología', 'Oncología', 'Endoscopia'],
  },
];

async function seedVeterinarios() {
  try {
    for (const definicion of VETERINARIOS) {
      const existente = await buscarPorCorreo(definicion.correo);
      if (existente) {
        console.log(`Ya existe un usuario con el correo ${definicion.correo}. Se omite.`);
        continue;
      }

      const sedeResultado = await pool.query('SELECT id FROM sede WHERE ciudad = $1 LIMIT 1', [
        definicion.ciudadSede,
      ]);
      if (sedeResultado.rows.length === 0) {
        throw new Error(`No existe una sede en la ciudad "${definicion.ciudadSede}".`);
      }
      const sedeId = sedeResultado.rows[0].id;

      const contrasenaHash = await bcrypt.hash(CONTRASENA_TEMPORAL, RONDAS_SAL);
      const veterinario = await crearPersonal({
        nombreCompleto: definicion.nombreCompleto,
        correo: definicion.correo,
        contrasenaHash,
        rol: 'veterinario',
        sedeId,
      });

      for (const nombreServicio of definicion.servicios) {
        const servicioResultado = await pool.query('SELECT id FROM servicio WHERE nombre = $1', [
          nombreServicio,
        ]);
        if (servicioResultado.rows.length === 0) {
          console.warn(`Servicio "${nombreServicio}" no existe, se omite la asignación.`);
          continue;
        }
        await asignarServicio(veterinario.id, servicioResultado.rows[0].id);
      }

      console.log(
        `Veterinario creado: ${veterinario.nombre_completo} (${definicion.ciudadSede}) — ${definicion.servicios.join(', ')}`
      );
    }
    console.log(`\nContraseña temporal para todos: ${CONTRASENA_TEMPORAL}`);
  } catch (error) {
    console.error('Error al sembrar veterinarios:', error.message);
  } finally {
    await pool.end();
  }
}

seedVeterinarios();
