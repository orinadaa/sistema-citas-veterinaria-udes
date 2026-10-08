// scripts/seedGaleria.js
// Carga las fotos de ejemplo de la galeria del inicio (Hero): copia las
// de frontend/src/assets/galeria (version liviana de las fotos reales de
// identidadmarca/galeria) a backend/uploads/galeria y las registra en
// foto_galeria. Solo actua si la galeria esta vacia: nunca pisa lo que
// el administrador ya configuro desde Configuracion > Galeria.
//
// Uso: npm run seed:galeria   (requiere database/incremento_6a_galeria.sql)

require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const fs = require('fs/promises');
const { pool } = require('../config/db');
const galeriaModel = require('../models/galeria.model');
const { fotosGaleria } = require('../middlewares/subirFoto.middleware');

const CARPETA_EJEMPLOS = path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'assets', 'galeria');

const FOTOS_EJEMPLO = [
  { archivo: 'laboratorio.jpg', descripcion: 'Docente y estudiantes revisando una muestra en el laboratorio', focoX: 45, focoY: 40 },
  { archivo: 'consulta.jpg', descripcion: 'Veterinaria de la UDES examinando a un perro en consulta', focoX: 72, focoY: 50 },
  { archivo: 'cirugia.jpg', descripcion: 'Equipo de la clínica atendiendo a un gato en el quirófano', focoX: 50, focoY: 45 },
  { archivo: 'fachada.jpg', descripcion: 'Equipo de la clínica en la entrada de Medicina Veterinaria UDES', focoX: 50, focoY: 65 },
  { archivo: 'equipo.jpg', descripcion: 'Estudiantes y docentes de Medicina Veterinaria UDES en el quirófano', focoX: 55, focoY: 45 },
];

async function sembrar() {
  if ((await galeriaModel.contar()) > 0) {
    console.log('La galería ya tiene fotos: no se cargó ningún ejemplo.');
    return;
  }

  await fs.mkdir(fotosGaleria.carpeta, { recursive: true });
  for (const ejemplo of FOTOS_EJEMPLO) {
    const nombre = `${crypto.randomUUID()}${path.extname(ejemplo.archivo)}`;
    await fs.copyFile(path.join(CARPETA_EJEMPLOS, ejemplo.archivo), path.join(fotosGaleria.carpeta, nombre));
    await galeriaModel.crear({
      fotoUrl: `${fotosGaleria.rutaPublica}/${nombre}`,
      descripcion: ejemplo.descripcion,
      focoX: ejemplo.focoX,
      focoY: ejemplo.focoY,
    });
    console.log(`Foto de ejemplo cargada: ${ejemplo.archivo}`);
  }
}

sembrar()
  .catch((error) => {
    console.error('No se pudo cargar la galería de ejemplo:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
