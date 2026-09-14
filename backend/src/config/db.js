// config/db.js
// Configura el pool de conexiones a PostgreSQL usando la libreria "pg".
// Un pool reutiliza conexiones en vez de abrir una nueva por cada consulta,
// lo cual es la practica recomendada para una API que atendera muchas
// peticiones concurrentes (agendamiento de citas, consultas, etc.).

const { Pool } = require('pg');

// Las credenciales se leen de las variables de entorno (definidas en .env).
// Nunca se deben escribir credenciales directamente en el codigo fuente.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Escucha errores inesperados en clientes inactivos del pool.
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

/**
 * Verifica que la conexion a la base de datos este funcionando.
 */
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() AS hora_servidor');
    return { ok: true, horaServidor: result.rows[0].hora_servidor };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

module.exports = { pool, testConnection };