// scripts/seedFotosServicios.js
// Carga las fotos predeterminadas de los servicios (las que ya mostraba la
// pagina publica)

require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const fs = require('fs/promises');
const { pool } = require('../config/db');
const { fotosServicios } = require('../middlewares/subirFoto.middleware');

const CARPETA_PREDETERMINADAS = path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'assets', 'servicios-foto');

const FOTOS = [
  { servicio: 'Consulta médica', archivo: 'consulta.png', descripcion: 'Veterinario auscultando a un perro sobre la mesa de consulta mientras una auxiliar lo sostiene', focoX: 52, focoY: 55, fondoClaro: true },
  { servicio: 'Cirugía', archivo: 'cirugia.webp', descripcion: 'Cirujano veterinario revisando a un perro blanco con collar isabelino', focoX: 48, focoY: 45, fondoClaro: false },
  { servicio: 'Desparasitación', archivo: 'desparasitacion.jpg', descripcion: 'Veterinaria aplicando tratamiento antiparasitario a un perro blanco con manchas', focoX: 42, focoY: 50, fondoClaro: true },
  { servicio: 'Laboratorio clínico', archivo: 'laboratorio.webp', descripcion: 'Toma de muestra de sangre de la pata de un perro para examen de laboratorio', focoX: 55, focoY: 50, fondoClaro: true },
  { servicio: 'Endoscopia', archivo: 'endoscopia.webp', descripcion: 'Dos veterinarios realizando una endoscopia mientras observan el monitor', focoX: 40, focoY: 40, fondoClaro: false },
  { servicio: 'Oncología', archivo: 'oncologia.png', descripcion: 'Dos veterinarios examinando a un perro pequeño sobre la mesa de tratamiento', focoX: 55, focoY: 65, fondoClaro: false },
  { servicio: 'Radiología', archivo: 'radiologia.jpg', descripcion: 'Personal veterinario con chalecos de protección posicionando a un perro en el equipo de rayos X', focoX: 58, focoY: 50, fondoClaro: true },
  { servicio: 'Profilaxis dental', archivo: 'profilaxis.jpg', descripcion: 'Veterinaria revisando los dientes de un perro blanco mientras un colega lo sostiene', focoX: 45, focoY: 35, fondoClaro: true },
  { servicio: 'Vacunación', archivo: 'vacunacion.jpg', descripcion: 'Veterinaria vacunando a un perro blanco mientras un colega lo sostiene', focoX: 40, focoY: 35, fondoClaro: true },
];

async function sembrar() {
  await fs.mkdir(fotosServicios.carpeta, { recursive: true });
  for (const foto of FOTOS) {
    const { rows } = await pool.query('SELECT id, foto_url FROM servicio WHERE nombre = $1', [foto.servicio]);
    if (rows.length === 0) {
      console.log(`Sin servicio "${foto.servicio}": se omite.`);
      continue;
    }
    if (rows[0].foto_url) {
      console.log(`"${foto.servicio}" ya tiene foto: no se toca.`);
      continue;
    }
    const nombre = `${crypto.randomUUID()}${path.extname(foto.archivo)}`;
    await fs.copyFile(path.join(CARPETA_PREDETERMINADAS, foto.archivo), path.join(fotosServicios.carpeta, nombre));
    await pool.query(
      `UPDATE servicio
       SET foto_url = $2, foto_descripcion = $3, foto_foco_x = $4, foto_foco_y = $5, foto_fondo_claro = $6
       WHERE id = $1`,
      [rows[0].id, `${fotosServicios.rutaPublica}/${nombre}`, foto.descripcion, foto.focoX, foto.focoY, foto.fondoClaro]
    );
    console.log(`Foto predeterminada cargada: ${foto.servicio}`);
  }
}

sembrar()
  .catch((error) => {
    console.error('No se pudieron cargar las fotos de los servicios:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
